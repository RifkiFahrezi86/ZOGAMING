import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// IMPORTANT: Set JWT_SECRET in environment variables for production!
const rawSecret = process.env.JWT_SECRET || 'zogaming-secret-key-2024-change-in-production';
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('WARNING: JWT_SECRET is not set! Using default secret is INSECURE in production.');
}
const JWT_SECRET = new TextEncoder().encode(rawSecret);

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
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
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
