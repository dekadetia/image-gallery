import { NextResponse } from 'next/server'

// Optional: your Firebase bucket name (from .env or hardcoded)
const BUCKET =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'tndrbtns.appspot.com'

/**
 * Handles requests like:
 *   https://www.tndr.ltd/images/40560.lost.in.new.york.1989.webp
 */
export async function GET(request, { params }) {
  try {
    const filename = params?.filename || params?.slug || ''
    if (!filename) {
      return NextResponse.json({ error: 'Missing filename' }, { status: 400 })
    }

    // Firebase expects *path encoding*, not full URI encoding
    // So we only encode spaces and special chars, not slashes
    const encoded = encodeURIComponent(filename).replace(/%2F/g, '/')
    const firebaseURL = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/images%2F${encoded}?alt=media`

    const res = await fetch(firebaseURL)

    if (!res.ok) {
      console.error(`Failed to fetch ${firebaseURL}: ${res.statusText}`)
      return NextResponse.json(
        { error: `Failed to fetch image (${res.status})` },
        { status: res.status }
      )
    }

    // Copy headers for content type and caching
    const headers = new Headers()
    const contentType = res.headers.get('content-type') || 'image/webp'
    headers.set('Content-Type', contentType)
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')

    // Stream the response body
    return new NextResponse(res.body, { status: 200, headers })
  } catch (err) {
    console.error('Proxy error:', err)
    return NextResponse.json(
      { error: 'Internal proxy error' },
      { status: 500 }
    )
  }
}
