import { getDatabase, withTransaction } from '@/lib/database';
import { isAllowedMutationOrigin, isLocalHost } from '@/lib/local-access';
import { validateVaultEnvelope, type StoredVault, type VaultEnvelope } from '@/lib/vault';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DbVault = {
  revision: string;
  envelope: string;
  updated_at: string;
};
const ownerId = 'local';
function json(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
  });
}
function error(message: string, status = 400) {
  return json({ error: message }, status);
}
function readVault(): StoredVault | null {
  const row = getDatabase()
    .prepare('SELECT revision,envelope,updated_at FROM vaults WHERE owner_id=?')
    .get(ownerId) as DbVault | undefined;
  if (!row) return null;
  const envelope = JSON.parse(row.envelope) as VaultEnvelope;
  if (!validateVaultEnvelope(envelope)) throw new Error('Invalid stored vault');
  return { envelope, revision: row.revision, updatedAt: row.updated_at };
}
export async function GET(request: Request) {
  if (!isLocalHost(request.headers.get('host'))) return error('Acceso local requerido.', 403);
  try {
    return json({ vault: readVault() });
  } catch (cause) {
    console.error('vault read failed', cause);
    return error('No se pudo cargar la bóveda.', 500);
  }
}
export async function POST(request: Request) {
  if (
    !isAllowedMutationOrigin(
      request.headers.get('origin'),
      request.headers.get('host'),
      request.headers.get('sec-fetch-site'),
    )
  )
    return error('Origen no permitido.', 403);
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return error('Se requieren datos JSON.', 415);
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 750_000) return error('La bóveda es demasiado grande.', 413);
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return error('Solicitud inválida.');
    body = parsed as Record<string, unknown>;
  } catch {
    return error('Solicitud inválida.');
  }
  if (!validateVaultEnvelope(body.envelope)) return error('Datos cifrados inválidos.');
  const envelope = body.envelope;
  try {
    if (body.action === 'initialize') {
      const revision = crypto.randomUUID();
      const updatedAt = new Date().toISOString();
      const created = withTransaction(
        (database) =>
          database
            .prepare(
              'INSERT OR IGNORE INTO vaults (owner_id,revision,envelope,updated_at) VALUES (?,?,?,?)',
            )
            .run(ownerId, revision, JSON.stringify(envelope), updatedAt).changes,
      );
      return created
        ? json({ vault: { envelope, revision, updatedAt } }, 201)
        : error('Ya existe una bóveda. Actualiza la página.', 409);
    }
    if (body.action === 'save') {
      const before = readVault();
      if (!before) return error('Primero crea o restaura la bóveda.', 404);
      if (body.baseRevision !== before.revision)
        return error('La bóveda cambió en otra sesión. Recarga antes de guardar.', 409);
      if (
        envelope.salt !== before.envelope.salt ||
        envelope.iterations !== before.envelope.iterations ||
        envelope.kdf !== before.envelope.kdf
      )
        return error('La configuración de cifrado no coincide.');
      const revision = crypto.randomUUID();
      const updatedAt = new Date().toISOString();
      const changed = withTransaction(
        (database) =>
          database
            .prepare(
              'UPDATE vaults SET revision=?,envelope=?,updated_at=? WHERE owner_id=? AND revision=?',
            )
            .run(revision, JSON.stringify(envelope), updatedAt, ownerId, before.revision).changes,
      );
      return changed
        ? json({ vault: { envelope, revision, updatedAt } })
        : error('La bóveda cambió en otra sesión. Recarga antes de guardar.', 409);
    }
    return error('Acción no válida.');
  } catch (cause) {
    console.error('vault write failed', cause);
    return error('No se pudo guardar la bóveda.', 500);
  }
}
