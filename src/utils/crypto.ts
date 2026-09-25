/**
 * AES-GCM Encrypted Storage Vault
 * Mirrors Android Keystore + EncryptedSharedPreferences
 */

const VAULT_KEY_NAME = 'termpulse_vault_master_key_v1';

async function getOrCreateMasterKey(): Promise<CryptoKey> {
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
}

export async function encryptSecret(plainText: string): Promise<string> {
  if (!plainText) return '';
  const key = await getOrCreateMasterKey();
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

  return btoa(String.fromCharCode(...combined));
}

export async function decryptSecret(cipherBase64: string): Promise<string> {
  if (!cipherBase64) return '';
  try {
    const key = await getOrCreateMasterKey();
    const combined = Uint8Array.from(atob(cipherBase64), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const cipherText = combined.slice(12);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherText
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    console.error('Failed to decrypt credential from vault:', err);
    return '';
  }
}
