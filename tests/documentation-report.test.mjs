import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createExampleProject } from '../lib/example-project.ts';
import { documentationOverview } from '../lib/documentation-report.ts';

test('el PDF completo puede mostrar los totales y la subred del proyecto de ejemplo', () => {
  const project = createExampleProject();
  const overview = documentationOverview(project.records);
  const office = overview.networks.find(({ choice }) => choice.subnet.cidr === '192.168.1.0/24');

  assert.equal(overview.equipment, 43);
  assert.equal(overview.computers, 24);
  assert.ok(overview.totalRecords > overview.equipment);
  assert.equal(office?.choice.subnet.mask, '255.255.255.0');
  assert.equal(office?.summary.equipment, 43);
  assert.equal(office?.summary.staticIps, 18);
  assert.equal(office?.summary.dhcpComputers, 24);
});

test('las direcciones repetidas cuentan una vez por sede en el resumen general', () => {
  const now = '2026-11-25T12:00:00.000Z';
  const record = (id, site, address) => ({
    id,
    kind: 'ip',
    name: id,
    site,
    location: '',
    verification: 'verificado',
    payload: { direccion: address },
    createdAt: now,
    updatedAt: now,
  });
  const overview = documentationOverview([
    record('a', 'Colima', '192.168.1.10'),
    record('b', 'Colima', '192.168.1.10'),
    record('c', 'Tecomán', '192.168.1.10'),
  ]);

  assert.equal(overview.ipRecords, 3);
  assert.equal(overview.ipAddresses, 2);
});
