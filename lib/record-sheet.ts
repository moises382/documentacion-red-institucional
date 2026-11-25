import {
  EQUIPMENT_LABELS,
  KIND_LABELS,
  VERIFICATION_LABELS,
  templateFor,
  type RecordItem,
} from './models.ts';

export type SheetGroup = {
  title: string;
  rows: { label: string; value: string }[];
};

const safeField = (value: string) =>
  !/(password|contrase|clave|secret|token|credential|contrasena)/i.test(value);

export function recordSheetGroups(
  record: RecordItem,
  all: RecordItem[],
  translate: (value: string) => string,
  locale: string,
): SheetGroup[] {
  const fallback = translate('Por confirmar');
  const type =
    record.kind === 'equipo'
      ? EQUIPMENT_LABELS[record.payload.tipo as keyof typeof EQUIPMENT_LABELS] || 'Equipo'
      : KIND_LABELS[record.kind];
  const formatDate = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? value || fallback
      : new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
  };
  const row = (label: string, value: string) => ({
    label: translate(label),
    value: value || fallback,
  });

  return [
    {
      title: translate('Identificación'),
      rows: [
        row('Nombre del registro', record.name),
        row('Tipo de registro', translate(type)),
        row('Sede', record.site),
        row('Ubicación', record.location),
      ],
    },
    {
      title: translate('Datos técnicos'),
      rows: templateFor(record)
        .fields.filter((field) => safeField(field.key))
        .map((field) => {
          const raw = record.payload[field.key];
          const value =
            field.type === 'record'
              ? all.find((item) => item.id === raw)?.name
              : field.type === 'select' && raw
                ? translate(raw)
                : raw;
          return row(field.label, value || '');
        }),
    },
    {
      title: translate('Control y seguimiento'),
      rows: [
        row('Verificación', translate(VERIFICATION_LABELS[record.verification])),
        row('Creado', formatDate(record.createdAt)),
        row('Actualizado', formatDate(record.updatedAt)),
      ],
    },
  ];
}
