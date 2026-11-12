import {
  EQUIPMENT_TYPES,
  KINDS,
  SITES,
  TEMPLATES,
  VERIFICATIONS,
  templateFor,
  type Kind,
  type RecordItem,
} from './models.ts';

export type RecordInput = Omit<RecordItem, 'id' | 'createdAt' | 'updatedAt'>;

export function validateRecord(input: unknown): { value?: RecordInput; message?: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    return { message: 'El registro no es válido.' };
  const value = input as Record<string, unknown>;
  if (!KINDS.includes(value.kind as Kind))
    return { message: 'Selecciona un tipo de registro válido.' };
  if (!SITES.includes(value.site as (typeof SITES)[number]))
    return { message: 'Selecciona una sede válida.' };
  if (!VERIFICATIONS.includes(value.verification as (typeof VERIFICATIONS)[number]))
    return { message: 'Selecciona un estado de verificación válido.' };
  if (typeof value.name !== 'string' || value.name.trim().length < 2 || value.name.length > 160)
    return { message: 'Escribe un nombre de 2 a 160 caracteres.' };
  if (typeof value.location !== 'string' || value.location.length > 160)
    return { message: 'La ubicación es demasiado larga.' };
  if (!value.payload || typeof value.payload !== 'object' || Array.isArray(value.payload))
    return { message: 'Los detalles del registro no son válidos.' };
  const inputPayload = value.payload as Record<string, unknown>;
  if (
    value.kind === 'equipo' &&
    !EQUIPMENT_TYPES.includes(inputPayload.tipo as (typeof EQUIPMENT_TYPES)[number])
  )
    return { message: 'Selecciona una plantilla de equipo válida.' };
  const template =
    value.kind === 'equipo'
      ? TEMPLATES.find((item) => item.id === inputPayload.tipo)
      : TEMPLATES.find((item) => item.kind === value.kind);
  if (!template) return { message: 'La plantilla no está disponible.' };
  const allowed = new Set(template.fields.map((field) => field.key));
  if (value.kind === 'equipo') allowed.add('tipo');
  const payload: Record<string, string> = {};
  for (const [key, raw] of Object.entries(inputPayload)) {
    if (!allowed.has(key) || typeof raw !== 'string' || raw.length > 4000)
      return { message: 'Hay un campo no válido o demasiado largo.' };
    payload[key] = raw.trim();
  }
  for (const field of template.fields) {
    if (field.required && !payload[field.key])
      return { message: `Completa el campo «${field.label}».` };
    if (
      field.type === 'select' &&
      payload[field.key] &&
      !field.options?.includes(payload[field.key])
    )
      return { message: `El campo «${field.label}» no es válido.` };
  }
  if (JSON.stringify(payload).length > 16000)
    return { message: 'El registro es demasiado grande.' };
  return {
    value: {
      kind: value.kind as RecordItem['kind'],
      name: value.name.trim(),
      site: value.site as RecordItem['site'],
      location: value.location.trim(),
      verification: value.verification as RecordItem['verification'],
      payload,
    },
  };
}

export function describeChange(before: RecordItem, after: RecordInput): string {
  const fields: string[] = [];
  if (before.name !== after.name) fields.push('nombre');
  if (before.site !== after.site) fields.push('sede');
  if (before.location !== after.location) fields.push('ubicación');
  if (before.verification !== after.verification) fields.push('verificación');
  for (const key of new Set([...Object.keys(before.payload), ...Object.keys(after.payload)])) {
    if (before.payload[key] !== after.payload[key]) {
      fields.push(
        (templateFor(after).fields.find((field) => field.key === key)?.label || key).toLowerCase(),
      );
    }
  }
  return fields.length
    ? `Cambió: ${fields.join(', ')}.`
    : 'Registro guardado sin cambios de contenido.';
}
