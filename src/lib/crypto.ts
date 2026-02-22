import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// AES-256-GCM encryption for storing viewable passwords (admin only)
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || 'zogaming-enc-key-change-in-prod-2024';
  return scryptSync(secret, 'zogaming-salt', KEY_LENGTH);
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
