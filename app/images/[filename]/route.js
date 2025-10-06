import { NextResponse } from "next/server";

const BUCKET =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "tndrbtns.appspot.com";

export async function GET(request, { params }) {
  const filename = params?.filename || "";
  if (!filename) {
    return NextResponse.json({ error: "Missing filename" }, { status: 400 });
  }

  // Build the Firebase URL (this fetches the image directly)
  const encoded = encodeURIComponent(filename).replace(/%2F/g, "/");
  const firebaseURL = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/images%2F${encoded}?alt=media`;

  try {
    const res = await fetch(firebaseURL, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Firebase responded with ${res.status}` },
        { status: res.status }
      );
    }

    // Add long-term cache headers so Vercel caches the result
    const headers = new Headers(res.headers);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(res.body, { headers });
  } catch (err) {
    console.error("Proxy error:", err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
