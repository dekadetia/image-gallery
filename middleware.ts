// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ✅ Any /film/... URL should serve the /indx page
  if (pathname.startsWith("/film/")) {
    const url = request.nextUrl.clone()
    url.pathname = "/indx"
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/film/:path*"], // apply only to /film/ routes
}
