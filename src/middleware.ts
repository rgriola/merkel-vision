import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle @username URLs (e.g., /@johndoe → /johndoe, /@johndoe/following → /johndoe/following)
  if (pathname.startsWith('/@')) {
    const pathWithoutAt = pathname.slice(2); // Remove /@ to get username/rest/of/path
    const url = request.nextUrl.clone();
    url.pathname = `/${pathWithoutAt}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
