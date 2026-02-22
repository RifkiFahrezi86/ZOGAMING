// Security utilities: rate limiting, input sanitization, validation

// ==========================================
// IN-MEMORY RATE LIMITER
// ==========================================
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  maxRequests: number;    // max requests per window
  windowMs: number;       // time window in milliseconds
}

export function checkRateLimit(
  identifier: string, 
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60 * 1000 }
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs };
  }

  entry.count++;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetIn = entry.resetTime - now;

  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetIn };
  }

  return { allowed: true, remaining, resetIn };
}

// ==========================================
// INPUT SANITIZATION
// ==========================================

/**
 * Strip HTML tags and dangerous characters from user input
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '')          // Remove HTML tags
    .replace(/javascript:/gi, '')      // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '')       // Remove event handlers (onclick=, etc.)
    .replace(/&lt;script/gi, '')      // Remove encoded script tags
    .replace(/&#/g, '')               // Remove HTML entities that could be malicious
    .trim();
}

/**
 * Sanitize and validate email
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') return null;
  const clean = email.toLowerCase().trim();
  // Basic email regex validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) return null;
  if (clean.length > 255) return null;
  return clean;
}

/**
 * Validate and sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') return '';
  return phone.replace(/[^0-9+\-\s()]/g, '').trim().slice(0, 50);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (typeof password !== 'string') {
    return { valid: false, error: 'Password harus berupa teks' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password minimal 8 karakter' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password maksimal 128 karakter' };
  }
  // Require at least one letter and one number
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'Password harus mengandung minimal 1 huruf' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password harus mengandung minimal 1 angka' };
  }
  return { valid: true };
}

/**
 * Sanitize a generic string field with max length
 */
export function sanitizeString(input: string, maxLength: number = 500): string {
  if (typeof input !== 'string') return '';
  return sanitizeInput(input).slice(0, maxLength);
}

/**
 * Validate and sanitize a numeric ID
 */
export function sanitizeId(id: string | number): number | null {
  const parsed = typeof id === 'string' ? parseInt(id, 10) : id;
  if (isNaN(parsed) || parsed <= 0 || parsed > 2147483647) return null;
  return parsed;
}

/**
 * Extract client IP from request for rate limiting
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

// ==========================================
// RATE LIMIT PRESETS
// ==========================================

export const RATE_LIMITS = {
  // Auth endpoints - stricter
  login: { maxRequests: 5, windowMs: 60 * 1000 },           // 5 per minute
  register: { maxRequests: 3, windowMs: 60 * 1000 },        // 3 per minute
  forgotPassword: { maxRequests: 3, windowMs: 5 * 60 * 1000 }, // 3 per 5 min
  resetPassword: { maxRequests: 5, windowMs: 60 * 1000 },   // 5 per minute
  
  // General API - moderate
  api: { maxRequests: 60, windowMs: 60 * 1000 },            // 60 per minute
  adminApi: { maxRequests: 30, windowMs: 60 * 1000 },       // 30 per minute
  
  // Seed - very strict
  seed: { maxRequests: 2, windowMs: 60 * 60 * 1000 },       // 2 per hour
};
