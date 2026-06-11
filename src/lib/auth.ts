import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export function verifySession(request: NextRequest): string | null {
  const token = request.cookies.get('sb-session')?.value;
  if (!token) return null;

  try {
    const secret = process.env.AUTH_SECRET || '';
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;

    const payload = Buffer.from(payloadB64, 'base64').toString('utf-8');

    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSig) return null;

    // Check expiry
    const data = JSON.parse(payload);
    if (Date.now() > data.exp) return null;

    return data.user;
  } catch {
    return null;
  }
}
