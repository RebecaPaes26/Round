import { NextResponse } from 'next/server';
import { accessPassword, authCookieName, authToken } from '../../../../src/lib/auth';

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const password = String(payload.password || '');

  if (password !== accessPassword()) {
    return NextResponse.json({ ok: false, message: 'Senha invalida.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(authCookieName, authToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return response;
}
