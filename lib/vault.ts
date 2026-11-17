export const VAULT_FORMAT = 'red-institucional-vault';
export const VAULT_VERSION = 1;
export const VAULT_ITERATIONS = 600_000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const associatedData = encoder.encode('red-institucional-vault-v1');

export type VaultEntry = {
  id: string;
  title: string;
  site: string;
  linkedRecordId: string;
  category: string;
  username: string;
  password: string;
  address: string;
  notes: string;
  updatedAt: string;
};
export type VaultEvent = {
  id: string;
  action: 'created' | 'updated' | 'deleted' | 'imported';
  title: string;
  at: string;
};
export type VaultDocument = {
  version: 1;
  entries: VaultEntry[];
  events: VaultEvent[];
};
export type VaultEnvelope = {
  format: typeof VAULT_FORMAT;
  version: 1;
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
};
export type StoredVault = {
  envelope: VaultEnvelope;
  revision: string;
  updatedAt: string;
};
export type VaultBackup = {
  format: 'red-institucional-vault-backup';
  version: 1;
  exportedAt: string;
  envelope: VaultEnvelope;
};

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}
function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binary);
}
function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) {
    throw new Error('El respaldo contiene datos cifrados inválidos.');
  }
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function isText(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length <= max;
}
export function validateVaultEnvelope(value: unknown): value is VaultEnvelope {
  if (!isObject(value)) return false;
  if (
    value.format !== VAULT_FORMAT ||
    value.version !== VAULT_VERSION ||
    value.kdf !== 'PBKDF2-SHA256' ||
    !Number.isInteger(value.iterations) ||
    (value.iterations as number) < VAULT_ITERATIONS ||
    (value.iterations as number) > 2_000_000 ||
    !isText(value.salt, 64) ||
    !isText(value.iv, 32) ||
    !isText(value.ciphertext, 700_000)
  )
    return false;
  try {
    return (
      fromBase64(value.salt).length === 16 &&
      fromBase64(value.iv).length === 12 &&
      fromBase64(value.ciphertext).length >= 16 &&
      fromBase64(value.ciphertext).length <= 500_000
    );
  } catch {
    return false;
  }
}
export function validateVaultDocument(value: unknown): value is VaultDocument {
  if (!isObject(value) || value.version !== 1) return false;
  if (!Array.isArray(value.entries) || !Array.isArray(value.events)) return false;
  if (value.entries.length > 500 || value.events.length > 200) return false;
  const ids = new Set<string>();
  for (const item of value.entries) {
    if (!isObject(item)) return false;
    if (
      !isText(item.id, 80) ||
      !item.id ||
      ids.has(item.id) ||
      !isText(item.title, 160) ||
      !item.title.trim() ||
      !isText(item.site, 100) ||
      !isText(item.linkedRecordId, 80) ||
      !isText(item.category, 100) ||
      !isText(item.username, 300) ||
      !isText(item.password, 3000) ||
      !isText(item.address, 500) ||
      !isText(item.notes, 4000) ||
      !isText(item.updatedAt, 40)
    )
      return false;
    ids.add(item.id);
  }
  return value.events.every(
    (item) =>
      isObject(item) &&
      isText(item.id, 80) &&
      ['created', 'updated', 'deleted', 'imported'].includes(String(item.action)) &&
      isText(item.title, 160) &&
      isText(item.at, 40),
  );
}
export function emptyVaultDocument(): VaultDocument {
  return { version: 1, entries: [], events: [] };
}
export function vaultEvent(
  action: VaultEvent['action'],
  title: string,
  earlier: VaultEvent[],
): VaultEvent[] {
  return [
    { id: crypto.randomUUID(), action, title, at: new Date().toISOString() },
    ...earlier,
  ].slice(0, 200);
}
export async function deriveVaultKey(
  passphrase: string,
  salt: string,
  iterations: number,
): Promise<CryptoKey> {
  if (!passphrase) throw new Error('Escribe la frase maestra.');
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromBase64(salt), iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}
export async function encryptVaultDocument(
  document: VaultDocument,
  key: CryptoKey,
  salt: string,
  iterations = VAULT_ITERATIONS,
): Promise<VaultEnvelope> {
  if (!validateVaultDocument(document)) throw new Error('Los datos de la bóveda no son válidos.');
  const iv = randomBytes(12);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: associatedData },
    key,
    encoder.encode(JSON.stringify(document)),
  );
  return {
    format: VAULT_FORMAT,
    version: 1,
    kdf: 'PBKDF2-SHA256',
    iterations,
    salt,
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  };
}
export async function createVault(
  passphrase: string,
): Promise<{ key: CryptoKey; envelope: VaultEnvelope; document: VaultDocument }> {
  if (passphrase.trim().length < 14) {
    throw new Error('La frase maestra debe tener al menos 14 caracteres.');
  }
  const salt = toBase64(randomBytes(16));
  const key = await deriveVaultKey(passphrase, salt, VAULT_ITERATIONS);
  const document = emptyVaultDocument();
  const envelope = await encryptVaultDocument(document, key, salt);
  return { key, envelope, document };
}
export async function decryptVault(
  envelope: VaultEnvelope,
  passphrase: string,
): Promise<{ key: CryptoKey; document: VaultDocument }> {
  if (!validateVaultEnvelope(envelope)) throw new Error('El respaldo cifrado no es válido.');
  try {
    const key = await deriveVaultKey(passphrase, envelope.salt, envelope.iterations);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(envelope.iv), additionalData: associatedData },
      key,
      fromBase64(envelope.ciphertext),
    );
    const document = JSON.parse(decoder.decode(plaintext)) as unknown;
    if (!validateVaultDocument(document)) throw new Error('Formato interno no válido.');
    return { key, document };
  } catch {
    throw new Error('No se pudo abrir la bóveda. Comprueba la frase maestra o el respaldo.');
  }
}
export function makeVaultBackup(envelope: VaultEnvelope): VaultBackup {
  if (!validateVaultEnvelope(envelope)) throw new Error('La bóveda cifrada no es válida.');
  return {
    format: 'red-institucional-vault-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    envelope,
  };
}
export function parseVaultBackup(source: string): VaultBackup {
  if (source.length > 750_000) throw new Error('El respaldo es demasiado grande.');
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    throw new Error('El archivo no contiene un respaldo válido.');
  }
  if (
    !isObject(value) ||
    value.format !== 'red-institucional-vault-backup' ||
    value.version !== 1 ||
    !isText(value.exportedAt, 40) ||
    !validateVaultEnvelope(value.envelope)
  )
    throw new Error('El archivo no contiene un respaldo cifrado compatible.');
  return value as VaultBackup;
}
