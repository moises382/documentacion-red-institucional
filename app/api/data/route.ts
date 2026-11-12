import { getDatabase, withTransaction } from '@/lib/database';
import { describeChange, validateRecord } from '@/lib/record-validation';
import { isAllowedMutationOrigin, isLocalHost } from '@/lib/local-access';
import type { RecordItem } from '@/lib/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DbRecord = {
  id: string;
  kind: string;
  name: string;
  site: string;
  location: string;
  verification: string;
  payload: string;
  created_at: string;
  updated_at: string;
};
type DbChange = {
  id: string;
  record_id: string;
  action: string;
  kind: string;
  name: string;
  site: string;
  actor: string;
  description: string;
  occurred_at: string;
};
function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
}
function error(message: string, status = 400) {
  return json({ error: message }, status);
}
function asRecord(row: DbRecord): RecordItem {
  return {
    id: row.id,
    kind: row.kind as RecordItem['kind'],
    name: row.name,
    site: row.site as RecordItem['site'],
    location: row.location,
    verification: row.verification as RecordItem['verification'],
    payload: JSON.parse(row.payload),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
function recordById(id: string): RecordItem | null {
  const row = getDatabase().prepare('SELECT * FROM records WHERE id = ?').get(id) as
    | DbRecord
    | undefined;
  return row ? asRecord(row) : null;
}

export async function GET(request: Request) {
  if (!isLocalHost(request.headers.get('host'))) return error('Acceso local requerido.', 403);
  try {
    const database = getDatabase();
    const records = (
      database.prepare('SELECT * FROM records ORDER BY updated_at DESC').all() as DbRecord[]
    ).map(asRecord);
    const changes = (
      database
        .prepare('SELECT * FROM changes ORDER BY occurred_at DESC LIMIT 500')
        .all() as DbChange[]
    ).map((change) => ({
      id: change.id,
      recordId: change.record_id,
      action: change.action,
      kind: change.kind,
      name: change.name,
      site: change.site,
      actor: change.actor,
      description: change.description,
      occurredAt: change.occurred_at,
    }));
    return json({ records, changes });
  } catch (cause) {
    console.error('data read failed', cause);
    return error('No se pudo cargar la documentación.', 500);
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
    if (raw.length > 25000) return error('La solicitud es demasiado grande.', 413);
    body = JSON.parse(raw) as Record<string, unknown>;
    if (!body || typeof body !== 'object' || Array.isArray(body))
      return error('La solicitud no contiene datos válidos.');
  } catch {
    return error('La solicitud no contiene datos válidos.');
  }
  const id = typeof body.id === 'string' ? body.id : '';
  const actor = 'Usuario local';
  try {
    if (body.action === 'create') {
      const checked = validateRecord(body.record);
      if (!checked.value) return error(checked.message ?? 'Registro no válido.');
      const item = checked.value;
      const recordId = crypto.randomUUID();
      const now = new Date().toISOString();
      withTransaction((database) => {
        database
          .prepare(
            'INSERT INTO records (id,kind,name,site,location,verification,payload,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)',
          )
          .run(
            recordId,
            item.kind,
            item.name,
            item.site,
            item.location,
            item.verification,
            JSON.stringify(item.payload),
            now,
            now,
          );
        database
          .prepare(
            'INSERT INTO changes (id,record_id,action,kind,name,site,actor,description,occurred_at) VALUES (?,?,?,?,?,?,?,?,?)',
          )
          .run(
            crypto.randomUUID(),
            recordId,
            'creado',
            item.kind,
            item.name,
            item.site,
            actor,
            'Registro creado.',
            now,
          );
      });
      return json({ ok: true, id: recordId });
    }
    if (!id || id.length > 80) return error('Identificador no válido.');
    const before = recordById(id);
    if (!before) return error('El registro ya no existe.', 404);
    if (body.action === 'update') {
      if (body.baseUpdatedAt !== before.updatedAt)
        return error(
          'Este registro cambió en otra sesión. Actualiza la vista antes de guardar.',
          409,
        );
      const checked = validateRecord(body.record);
      if (!checked.value) return error(checked.message ?? 'Registro no válido.');
      const item = checked.value;
      if (item.kind !== before.kind) return error('No se puede cambiar el tipo de registro.');
      const now = new Date(Math.max(Date.now(), Date.parse(before.updatedAt) + 1)).toISOString();
      const changed = withTransaction((database) => {
        const result = database
          .prepare(
            'UPDATE records SET name=?,site=?,location=?,verification=?,payload=?,updated_at=? WHERE id=? AND updated_at=?',
          )
          .run(
            item.name,
            item.site,
            item.location,
            item.verification,
            JSON.stringify(item.payload),
            now,
            id,
            before.updatedAt,
          );
        if (!result.changes) return false;
        database
          .prepare(
            'INSERT INTO changes (id,record_id,action,kind,name,site,actor,description,occurred_at) VALUES (?,?,?,?,?,?,?,?,?)',
          )
          .run(
            crypto.randomUUID(),
            id,
            'actualizado',
            item.kind,
            item.name,
            item.site,
            actor,
            describeChange(before, item),
            now,
          );
        return true;
      });
      return changed
        ? json({ ok: true, id })
        : error('Este registro cambió en otra sesión. Actualiza la vista antes de guardar.', 409);
    }
    if (body.action === 'delete') {
      if (body.baseUpdatedAt !== before.updatedAt)
        return error(
          'Este registro cambió en otra sesión. Actualiza la vista antes de eliminarlo.',
          409,
        );
      const now = new Date().toISOString();
      const changed = withTransaction((database) => {
        const result = database
          .prepare('DELETE FROM records WHERE id=? AND updated_at=?')
          .run(id, before.updatedAt);
        if (!result.changes) return false;
        database
          .prepare(
            'INSERT INTO changes (id,record_id,action,kind,name,site,actor,description,occurred_at) VALUES (?,?,?,?,?,?,?,?,?)',
          )
          .run(
            crypto.randomUUID(),
            id,
            'eliminado',
            before.kind,
            before.name,
            before.site,
            actor,
            'Registro eliminado.',
            now,
          );
        return true;
      });
      return changed
        ? json({ ok: true, id })
        : error(
            'Este registro cambió en otra sesión. Actualiza la vista antes de eliminarlo.',
            409,
          );
    }
    return error('Acción no válida.');
  } catch (cause) {
    console.error('data write failed', cause);
    return error('No se pudo guardar el cambio.', 500);
  }
}
