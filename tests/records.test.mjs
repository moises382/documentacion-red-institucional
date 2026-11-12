import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeChange, validateRecord } from '../lib/record-validation.ts';
import { EQUIPMENT_TYPES, TEMPLATES } from '../lib/models.ts';

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

test('todas las plantillas de equipo admiten estado de uso', () => {
  for (const type of EQUIPMENT_TYPES) {
    const template = TEMPLATES.find((item) => item.id === type);
    assert.ok(template, `Falta la plantilla ${type}`);
    assert.ok(template.fields.some((field) => field.key === 'estadoUso'));
  }
  const result = validateRecord({
    ...switchRecord,
    name: 'PC-DEMO-01',
    payload: { tipo: 'computadora', modelo: 'Equipo ficticio', estadoUso: 'Activo' },
  });
  assert.equal(result.message, undefined);
});

test('rechaza un estado de uso ajeno a la plantilla', () => {
  const result = validateRecord({
    ...switchRecord,
    payload: { ...switchRecord.payload, estadoUso: 'Desconocido' },
  });
  assert.equal(result.value, undefined);
  assert.match(result.message, /Estado de uso/);
});

test('documenta etiquetas de cable y exige su código', () => {
  const valid = validateRecord({
    ...switchRecord,
    kind: 'cable',
    name: 'CBL-DEMO-001',
    payload: { codigo: 'CBL-DEMO-001', extremoA: 'Rack de ejemplo', extremoB: 'Nodo de ejemplo' },
  });
  assert.equal(valid.message, undefined);
  const missing = validateRecord({
    ...switchRecord,
    kind: 'cable',
    name: 'CBL-DEMO-001',
    payload: {},
  });
  assert.match(missing.message, /Código de cable/);
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
