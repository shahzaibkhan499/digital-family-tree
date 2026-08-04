import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  if (req.cookies.has('auth_token')) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
