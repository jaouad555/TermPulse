/**
 * AES-GCM Encrypted Storage Vault with HTTP Non-Secure Context Fallback
 * Mirrors Android Keystore + EncryptedSharedPreferences
 */

const VAULT_KEY_NAME = 'termpulse_vault_master_key_v1';

// Check if modern WebCrypto subtle API is available (HTTPS or localhost)
const isSubtleCryptoAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!window.crypto && !!window.crypto.subtle;
};

// Fallback obfuscation cipher for plain HTTP (non-secure context)
function fallbackEncrypt(plainText: string): string {
  try {
    const salt = 'TermPulse_Keystore_Salt_';
    const combined = salt + plainText;
    const utf8 = encodeURIComponent(combined);
    let result = '';
    for (let i = 0; i < utf8.length; i++) {
      result += String.fromCharCode(utf8.charCodeAt(i) ^ 0x5a);
    }
    return 'fallback:' + btoa(result);
  } catch (e) {
    return 'raw:' + btoa(unescape(encodeURIComponent(plainText)));
  }
}

function fallbackDecrypt(cipherText: string): string {
  try {
    if (cipherText.startsWith('raw:')) {
      return decodeURIComponent(escape(atob(cipherText.slice(4))));
    }
    if (cipherText.startsWith('fallback:')) {
      const raw = atob(cipherText.slice(9));
      let result = '';
      for (let i = 0; i < raw.length; i++) {
        result += String.fromCharCode(raw.charCodeAt(i) ^ 0x5a);
      }
      const decoded = decodeURIComponent(result);
      const salt = 'TermPulse_Keystore_Salt_';
      return decoded.startsWith(salt) ? decoded.slice(salt.length) : decoded;
    }
    // Attempt standard base64
    return decodeURIComponent(escape(atob(cipherText)));
  } catch (e) {
    try {
      return atob(cipherText);
    } catch {
      return cipherText;
    }
  }
}

async function getOrCreateMasterKey(): Promise<CryptoKey | null> {
  if (!isSubtleCryptoAvailable()) return null;

  try {
    const existingRaw = localStorage.getItem(VAULT_KEY_NAME);
    if (existingRaw) {
      try {
        const rawBytes = Uint8Array.from(atob(existingRaw), c => c.charCodeAt(0));
        return await window.crypto.subtle.importKey(
          'raw',
          rawBytes,
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        );
      } catch {
        // Fall through to generate new key if corrupted
      }
    }

    const newKey = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const exported = await window.crypto.subtle.exportKey('raw', newKey);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    localStorage.setItem(VAULT_KEY_NAME, base64);
    return newKey;
  } catch (err) {
    console.warn('WebCrypto subtle key generation failed, falling back:', err);
    return null;
  }
}

export async function encryptSecret(plainText: string): Promise<string> {
  if (!plainText) return '';

  if (isSubtleCryptoAvailable()) {
    try {
      const key = await getOrCreateMasterKey();
      if (key) {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(plainText);

        const cipherBuffer = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          encoded
        );

        const cipherArray = new Uint8Array(cipherBuffer);
        const combined = new Uint8Array(iv.length + cipherArray.length);
        combined.set(iv);
        combined.set(cipherArray, iv.length);

        return 'aes:' + btoa(String.fromCharCode(...combined));
      }
    } catch (err) {
      console.warn('WebCrypto encryption failed, using fallback:', err);
    }
  }

  return fallbackEncrypt(plainText);
}

export async function decryptSecret(cipherBase64: string): Promise<string> {
  if (!cipherBase64) return '';

  if (cipherBase64.startsWith('fallback:') || cipherBase64.startsWith('raw:')) {
    return fallbackDecrypt(cipherBase64);
  }

  const cleanCipher = cipherBase64.startsWith('aes:') ? cipherBase64.slice(4) : cipherBase64;

  if (isSubtleCryptoAvailable()) {
    try {
      const key = await getOrCreateMasterKey();
      if (key) {
        const combined = Uint8Array.from(atob(cleanCipher), c => c.charCodeAt(0));
        const iv = combined.slice(0, 12);
        const cipherText = combined.slice(12);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          key,
          cipherText
        );

        return new TextDecoder().decode(decryptedBuffer);
      }
    } catch (err) {
      console.warn('WebCrypto decryption failed, trying fallback:', err);
    }
  }

  return fallbackDecrypt(cipherBase64);
}
