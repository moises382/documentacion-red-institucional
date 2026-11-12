import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const temp = mkdtempSync(path.join(os.tmpdir(), 'red-docs-test-'));
const originalCwd = process.cwd();
process.chdir(temp);
const { getDatabase, withTransaction } = await import('../lib/database.ts');

test('crea las tablas y confirma una escritura transaccional', () => {
  const db = getDatabase();
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('records','changes') ORDER BY name",
    )
    .all();
  assert.deepEqual(
    tables.map((row) => row.name),
    ['changes', 'records'],
  );
  withTransaction((database) => {
    database
      .prepare(
        'INSERT INTO records (id,kind,name,site,location,verification,payload,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)',
      )
      .run(
        'demo',
        'vlan',
        'VLAN-DEMO',
        'Colima',
        '',
        'verificado',
        '{}',
        '2026-01-01',
        '2026-01-01',
      );
  });
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM records').get().total, 1);
});

test('revierte una transacción fallida', () => {
  const db = getDatabase();
  assert.throws(
    () =>
      withTransaction((database) => {
        database
          .prepare(
            'INSERT INTO records (id,kind,name,site,location,verification,payload,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)',
          )
          .run(
            'temporary',
            'vlan',
            'Temporal',
            'Colima',
            '',
            'pendiente',
            '{}',
            '2026-01-01',
            '2026-01-01',
          );
        throw new Error('fallo simulado');
      }),
    /fallo simulado/,
  );
  assert.equal(
    db.prepare("SELECT COUNT(*) AS total FROM records WHERE id='temporary'").get().total,
    0,
  );
});

after(() => {
  getDatabase().close();
  process.chdir(originalCwd);
  rmSync(temp, { recursive: true, force: true });
});
