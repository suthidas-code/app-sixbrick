import { NextRequest, NextResponse } from 'next/server';
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];

async function verifyToken(token: string): Promise<string | null> {
  try {
    const secret = process.env.AUTH_SECRET || '';
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;

    // Use atob instead of Buffer for Edge compatibility
    const payload = atob(payloadB64);

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedSig = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (signature !== expectedSig) return null;

    const data = JSON.parse(payload);
    if (Date.now() > data.exp) return null;

    return data.user;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Check session cookie
  const token = request.cookies.get('sb-session')?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
