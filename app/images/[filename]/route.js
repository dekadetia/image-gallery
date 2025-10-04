import { NextResponse } from 'next/server'

// Optional: your Firebase bucket name (from .env or hardcoded)
const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'tndrbtns.appspot.com'

/**
 * Proxy image requests like:
 *   https://www.tndr.ltd/images/40560.lost.in.new.york.1989.webp
 * to:
 *   https://firebasestorage.googleapis.com/v0/b/tndrbtns.appspot.com/o/images%2F40560.lost.in.new.york.1989.webp?alt=media
 */

export async function GET(request, { params }) {
  const filename = params.filename

  // Encode the filename for Firebase's URL structure
  const encodedName = encodeURIComponent(filename)
  const firebaseURL = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/images%2F${encodedName}?alt=media`

  try {
    // Stream from Firebase Storage
    const res = await fetch(firebaseURL, {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${res.statusText}` },
        { status: res.status }
      )
    }

    // Clone headers for better caching on Vercel Edge
    const headers = new Headers(res.headers)
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')

    return new NextResponse(res.body, {
      status: 200,
      headers,
    })
  } catch (err) {
    console.error('Proxy error:', err)
    return NextResponse.json(
      { error: 'Internal proxy error' },
      { status: 500 }
    )
  }
}
