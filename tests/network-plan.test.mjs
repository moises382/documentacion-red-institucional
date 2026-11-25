import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createExampleProject } from '../lib/example-project.ts';
import { networkChoices, parseSubnet, summarizeNetwork } from '../lib/network-plan.ts';
import { validateRecord } from '../lib/record-validation.ts';

test('el ejemplo de oficina reproduce el resumen de red y no contiene credenciales', () => {
  const project = createExampleProject();
  const [network] = networkChoices(project.records);
  const summary = summarizeNetwork(project.records, network);
  assert.equal(network.subnet.cidr, '192.168.1.0/24');
  assert.equal(network.subnet.mask, '255.255.255.0');
  assert.deepEqual(summary, {
    equipment: 43,
    staticIps: 18,
    dhcpComputers: 24,
    gateway: 1,
    reserve: 11,
    needed: 54,
    usable: 254,
    valid: true,
  });
  assert.ok(
    project.records.every(
      (record) => !/password|contrase|secret|token/i.test(JSON.stringify(record.payload)),
    ),
  );
});

test('al modificar una computadora DHCP, el resumen cambia de inmediato', () => {
  const project = createExampleProject();
  const [network] = networkChoices(project.records);
  const computer = project.records.find((record) => record.name === 'PC-OF-01');
  computer.payload.asignacionIp = 'Estática';
  computer.payload.ipGestion = '192.168.1.35';
  const summary = summarizeNetwork(project.records, network);
  assert.equal(summary.dhcpComputers, 23);
  assert.equal(summary.staticIps, 19);
});

test('valida la subred y la puerta de enlace del plan', () => {
  const base = {
    kind: 'plan_red',
    name: 'Oficina',
    site: 'Colima',
    location: '',
    verification: 'por_confirmar',
    payload: { subred: '192.168.1.0/24', gateway: '192.168.1.1', reservaPorcentaje: '20' },
  };
  assert.equal(validateRecord(base).message, undefined);
  assert.equal(parseSubnet('192.168.1.21/24')?.cidr, '192.168.1.0/24');
  assert.match(
    validateRecord({ ...base, payload: { ...base.payload, gateway: '10.1.1.1' } }).message,
    /puerta de enlace/,
  );
  assert.match(
    validateRecord({ ...base, payload: { ...base.payload, subred: '192.168.1.0/40' } }).message,
    /subred/,
  );
});
