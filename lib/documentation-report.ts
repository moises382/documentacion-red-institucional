import { networkChoices, summarizeNetwork } from './network-plan.ts';
import { SITES, type RecordItem } from './models.ts';

export function documentationOverview(records: RecordItem[]) {
  const equipment = records.filter((record) => record.kind === 'equipo');
  const addresses = new Set<string>();
  for (const record of records) {
    const address =
      record.kind === 'ip'
        ? record.payload.direccion
        : record.kind === 'equipo'
          ? record.payload.ipGestion
          : '';
    if (address?.trim()) addresses.add(`${record.site}:${address.trim().toLowerCase()}`);
  }
  const networks = SITES.flatMap((site) =>
    networkChoices(records.filter((record) => record.site === site)).map((choice) => ({
      choice,
      summary: summarizeNetwork(records, choice),
    })),
  );

  return {
    totalRecords: records.length,
    inventoryRecords: records.filter(
      (record) => !['pendiente', 'prueba', 'reporte'].includes(record.kind),
    ).length,
    equipment: equipment.length,
    computers: equipment.filter((record) => ['computadora', 'laptop'].includes(record.payload.tipo))
      .length,
    ipRecords: records.filter((record) => record.kind === 'ip').length,
    ipAddresses: addresses.size,
    pending: records.filter((record) => record.kind === 'pendiente').length,
    tests: records.filter((record) => record.kind === 'prueba').length,
    reports: records.filter((record) => record.kind === 'reporte').length,
    networks,
  };
}
