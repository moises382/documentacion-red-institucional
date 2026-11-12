import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeChange, validateRecord } from '../lib/record-validation.ts';

const switchRecord = {
  kind: 'equipo',
  name: 'SW-DEMO-01',
  site: 'Colima',
  location: 'Sala de ejemplo',
  verification: 'por_confirmar',
  payload: { tipo: 'switch', modelo: 'Modelo ficticio', puertos: '24' },
};

test('acepta una ficha válida de switch', () => {
  const result = validateRecord(switchRecord);
  assert.equal(result.message, undefined);
  assert.equal(result.value?.payload.modelo, 'Modelo ficticio');
});

test('rechaza campos ajenos a la plantilla, incluidos campos de credenciales', () => {
  const result = validateRecord({
    ...switchRecord,
    payload: { ...switchRecord.payload, password: 'no-publicar' },
  });
  assert.equal(result.value, undefined);
  assert.match(result.message, /campo no válido/);
});

test('requiere switch e interfaz para documentar un puerto', () => {
  const result = validateRecord({
    ...switchRecord,
    kind: 'puerto',
    payload: { numero: 'Gi1/0/1' },
  });
  assert.equal(result.value, undefined);
  assert.match(result.message, /Switch/);
});

test('el historial describe los campos modificados', () => {
  const before = { ...switchRecord, id: 'demo', createdAt: '2026-01-01', updatedAt: '2026-01-01' };
  const after = {
    ...switchRecord,
    verification: 'verificado',
    payload: { ...switchRecord.payload, modelo: 'Modelo actualizado' },
  };
  assert.equal(describeChange(before, after), 'Cambió: verificación, modelo.');
});
