import { randomUUID } from 'node:crypto';
import { getDatabase, withTransaction } from '../lib/database.ts';

const database = getDatabase();
const existing = database.prepare('SELECT COUNT(*) AS total FROM records').get().total;
if (existing > 0) {
  console.log('La base ya contiene registros. No se añadieron datos de ejemplo.');
  process.exit(0);
}

const now = new Date().toISOString();
const today = now.slice(0, 10);
const monday = new Date();
monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
const week = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
const entries = [
  {
    id: 'demo-rack-col',
    kind: 'rack',
    name: 'RACK-DEMO-COL-01',
    site: 'Colima',
    location: 'Sala de ejemplo',
    verification: 'verificado',
    payload: {
      codigo: 'RACK-DEMO-COL-01',
      sala: 'Sala de ejemplo',
      capacidad: '42',
      energia: 'UPS de demostración',
    },
  },
  {
    id: 'demo-panel-col',
    kind: 'panel',
    name: 'PP-DEMO-COL-01',
    site: 'Colima',
    location: 'Sala de ejemplo',
    verification: 'verificado',
    payload: {
      rack: 'demo-rack-col',
      puertos: '24',
      unidad: '12',
      rango: 'NODO-DEMO-001 a NODO-DEMO-024',
    },
  },
  {
    id: 'demo-vlan-col',
    kind: 'vlan',
    name: 'VLAN-DEMO-10',
    site: 'Colima',
    location: 'Red de ejemplo',
    verification: 'verificado',
    payload: {
      vlanId: '10',
      subred: '192.0.2.0/24',
      proposito: 'Segmento de documentación',
      gateway: '192.0.2.1',
    },
  },
  {
    id: 'demo-sw-col',
    kind: 'equipo',
    name: 'SW-DEMO-COL-01',
    site: 'Colima',
    location: 'Sala de ejemplo',
    verification: 'verificado',
    payload: {
      tipo: 'switch',
      marca: 'Marca de ejemplo',
      modelo: 'Switch 24 puertos',
      ipGestion: '192.0.2.10',
      puertos: '24',
      rack: 'demo-rack-col',
      unidad: '10',
    },
  },
  {
    id: 'demo-srv-col',
    kind: 'equipo',
    name: 'SRV-DEMO-COL-01',
    site: 'Colima',
    location: 'Sala de ejemplo',
    verification: 'por_confirmar',
    payload: {
      tipo: 'servidor',
      marca: 'Marca de ejemplo',
      modelo: 'Servidor de prueba',
      ipGestion: '192.0.2.20',
      rol: 'Aplicación de demostración',
      sistema: 'Linux',
      rack: 'demo-rack-col',
      unidad: '8',
    },
  },
  {
    id: 'demo-ap-col',
    kind: 'equipo',
    name: 'AP-DEMO-COL-01',
    site: 'Colima',
    location: 'Pasillo de ejemplo',
    verification: 'verificado',
    payload: {
      tipo: 'punto_acceso',
      marca: 'Marca de ejemplo',
      modelo: 'AP de prueba',
      ipGestion: '192.0.2.30',
      zona: 'Pasillo de ejemplo',
      poe: 'PoE+',
      vlan: 'demo-vlan-col',
    },
  },
  {
    id: 'demo-sw-tec',
    kind: 'equipo',
    name: 'SW-DEMO-TEC-01',
    site: 'Tecomán',
    location: 'Sala de ejemplo',
    verification: 'pendiente',
    payload: {
      tipo: 'switch',
      modelo: 'Switch 24 puertos',
      ipGestion: '198.51.100.10',
      puertos: '24',
    },
  },
  {
    id: 'demo-prn-manz',
    kind: 'equipo',
    name: 'IMP-DEMO-MAN-01',
    site: 'Manzanillo',
    location: 'Oficina de ejemplo',
    verification: 'por_confirmar',
    payload: {
      tipo: 'impresora',
      modelo: 'Impresora de prueba',
      ipGestion: '203.0.113.25',
      conexion: 'Ethernet',
    },
  },
  {
    id: 'demo-tel-coq',
    kind: 'equipo',
    name: 'TEL-DEMO-COQ-01',
    site: 'Coquimatlán',
    location: 'Recepción de ejemplo',
    verification: 'pendiente',
    payload: { tipo: 'telefono_ip', modelo: 'Teléfono de prueba', extension: '1001', poe: 'PoE' },
  },
  {
    id: 'demo-ip-col',
    kind: 'ip',
    name: 'IP-DEMO-SW-COL',
    site: 'Colima',
    location: 'Sala de ejemplo',
    verification: 'verificado',
    payload: {
      direccion: '192.0.2.10',
      prefijo: '/24',
      equipo: 'demo-sw-col',
      vlan: 'demo-vlan-col',
      gateway: '192.0.2.1',
    },
  },
  {
    id: 'demo-port-col',
    kind: 'puerto',
    name: 'PUERTO-DEMO-GI1-0-1',
    site: 'Colima',
    location: 'Sala de ejemplo',
    verification: 'verificado',
    payload: {
      switch: 'demo-sw-col',
      numero: 'Gi1/0/1',
      modo: 'Acceso',
      vlan: 'demo-vlan-col',
      destino: 'demo-ap-col',
      poe: 'Sí',
    },
  },
  {
    id: 'demo-node-col',
    kind: 'nodo',
    name: 'NODO-DEMO-001',
    site: 'Colima',
    location: 'Pasillo de ejemplo',
    verification: 'verificado',
    payload: {
      etiqueta: 'NODO-DEMO-001',
      area: 'Pasillo de ejemplo',
      panel: 'demo-panel-col',
      puertoPanel: '01',
      destino: 'demo-ap-col',
    },
  },
  {
    id: 'demo-trunk',
    kind: 'troncal',
    name: 'TRONCAL-DEMO-COL-TEC',
    site: 'Colima',
    location: 'Enlace de ejemplo',
    verification: 'pendiente',
    payload: {
      origen: 'demo-sw-col',
      puertoOrigen: 'Gi1/0/24',
      destino: 'demo-sw-tec',
      puertoDestino: 'Gi1/0/24',
      medio: 'Fibra',
      capacidad: '1 Gb/s',
      vlans: '10',
    },
  },
  {
    id: 'demo-poe',
    kind: 'poe',
    name: 'POE-DEMO-AP-COL',
    site: 'Colima',
    location: 'Pasillo de ejemplo',
    verification: 'verificado',
    payload: {
      equipo: 'demo-ap-col',
      switch: 'demo-sw-col',
      puerto: 'Gi1/0/1',
      estandar: '802.3at',
      consumo: '14',
      presupuesto: '30',
    },
  },
  {
    id: 'demo-issue',
    kind: 'pendiente',
    name: 'Confirmar enlace de ejemplo',
    site: 'Tecomán',
    location: 'Sala de ejemplo',
    verification: 'pendiente',
    payload: {
      tipo: 'Pendiente',
      prioridad: 'Media',
      responsable: 'Equipo de demostración',
      detalle: 'Validar el extremo remoto del enlace troncal ficticio.',
    },
  },
  {
    id: 'demo-test',
    kind: 'prueba',
    name: 'Prueba de conectividad de ejemplo',
    site: 'Colima',
    location: 'Sala de ejemplo',
    verification: 'verificado',
    payload: {
      fecha: today,
      equipo: 'demo-sw-col',
      tipo: 'Conectividad',
      resultado: 'Aprobada',
      detalle: 'Prueba ficticia para mostrar el formato del registro.',
    },
  },
  {
    id: 'demo-report',
    kind: 'reporte',
    name: 'Reporte semanal de demostración',
    site: 'Colima',
    location: '',
    verification: 'por_confirmar',
    payload: {
      semana: week,
      avances:
        'Se documentó un entorno ficticio de red para mostrar el funcionamiento del proyecto.',
      equipos: 'SW-DEMO-COL-01, SRV-DEMO-COL-01 y AP-DEMO-COL-01.',
      pruebas: 'Prueba de conectividad de ejemplo.',
      proximos: 'Revisar las fichas pendientes y completar la verificación del enlace troncal.',
      notas: 'Todos los nombres e IP de este reporte son de demostración.',
    },
  },
];

withTransaction((db) => {
  const insert = db.prepare(
    'INSERT INTO records (id,kind,name,site,location,verification,payload,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)',
  );
  const history = db.prepare(
    'INSERT INTO changes (id,record_id,action,kind,name,site,actor,description,occurred_at) VALUES (?,?,?,?,?,?,?,?,?)',
  );
  for (const item of entries) {
    insert.run(
      item.id,
      item.kind,
      item.name,
      item.site,
      item.location,
      item.verification,
      JSON.stringify(item.payload),
      now,
      now,
    );
    history.run(
      randomUUID(),
      item.id,
      'creado',
      item.kind,
      item.name,
      item.site,
      'Datos de ejemplo',
      'Registro ficticio de demostración.',
      now,
    );
  }
});
console.log(
  `Se añadieron ${entries.length} registros ficticios. No contienen datos de una red real.`,
);
