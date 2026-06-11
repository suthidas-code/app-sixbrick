import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    status: 'success',
    message: 'ออกจากระบบสำเร็จ',
  });

  response.cookies.set('sb-session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0, // Delete immediately
  });

  return response;
}
