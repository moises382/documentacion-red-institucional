import type { ChangeItem, Kind, RecordItem, Site } from './models.ts';

export type ExampleProject = { version: 1; records: RecordItem[]; changes: ChangeItem[] };
export const EXAMPLE_STORAGE_KEY = 'red-institucional-example-v1';

export function createExampleProject(
  name = 'Oficina de ejemplo',
  site: Site = 'Colima',
): ExampleProject {
  const now = new Date().toISOString();
  const records: RecordItem[] = [];
  const add = (
    kind: Kind,
    id: string,
    label: string,
    payload: Record<string, string>,
    location = 'Oficina principal',
  ) => {
    const item: RecordItem = {
      id: `example-${id}`,
      kind,
      name: label,
      site,
      location,
      verification: 'verificado',
      payload,
      createdAt: now,
      updatedAt: now,
    };
    records.push(item);
    return item;
  };
  const plan = add('plan_red', 'plan', name, {
    subred: '192.168.1.0/24',
    gateway: '192.168.1.1',
    reservaPorcentaje: '20',
    notas:
      'Datos ficticios para aprender a documentar una red. Edita el nombre, la subred y los registros.',
  });
  const rack = add(
    'rack',
    'rack',
    'RACK-OF-01',
    { codigo: 'RACK-OF-01', sala: 'Cuarto de comunicaciones', capacidad: '24' },
    'Cuarto de comunicaciones',
  );
  const panel = add(
    'panel',
    'panel',
    'PP-OF-01',
    { rack: rack.id, puertos: '24', unidad: '3', rango: 'OF-01 a OF-24' },
    'Cuarto de comunicaciones',
  );
  const vlan = add('vlan', 'vlan', 'VLAN 10 · Oficina', {
    vlanId: '10',
    subred: '192.168.1.0/24',
    gateway: '192.168.1.1',
    proposito: 'Usuarios y equipos de oficina',
  });
  const router = add(
    'equipo',
    'router',
    'RTR-OF-01',
    { tipo: 'router', ipGestion: '192.168.1.1', estadoUso: 'Activo' },
    'Cuarto de comunicaciones',
  );
  const switchA = add(
    'equipo',
    'switch-1',
    'SW-OF-01',
    {
      tipo: 'switch',
      marca: 'Ejemplo',
      modelo: '24 puertos PoE',
      ipGestion: '192.168.1.2',
      rack: rack.id,
      puertos: '24',
      estadoUso: 'Activo',
    },
    'Cuarto de comunicaciones',
  );
  const switchB = add(
    'equipo',
    'switch-2',
    'SW-OF-02',
    {
      tipo: 'switch',
      marca: 'Ejemplo',
      modelo: '24 puertos',
      ipGestion: '192.168.1.3',
      rack: rack.id,
      puertos: '24',
      estadoUso: 'Activo',
    },
    'Cuarto de comunicaciones',
  );
  const otherTypes = [
    'servidor',
    'servidor',
    'impresora',
    'impresora',
    'impresora',
    'punto_acceso',
    'punto_acceso',
    'punto_acceso',
    'punto_acceso',
    'central_telefonica',
    'telefono_ip',
    'telefono_ip',
    'telefono_ip',
    'telefono_ip',
    'firewall',
    'nas',
  ];
  const otherNames: Record<string, string> = {
    servidor: 'SRV',
    impresora: 'IMP',
    punto_acceso: 'AP',
    central_telefonica: 'PBX',
    telefono_ip: 'TEL',
    firewall: 'FW',
    nas: 'NAS',
  };
  const counts: Record<string, number> = {};
  const statics = [switchA, switchB];
  for (let i = 0; i < otherTypes.length; i += 1) {
    const type = otherTypes[i];
    counts[type] = (counts[type] || 0) + 1;
    const label = `${otherNames[type]}-OF-${String(counts[type]).padStart(2, '0')}`;
    const item = add('equipo', `device-${i + 1}`, label, {
      tipo: type,
      marca: 'Ejemplo',
      ipGestion: `192.168.1.${i + 4}`,
      estadoUso: i === 15 ? 'No utilizado' : 'Activo',
    });
    statics.push(item);
  }
  for (let i = 0; i < 24; i += 1) {
    add(
      'equipo',
      `pc-${i + 1}`,
      `PC-OF-${String(i + 1).padStart(2, '0')}`,
      {
        tipo: 'computadora',
        inventario: `EJ-${String(i + 1).padStart(4, '0')}`,
        marca: 'Ejemplo',
        asignacionIp: 'DHCP',
        subredAsignada: '192.168.1.0/24',
        estadoUso: i >= 22 ? 'Inactivo' : 'Activo',
      },
      i < 12 ? 'Área administrativa' : 'Área operativa',
    );
  }
  statics.forEach((item) => {
    add('ip', `ip-${item.id}`, `IP · ${item.name}`, {
      direccion: item.payload.ipGestion,
      prefijo: '24',
      equipo: item.id,
      vlan: vlan.id,
      gateway: '192.168.1.1',
    });
  });
  add(
    'troncal',
    'trunk-1',
    'Troncal router a switch',
    { origen: router.id, destino: switchA.id, medio: 'Cobre', capacidad: '1 Gbps', vlans: '10' },
    'Cuarto de comunicaciones',
  );
  add(
    'troncal',
    'trunk-2',
    'Troncal entre switches',
    { origen: switchA.id, destino: switchB.id, medio: 'Cobre', capacidad: '1 Gbps', vlans: '10' },
    'Cuarto de comunicaciones',
  );
  const cable = add('cable', 'cable-1', 'CBL-OF-001', {
    codigo: 'CBL-OF-001',
    extremoA: 'PP-OF-01/01',
    extremoB: 'OF-01',
    tipoCable: 'UTP',
    estadoCable: 'En servicio',
  });
  add('nodo', 'node-1', 'Nodo OF-01', {
    etiqueta: 'OF-01',
    area: 'Área administrativa',
    panel: panel.id,
    puertoPanel: '01',
    destino: records.find((item) => item.id === 'example-pc-1')?.id || '',
  });
  add(
    'puerto',
    'port-1',
    'SW-OF-01 · Gi1/0/1',
    {
      switch: switchA.id,
      numero: 'Gi1/0/1',
      modo: 'Acceso',
      vlan: vlan.id,
      destino: records.find((item) => item.id === 'example-pc-1')?.id || '',
      cable: cable.id,
      poe: 'No',
    },
    'Cuarto de comunicaciones',
  );
  add('poe', 'poe-1', 'PoE · AP-OF-01', {
    equipo: records.find((item) => item.name === 'AP-OF-01')?.id || '',
    switch: switchA.id,
    puerto: 'Gi1/0/4',
    estandar: '802.3at',
    consumo: '15',
  });
  const task = add('pendiente', 'task-1', 'Confirmar etiquetado del segundo panel', {
    tipo: 'Pendiente',
    prioridad: 'Media',
    detalle: 'Verificar en campo la correspondencia de puertos y etiquetas del segundo sector.',
  });
  task.verification = 'pendiente';
  add('prueba', 'test-1', 'Prueba de conectividad de oficina', {
    fecha: now.slice(0, 10),
    tipo: 'Conectividad',
    resultado: 'Aprobada',
    equipo: switchA.id,
    detalle: 'Ejemplo ficticio de prueba de enlace.',
  });
  add('reporte', 'report-1', 'Avance semanal de oficina', {
    semana: now.slice(0, 10),
    avances: 'Se completó la carga de ejemplo del inventario.',
    equipos: '43 equipos documentados.',
    pruebas: 'Conectividad de oficina.',
    proximos: 'Verificar etiquetas y números de serie en campo.',
  });
  const changes: ChangeItem[] = [
    {
      id: 'example-change-1',
      recordId: plan.id,
      action: 'creado',
      kind: 'plan_red',
      name: plan.name,
      site,
      actor: 'Ejemplo',
      description: 'Proyecto de ejemplo cargado.',
      occurredAt: now,
    },
  ];
  return { version: 1, records, changes };
}
