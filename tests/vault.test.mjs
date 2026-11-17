import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createVault,
  decryptVault,
  encryptVaultDocument,
  makeVaultBackup,
  parseVaultBackup,
  validateVaultEnvelope,
  validateVaultDocument,
  vaultEvent,
} from '../lib/vault.ts';

test('la bóveda cifra, desbloquea y respalda registros sin texto claro', async () => {
  const passphrase = 'Frase de prueba extensa y privada 2026';
  const created = await createVault(passphrase);
  assert.ok(validateVaultEnvelope(created.envelope));
  assert.equal(created.envelope.ciphertext.includes('usuario-de-ejemplo'), false);
  const entry = {
    id: crypto.randomUUID(),
    title: 'Teléfono de ejemplo',
    site: 'Colima',
    linkedRecordId: 'demo-phone',
    category: 'Cuenta SIP',
    username: 'usuario-de-ejemplo',
    password: 'secreto-ficticio-de-prueba',
    address: 'https://example.invalid',
    notes: 'Solo datos ficticios',
    updatedAt: new Date().toISOString(),
  };
  const document = {
    version: 1,
    entries: [entry],
    events: vaultEvent('created', entry.title, []),
  };
  assert.ok(validateVaultDocument(document));
  const envelope = await encryptVaultDocument(
    document,
    created.key,
    created.envelope.salt,
    created.envelope.iterations,
  );
  assert.equal(JSON.stringify(envelope).includes(entry.username), false);
  assert.equal(JSON.stringify(envelope).includes(entry.password), false);
  const opened = await decryptVault(envelope, passphrase);
  assert.deepEqual(opened.document, document);
  await assert.rejects(decryptVault(envelope, 'frase incorrecta'));
  const tampered = { ...envelope, iv: created.envelope.iv };
  await assert.rejects(decryptVault(tampered, passphrase));
  const backup = parseVaultBackup(JSON.stringify(makeVaultBackup(envelope)));
  assert.deepEqual(backup.envelope, envelope);
  assert.equal(JSON.stringify(backup).includes(entry.password), false);
});

test('rechaza archivos de respaldo malformados', () => {
  assert.throws(() => parseVaultBackup('{"entries":[]}'));
  assert.equal(validateVaultEnvelope({ format: 'otro' }), false);
});
