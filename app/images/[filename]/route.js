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
    const encoded = encodeURIComponent(filename).replace(/%2F/g, '/')

    // 🔍 Step 1: Fetch metadata to get 'updated' timestamp
    const metaURL = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/images%2F${encoded}`
    const metaRes = await fetch(metaURL)
    const meta = await metaRes.json()
    const updated = meta?.updated ? new Date(meta.updated).getTime() : Date.now()

    // 🔁 Step 2: Add timestamp-based cache-buster
    const firebaseURL = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/images%2F${encoded}?alt=media&v=${updated}`

    // Fetch the actual media file
    const res = await fetch(firebaseURL)

    if (!res.ok) {
      console.error(`Failed to fetch ${firebaseURL}: ${res.statusText}`)
      return NextResponse.json(
        { error: `Failed to fetch image (${res.status})` },
        { status: res.status }
      )
    }

    // Copy headers for content type and shorter caching
    const headers = new Headers()
    const contentType = res.headers.get('content-type') || 'image/webp'
    headers.set('Content-Type', contentType)

    // ⚙️ Cache for 60 seconds max to allow quick overwrite propagation
    headers.set('Cache-Control', 'public, max-age=60')

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
