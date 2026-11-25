import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLATES } from '../lib/models.ts';
import { recordSheetGroups } from '../lib/record-sheet.ts';

const translate = (value) => value;
const now = '2026-11-25T12:00:00.000Z';

test('prepara una ficha tabular para todas las plantillas y tipos de equipo', () => {
  for (const template of TEMPLATES) {
    const record = {
      id: template.id,
      kind: template.kind,
      name: `Ficha ${template.id}`,
      site: 'Colima',
      location: 'Oficina',
      verification: 'por_confirmar',
      payload: template.equipmentType ? { tipo: template.equipmentType } : {},
      createdAt: now,
      updatedAt: now,
    };
    const groups = recordSheetGroups(record, [record], translate, 'es-MX');
    assert.deepEqual(
      groups.map((group) => group.title),
      ['Identificación', 'Datos técnicos', 'Control y seguimiento'],
    );
    assert.equal(groups[0].rows[0].value, record.name);
    assert.equal(groups[1].rows.length, template.fields.length);
    assert.equal(groups[2].rows[0].value, 'Por confirmar');
  }
});

test('resuelve referencias y no añade campos de credenciales a la ficha', () => {
  const template = TEMPLATES.find((item) => item.kind === 'puerto');
  const referenceField = template.fields.find((field) => field.type === 'record');
  const switchRecord = {
    id: 'sw-1',
    kind: 'equipo',
    name: 'SW-OF-01',
    site: 'Colima',
    location: '',
    verification: 'verificado',
    payload: { tipo: 'switch' },
    createdAt: now,
    updatedAt: now,
  };
  const port = {
    id: 'port-1',
    kind: 'puerto',
    name: 'Puerto 01',
    site: 'Colima',
    location: '',
    verification: 'pendiente',
    payload: { [referenceField.key]: switchRecord.id, password: 'nunca-exportar' },
    createdAt: now,
    updatedAt: now,
  };
  const groups = recordSheetGroups(port, [port, switchRecord], translate, 'es-MX');
  assert.equal(
    groups[1].rows.find((row) => row.label === referenceField.label)?.value,
    switchRecord.name,
  );
  assert.doesNotMatch(JSON.stringify(groups), /nunca-exportar|password/);
});
