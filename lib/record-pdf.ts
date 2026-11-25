import {
  EQUIPMENT_LABELS,
  KIND_LABELS,
  VERIFICATION_LABELS,
  templateFor,
  type RecordItem,
} from './models.ts';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const SCALE = 2;
const encoder = new TextEncoder();

function safeField(key: string) {
  return !/(password|contrase|clave|secret|token|credential|contrasena)/i.test(key);
}

function pdfFile(pages: Uint8Array[]): Uint8Array {
  const pieces: Uint8Array[] = [];
  let byteLength = 0;
  const offsets: number[] = [0];
  const write = (value: string | Uint8Array) => {
    const bytes = typeof value === 'string' ? encoder.encode(value) : value;
    pieces.push(bytes);
    byteLength += bytes.length;
  };
  const object = (id: number, content: string | Uint8Array, suffix = '') => {
    offsets[id] = byteLength;
    write(`${id} 0 obj\n`);
    write(content);
    write(`${suffix}\nendobj\n`);
  };
  write('%PDF-1.4\n');
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  const pageIds = pages.map((_, index) => 3 + index * 3);
  object(
    2,
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`,
  );
  pages.forEach((jpeg, index) => {
    const pageId = pageIds[index];
    const contentId = pageId + 1;
    const imageId = pageId + 2;
    object(
      pageId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    const stream = `q\n${PAGE_WIDTH} 0 0 ${PAGE_HEIGHT} 0 0 cm\n/Im0 Do\nQ\n`;
    object(contentId, `<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}endstream`);
    offsets[imageId] = byteLength;
    write(
      `${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${PAGE_WIDTH * SCALE} /Height ${PAGE_HEIGHT * SCALE} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
    );
    write(jpeg);
    write('\nendstream\nendobj\n');
  });
  const xref = byteLength;
  write(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  for (let index = 1; index < offsets.length; index += 1)
    write(`${String(offsets[index]).padStart(10, '0')} 00000 n \n`);
  write(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  const result = new Uint8Array(byteLength);
  let at = 0;
  for (const piece of pieces) {
    result.set(piece, at);
    at += piece.length;
  }
  return result;
}

function canvasJpeg(canvas: HTMLCanvasElement) {
  const base64 = canvas.toDataURL('image/jpeg', 0.93).split(',')[1];
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function buildRecordPdf(record: RecordItem, all: RecordItem[]): Promise<Uint8Array> {
  const template = templateFor(record);
  const type =
    record.kind === 'equipo'
      ? EQUIPMENT_LABELS[record.payload.tipo as keyof typeof EQUIPMENT_LABELS] || 'Equipo'
      : KIND_LABELS[record.kind];
  const fields = [
    ['Nombre del registro', record.name],
    ['Tipo de registro', type],
    ['Sede', record.site],
    ['Ubicación', record.location || 'Por confirmar'],
    ['Verificación', VERIFICATION_LABELS[record.verification]],
    ['Creado', new Date(record.createdAt).toLocaleString('es-MX')],
    ['Actualizado', new Date(record.updatedAt).toLocaleString('es-MX')],
    ...template.fields
      .filter((field) => safeField(field.key) && safeField(field.label))
      .map((field) => [
        field.label,
        field.type === 'record'
          ? all.find((item) => item.id === record.payload[field.key])?.name || 'Por confirmar'
          : record.payload[field.key] || 'Por confirmar',
      ]),
  ];
  const pages: Uint8Array[] = [];
  let canvas!: HTMLCanvasElement;
  let context!: CanvasRenderingContext2D;
  let y = 0;
  const startPage = () => {
    canvas = document.createElement('canvas');
    canvas.width = PAGE_WIDTH * SCALE;
    canvas.height = PAGE_HEIGHT * SCALE;
    const next = canvas.getContext('2d');
    if (!next) throw new Error('No se pudo preparar el PDF.');
    context = next;
    context.scale(SCALE, SCALE);
    context.fillStyle = '#f6f9f8';
    context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    context.fillStyle = '#113a47';
    context.fillRect(0, 0, PAGE_WIDTH, 14);
    context.fillStyle = '#166b70';
    context.font = '700 11px Arial, sans-serif';
    context.fillText('DOCUMENTACIÓN DE RED', 48, 55);
    context.fillStyle = '#143a45';
    context.font = '700 22px Arial, sans-serif';
    const title = record.name.length > 42 ? `${record.name.slice(0, 39)}…` : record.name;
    context.fillText(title, 48, 88);
    context.fillStyle = '#607b83';
    context.font = '11px Arial, sans-serif';
    context.fillText(`${record.site}  ·  Ficha de registro`, 48, 109);
    context.strokeStyle = '#d7e5e2';
    context.beginPath();
    context.moveTo(48, 126);
    context.lineTo(547, 126);
    context.stroke();
    y = 151;
  };
  const finishPage = () => {
    context.fillStyle = '#69838a';
    context.font = '10px Arial, sans-serif';
    context.fillText('Ficha generada desde el inventario · Sin credenciales de la bóveda', 48, 807);
    context.fillText(String(pages.length + 1), 530, 807);
    pages.push(canvasJpeg(canvas));
  };
  startPage();
  for (const [label, value] of fields) {
    const text = String(value).replace(/\r/g, '').trim() || 'Por confirmar';
    const lines: string[] = [];
    context.font = '12px Arial, sans-serif';
    for (const paragraph of text.split('\n')) {
      let line = '';
      for (const word of paragraph.split(/\s+/)) {
        let remaining = word;
        while (remaining) {
          const proposed = line ? `${line} ${remaining}` : remaining;
          if (context.measureText(proposed).width <= 490) {
            line = proposed;
            break;
          }
          if (line) {
            lines.push(line);
            line = '';
            continue;
          }
          let end = 1;
          while (
            end < remaining.length &&
            context.measureText(remaining.slice(0, end + 1)).width <= 490
          )
            end += 1;
          lines.push(remaining.slice(0, end));
          remaining = remaining.slice(end);
        }
      }
      lines.push(line || ' ');
    }
    const needed = 18 + Math.max(1, lines.length) * 17 + 15;
    if (y + needed > 777) {
      finishPage();
      startPage();
    }
    context.fillStyle = '#52717a';
    context.font = '700 10px Arial, sans-serif';
    context.fillText(label.toUpperCase(), 48, y);
    y += 18;
    context.fillStyle = '#173844';
    context.font = '12px Arial, sans-serif';
    for (const line of lines) {
      if (y > 760) {
        finishPage();
        startPage();
      }
      context.fillText(line, 48, y);
      y += 17;
    }
    y += 15;
  }
  finishPage();
  return pdfFile(pages);
}
