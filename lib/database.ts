import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const cached = globalThis as typeof globalThis & { __networkDocumentationDb?: DatabaseSync };

export function getDatabase(): DatabaseSync {
  if (cached.__networkDocumentationDb) return cached.__networkDocumentationDb;

  const databasePath = path.join(process.cwd(), 'data', 'network.sqlite');
  mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
  database.exec(`
    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY NOT NULL,
      kind TEXT NOT NULL,
      name TEXT NOT NULL,
      site TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT '',
      verification TEXT NOT NULL DEFAULT 'por_confirmar',
      payload TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS records_kind_idx ON records(kind);
    CREATE INDEX IF NOT EXISTS records_site_idx ON records(site);
    CREATE INDEX IF NOT EXISTS records_updated_idx ON records(updated_at);
    CREATE TABLE IF NOT EXISTS changes (
      id TEXT PRIMARY KEY NOT NULL,
      record_id TEXT NOT NULL,
      action TEXT NOT NULL,
      kind TEXT NOT NULL,
      name TEXT NOT NULL,
      site TEXT NOT NULL,
      actor TEXT NOT NULL,
      description TEXT NOT NULL,
      occurred_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS changes_occurred_idx ON changes(occurred_at);
    CREATE INDEX IF NOT EXISTS changes_site_idx ON changes(site);
    CREATE TABLE IF NOT EXISTS vaults (
      owner_id TEXT PRIMARY KEY NOT NULL,
      revision TEXT NOT NULL,
      envelope TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  cached.__networkDocumentationDb = database;
  return database;
}

export function withTransaction<T>(work: (database: DatabaseSync) => T): T {
  const database = getDatabase();
  database.exec('BEGIN IMMEDIATE');
  try {
    const result = work(database);
    database.exec('COMMIT');
    return result;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}
