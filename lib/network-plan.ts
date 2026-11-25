import type { RecordItem, Site } from './models.ts';

export type Subnet = {
  cidr: string;
  mask: string;
  prefix: number;
  network: number;
  broadcast: number;
  usable: number;
};

function ipNumber(value: string): number | null {
  const octets = value.trim().split('.');
  if (octets.length !== 4 || octets.some((part) => !/^\d{1,3}$/.test(part) || Number(part) > 255))
    return null;
  return octets.reduce((result, part) => ((result << 8) | Number(part)) >>> 0, 0);
}

function ipString(value: number) {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join('.');
}

function prefixFromMask(value: string): string | null {
  if (/^\d{1,2}$/.test(value)) return value;
  const mask = ipNumber(value);
  if (mask === null) return null;
  const bits = mask.toString(2).padStart(32, '0');
  return /^1*0*$/.test(bits) ? String(bits.indexOf('0') < 0 ? 32 : bits.indexOf('0')) : null;
}

export function parseSubnet(value: string): Subnet | null {
  const [address, prefixText, extra] = value.trim().split('/');
  if (extra || !/^\d{1,2}$/.test(prefixText ?? '')) return null;
  const ip = ipNumber(address);
  const prefix = Number(prefixText);
  if (ip === null || prefix < 1 || prefix > 32) return null;
  const maskNumber = (0xffffffff << (32 - prefix)) >>> 0;
  const network = (ip & maskNumber) >>> 0;
  const size = 2 ** (32 - prefix);
  return {
    cidr: `${ipString(network)}/${prefix}`,
    mask: ipString(maskNumber),
    prefix,
    network,
    broadcast: network + size - 1,
    usable: prefix <= 30 ? size - 2 : size,
  };
}

export function ipInSubnet(address: string, subnet: Subnet): boolean {
  const ip = ipNumber(address);
  return ip !== null && ip >= subnet.network && ip <= subnet.broadcast;
}

export type NetworkChoice = {
  id: string;
  site: Site;
  name: string;
  subnet: Subnet;
  gateway: string;
  reservePercent: number;
  record?: RecordItem;
};

export function networkChoices(records: RecordItem[], site?: Site): NetworkChoice[] {
  const candidates = records
    .filter((record) => !site || record.site === site)
    .filter((record) => record.kind === 'plan_red' || record.kind === 'vlan')
    .map((record) => {
      const subnet = parseSubnet(record.payload.subred || '');
      return subnet
        ? {
            id: record.id,
            site: record.site,
            name: record.name,
            subnet,
            gateway: record.payload.gateway || '',
            reservePercent: Number(record.payload.reservaPorcentaje || 20),
            record,
          }
        : null;
    })
    .filter((choice): choice is NonNullable<typeof choice> => choice !== null);
  if (candidates.length) {
    const unique = new Set<string>();
    return candidates
      .sort((a, b) => Number(b.record?.kind === 'plan_red') - Number(a.record?.kind === 'plan_red'))
      .filter((choice) => {
        const key = `${choice.site}:${choice.subnet.cidr}`;
        if (unique.has(key)) return false;
        unique.add(key);
        return true;
      });
  }
  // Older projects may only have an address and prefix on an IP record.
  return records
    .filter((record) => record.kind === 'ip' && (!site || record.site === site))
    .map((record) => {
      const prefix = prefixFromMask(record.payload.prefijo || '');
      const subnet = prefix ? parseSubnet(`${record.payload.direccion}/${prefix}`) : null;
      return subnet
        ? {
            id: record.id,
            site: record.site,
            name: record.name,
            subnet,
            gateway: record.payload.gateway || '',
            reservePercent: 20,
            record,
          }
        : null;
    })
    .filter((choice): choice is NonNullable<typeof choice> => choice !== null);
}

export type NetworkSummary = {
  equipment: number;
  staticIps: number;
  dhcpComputers: number;
  gateway: number;
  reserve: number;
  needed: number;
  usable: number;
  valid: boolean;
};

export function summarizeNetwork(records: RecordItem[], choice: NetworkChoice): NetworkSummary {
  const siteRecords = records.filter((record) => record.site === choice.site);
  const otherNetworks = networkChoices(records, choice.site);
  const oneNetwork = otherNetworks.length <= 1;
  const equipment = siteRecords.filter((record) => record.kind === 'equipo');
  const applicable = equipment.filter((record) => {
    const assigned = record.payload.subredAsignada;
    if (assigned) return parseSubnet(assigned)?.cidr === choice.subnet.cidr;
    const address = record.payload.ipGestion;
    return address ? ipInSubnet(address, choice.subnet) : oneNetwork;
  });
  const dhcpComputers = applicable.filter(
    (record) =>
      ['computadora', 'laptop'].includes(record.payload.tipo) &&
      record.payload.asignacionIp === 'DHCP',
  ).length;
  const staticAddresses = new Set<string>();
  for (const record of siteRecords) {
    if (record.kind === 'ip' && record.payload.tipoAsignacion !== 'DHCP') {
      const address = record.payload.direccion;
      if (address && ipInSubnet(address, choice.subnet)) staticAddresses.add(address);
    }
  }
  for (const record of applicable) {
    const address = record.payload.ipGestion;
    if (address && record.payload.asignacionIp !== 'DHCP' && ipInSubnet(address, choice.subnet))
      staticAddresses.add(address);
  }
  if (choice.gateway) staticAddresses.delete(choice.gateway);
  const gateway = choice.gateway && ipInSubnet(choice.gateway, choice.subnet) ? 1 : 0;
  const base = staticAddresses.size + dhcpComputers + gateway;
  const percentage = Number.isFinite(choice.reservePercent)
    ? Math.min(90, Math.max(0, choice.reservePercent))
    : 20;
  const reserve = Math.ceil((base * percentage) / (100 - percentage));
  const needed = base + reserve;
  return {
    equipment: applicable.length,
    staticIps: staticAddresses.size,
    dhcpComputers,
    gateway,
    reserve,
    needed,
    usable: choice.subnet.usable,
    valid: needed <= choice.subnet.usable && Boolean(gateway),
  };
}
