import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

// SECURITY: JWT_SECRET MUST be set in environment variables
// In production, the app will refuse to start without it
// In development, a random secret is generated per restart (sessions won't persist across restarts)
// Uses lazy initialization so the module can be imported at build time without crashing
let _jwtSecret: Uint8Array | null = null;

function getJwtSecret(): Uint8Array {
  if (_jwtSecret) return _jwtSecret;

  let rawSecret: string;
  if (process.env.JWT_SECRET) {
    rawSecret = process.env.JWT_SECRET;
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable is required in production! Set a strong random string of at least 32 characters.');
  } else {
    rawSecret = randomBytes(64).toString('hex');
    console.warn('WARNING: JWT_SECRET not set. Using random secret for development (sessions reset on restart).');
  }

  _jwtSecret = new TextEncoder().encode(rawSecret);
  return _jwtSecret;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: 'customer' | 'admin';
  name: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(): Promise<JWTPayload> {
  const user = await getAuthUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function requireAdmin(): Promise<JWTPayload> {
  const user = await requireAuth();
  if (user.role !== 'admin') throw new Error('Forbidden');
  return user;
}
