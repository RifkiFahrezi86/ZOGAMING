import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// AES-256-GCM encryption for storing viewable passwords (admin only)
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// SECURITY: ENCRYPTION_KEY MUST be set in environment for password decryption to work
let _encryptionKeyCache: Buffer | null = null;

function getEncryptionKey(): Buffer {
  if (_encryptionKeyCache) return _encryptionKeyCache;
  
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: ENCRYPTION_KEY environment variable is required in production!');
    }
    console.warn('WARNING: ENCRYPTION_KEY not set. Password encryption will use a dev-only key.');
    _encryptionKeyCache = scryptSync('dev-only-insecure-key', randomBytes(16).toString('hex'), KEY_LENGTH);
    return _encryptionKeyCache;
  }
  
  // Use HMAC-based salt derived from the secret itself for deterministic key derivation
  const salt = scryptSync(secret, 'zogaming-kdf-v2', 16);
  _encryptionKeyCache = scryptSync(secret, salt, KEY_LENGTH);
  return _encryptionKeyCache;
}

/**
 * Encrypt a plain text password for admin viewing
 * Format: iv:authTag:encrypted (all in hex)
 */
export function encryptPassword(plainPassword: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plainPassword, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an encrypted password for admin viewing
 */
export function decryptPassword(encryptedData: string): string {
  try {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    if (!ivHex || !authTagHex || !encrypted) {
      return '(tidak tersedia)';
    }
    
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch {
    return '(tidak tersedia)';
  }
}
