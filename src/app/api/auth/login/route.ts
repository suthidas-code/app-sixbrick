import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { status: 'error', message: 'กรุณากรอก Username และ Password' },
        { status: 400 }
      );
    }

    const salt = process.env.AUTH_SALT || '';
    const secret = process.env.AUTH_SECRET || '';
    const usersStr = process.env.AUTH_USERS || '';

    // Hash the incoming password with salt
    const inputHash = crypto
      .createHash('sha256')
      .update(salt + password)
      .digest('hex');

    // Parse stored users: "user1:hash1,user2:hash2"
    const validUsers = usersStr.split(',').reduce((acc, entry) => {
      const [u, h] = entry.split(':');
      if (u && h) acc[u.trim()] = h.trim();
      return acc;
    }, {} as Record<string, string>);

    const storedHash = validUsers[username.trim()];

    if (!storedHash || storedHash !== inputHash) {
      return NextResponse.json(
        { status: 'error', message: 'Username หรือ Password ไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // Create session token (HMAC-signed)
    const payload = JSON.stringify({
      user: username.trim(),
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    const token = Buffer.from(payload).toString('base64') + '.' + signature;

    // Set HTTP-only cookie
    const response = NextResponse.json({
      status: 'success',
      message: 'เข้าสู่ระบบสำเร็จ',
      user: username.trim(),
    });

    response.cookies.set('sb-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours in seconds
    });

    return response;
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  }
}
