import { NextResponse } from "next/server";

const BUCKET =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "tndrbtns.appspot.com";

/**
 * Streams media (images, webms, etc.) from Firebase Storage
 * while preserving Range requests for fast video playback.
 *
 * Example:
 *   https://www.tndr.ltd/images/40560.lost.in.new.york.1989.webp
 */
export async function GET(request, { params }) {
  try {
    const filename = params?.filename || params?.slug || "";
    if (!filename) {
      return NextResponse.json({ error: "Missing filename" }, { status: 400 });
    }

    // Firebase expects path encoding, not full URI encoding
    const encoded = encodeURIComponent(filename).replace(/%2F/g, "/");

    // Step 1: fetch metadata (for updated timestamp cache-buster)
    const metaURL = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/images%2F${encoded}`;
    const metaRes = await fetch(metaURL);
    const meta = await metaRes.json();
    const updated = meta?.updated ? new Date(meta.updated).getTime() : Date.now();

    // Step 2: build media URL with timestamp param
    const firebaseURL = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/images%2F${encoded}?alt=media&v=${updated}`;

    // --- 🔁 Stream fetch preserving Range headers ---
    const forwardedHeaders = {};
    for (const [key, value] of request.headers.entries()) {
      // forward range + cache validators
      if (["range", "if-none-match", "if-modified-since"].includes(key.toLowerCase())) {
        forwardedHeaders[key] = value;
      }
    }

    const res = await fetch(firebaseURL, { headers: forwardedHeaders, method: "GET" });
    if (!res.ok && res.status !== 206) {
      console.error(`Failed to fetch ${firebaseURL}: ${res.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch media (${res.status})` },
        { status: res.status }
      );
    }

    // --- 🧠 Copy/clean headers for proper streaming + caching ---
    const outHeaders = new Headers();
    const allowList = [
      "content-type",
      "content-length",
      "accept-ranges",
      "content-range",
      "etag",
      "last-modified",
      "cache-control",
    ];

    for (const [key, value] of res.headers.entries()) {
      if (allowList.includes(key.toLowerCase())) {
        outHeaders.set(key, value);
      }
    }

    // Wide cache for images, short for video
    const type = res.headers.get("content-type") || "";
    if (type.startsWith("video/")) {
      outHeaders.set("Cache-Control", "public, max-age=3600"); // 1 h for videos
    } else {
      outHeaders.set("Cache-Control", "public, max-age=60"); // 1 min for images
    }

    outHeaders.set("Access-Control-Allow-Origin", "*");

    // --- ✅ Return streaming response ---
    return new NextResponse(res.body, {
      status: res.status,
      headers: outHeaders,
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return NextResponse.json({ error: "Internal proxy error" }, { status: 500 });
  }
}
