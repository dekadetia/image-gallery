import { NextResponse } from "next/server";

// ✅ Use the Edge runtime for instant response
export const runtime = "edge";

// ✅ Your Firebase bucket name
const BUCKET = "tndrbtns.appspot.com";

export async function GET(request, { params }) {
  try {
    const filename = params?.filename || "";
    if (!filename) {
      return NextResponse.json({ error: "Missing filename" }, { status: 400 });
    }

    // ✅ Encode only once — Firebase expects %2F for slashes
    const encoded = encodeURIComponent(filename);
    const firebaseURL = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/images%2F${encoded}?alt=media`;

    // ✅ Temporary redirect (302) — browser will fetch directly from Firebase
    return NextResponse.redirect(firebaseURL, 302);
  } catch (err) {
    console.error("Redirect error:", err);
    return NextResponse.json({ error: "Redirect failed" }, { status: 500 });
  }
}
