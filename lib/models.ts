export const SITES = ['Colima', 'Tecomán', 'Manzanillo', 'Coquimatlán'] as const;
export type Site = (typeof SITES)[number];
export const VERIFICATIONS = ['verificado', 'pendiente', 'por_confirmar'] as const;
export type Verification = (typeof VERIFICATIONS)[number];
export const KINDS = [
  'equipo',
  'ip',
  'puerto',
  'vlan',
  'nodo',
  'cable',
  'rack',
  'panel',
  'troncal',
  'poe',
  'pendiente',
  'prueba',
  'reporte',
] as const;
export type Kind = (typeof KINDS)[number];
export const EQUIPMENT_TYPES = [
  'switch',
  'computadora',
  'laptop',
  'impresora',
  'punto_acceso',
  'telefono_ip',
  'servidor',
  'router',
  'firewall',
  'camara_ip',
  'ups',
  'nas',
] as const;
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];
export const EQUIPMENT_STATES = ['Activo', 'Inactivo', 'No utilizado', 'Por confirmar'] as const;
export type EquipmentState = (typeof EQUIPMENT_STATES)[number];

export type RecordItem = {
  id: string;
  kind: Kind;
  name: string;
  site: Site;
  location: string;
  verification: Verification;
  payload: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};
export type ChangeItem = {
  id: string;
  recordId: string;
  action: 'creado' | 'actualizado' | 'eliminado';
  kind: Kind;
  name: string;
  site: Site;
  actor: string;
  description: string;
  occurredAt: string;
};
export type Field = {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'record';
  options?: readonly string[];
  recordKind?: Kind;
  placeholder?: string;
  required?: boolean;
};
export type Template = {
  id: string;
  title: string;
  kind: Kind;
  equipmentType?: EquipmentType;
  icon: string;
  description: string;
  fields: Field[];
};

const equipmentStateFields: Field[] = [
  { key: 'estadoUso', label: 'Estado de uso', type: 'select', options: EQUIPMENT_STATES },
  {
    key: 'motivoEstado',
    label: 'Motivo o condición de uso',
    type: 'textarea',
    placeholder: 'Ej. En reserva, fuera de servicio o pendiente de baja',
  },
];

export const TEMPLATES: Template[] = [
  {
    id: 'switch',
    title: 'Switch',
    kind: 'equipo',
    equipmentType: 'switch',
    icon: 'Network',
    description: 'Modelo, puertos, gestión y ubicación física.',
    fields: [
      { key: 'marca', label: 'Marca' },
      { key: 'modelo', label: 'Modelo' },
      { key: 'serie', label: 'Número de serie' },
      { key: 'ipGestion', label: 'IP de gestión', placeholder: 'IPv4 o IPv6' },
      { key: 'puertos', label: 'Número de puertos', type: 'number' },
      { key: 'rack', label: 'Rack', type: 'record', recordKind: 'rack' },
      { key: 'unidad', label: 'Unidad de rack (U)' },
      { key: 'firmware', label: 'Versión de firmware' },
      ...equipmentStateFields,
      { key: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  {
    id: 'computadora',
    title: 'Computadora de escritorio',
    kind: 'equipo',
    equipmentType: 'computadora',
    icon: 'Monitor',
    description: 'Inventario, sistema, red y área usuaria.',
    fields: [
      { key: 'inventario', label: 'Número de inventario' },
      { key: 'marca', label: 'Marca' },
      { key: 'modelo', label: 'Modelo' },
      { key: 'serie', label: 'Número de serie' },
      { key: 'procesador', label: 'Procesador' },
      { key: 'memoria', label: 'Memoria RAM' },
      { key: 'almacenamiento', label: 'Almacenamiento' },
      { key: 'sistema', label: 'Sistema operativo' },
      { key: 'ipGestion', label: 'Dirección IP' },
      { key: 'mac', label: 'Dirección MAC' },
      { key: 'area', label: 'Área usuaria' },
      { key: 'puerto', label: 'Puerto de switch', type: 'record', recordKind: 'puerto' },
      ...equipmentStateFields,
      { key: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  {
    id: 'laptop',
    title: 'Laptop',
    kind: 'equipo',
    equipmentType: 'laptop',
    icon: 'Laptop',
    description: 'Equipo portátil, responsable, sistema y conectividad.',
    fields: [
      { key: 'inventario', label: 'Número de inventario' },
      { key: 'marca', label: 'Marca' },
      { key: 'modelo', label: 'Modelo' },
      { key: 'serie', label: 'Número de serie' },
      { key: 'procesador', label: 'Procesador' },
      { key: 'memoria', label: 'Memoria RAM' },
      { key: 'sistema', label: 'Sistema operativo' },
      { key: 'ipGestion', label: 'Dirección IP' },
      { key: 'mac', label: 'Dirección MAC' },
      { key: 'area', label: 'Área usuaria' },
      ...equipmentStateFields,
      { key: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  {
    id: 'impresora',
    title: 'Impresora',
    kind: 'equipo',
    equipmentType: 'impresora',
    icon: 'Printer',
    description: 'Identificación, red y área de servicio.',
    fields: [
      { key: 'marca', label: 'Marca' },
      { key: 'modelo', label: 'Modelo' },
      { key: 'serie', label: 'Número de serie' },
      { key: 'ipGestion', label: 'Dirección IP' },
      { key: 'area', label: 'Área usuaria' },
      {
        key: 'conexion',
        label: 'Conexión',
        type: 'select',
        options: ['Ethernet', 'Wi-Fi', 'USB', 'Otra'],
      },
      ...equipmentStateFields,
      { key: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  {
    id: 'punto_acceso',
    title: 'Punto de acceso',
    kind: 'equipo',
    equipmentType: 'punto_acceso',
    icon: 'Wifi',
    description: 'Cobertura, alimentación y red inalámbrica.',
    fields: [
      { key: 'marca', label: 'Marca' },
      { key: 'modelo', label: 'Modelo' },
      { key: 'serie', label: 'Número de serie' },
      { key: 'ipGestion', label: 'IP de gestión' },
      { key: 'zona', label: 'Zona de cobertura' },
      {
        key: 'poe',
        label: 'Alimentación',
        type: 'select',
        options: ['PoE', 'PoE+', 'PoE++', 'Adaptador', 'Por confirmar'],
      },
      { key: 'vlan', label: 'VLAN de gestión', type: 'record', recordKind: 'vlan' },
      ...equipmentStateFields,
      { key: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  {
    id: 'telefono_ip',
    title: 'Teléfono IP',
    kind: 'equipo',
    equipmentType: 'telefono_ip',
    icon: 'Phone',
    description: 'Extensión, puerto y alimentación PoE.',
    fields: [
      { key: 'marca', label: 'Marca' },
      { key: 'modelo', label: 'Modelo' },
      { key: 'serie', label: 'Número de serie' },
      { key: 'ipGestion', label: 'Dirección IP' },
      { key: 'extension', label: 'Extensión' },
      { key: 'usuario', label: 'Área o usuario' },
      {
        key: 'poe',
        label: 'Alimentación',
        type: 'select',
        options: ['PoE', 'PoE+', 'Adaptador', 'Por confirmar'],
      },
      ...equipmentStateFields,
      { key: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  {
    id: 'servidor',
    title: 'Servidor',
    kind: 'equipo',
    equipmentType: 'servidor',
    icon: 'Server',
    description: 'Rol, red, sistema y rack.',
    fields: [
      { key: 'marca', label: 'Marca' },
      { key: 'modelo', label: 'Modelo' },
      { key: 'serie', label: 'Número de serie' },
      { key: 'ipGestion', label: 'IP principal' },
      { key: 'rol', label: 'Función o servicio' },
      { key: 'sistema', label: 'Sistema operativo' },
      { key: 'rack', label: 'Rack', type: 'record', recordKind: 'rack' },
      { key: 'unidad', label: 'Unidad de rack (U)' },
      ...equipmentStateFields,
      { key: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  {
    id: 'router',
    title: 'Router',
    kind: 'equipo',
    equipmentType: 'router',
    icon: 'Router',
    description: 'Enlaces WAN, red interna y gestión.',
    fields: [
      { key: 'marca', label: 'Marca' },
      { key: 'modelo', label: 'Modelo' },
      { key: 'serie', label: 'Número de serie' },
      { key: 'ipGestion', label: 'IP de gestión' },
      { key: 'wan', label: 'Enlace o interfaz WAN' },
      { key: 'lan', label: 'Redes LAN atendidas' },
      { key: 'rack', label: 'Rack', type: 'record', recordKind: 'rack' },
      { key: 'firmware', label: 'Versión de firmware' },
      ...equipmentStateFields,
      { key: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  {
    id: 'firewall',
    title: 'Firewall',
    kind: 'equipo',
    equipmentType: 'firewall',
    icon: 'Shield',
    description: 'Segmentos protegidos, interfaces y ubicación.',
    fields: [
      { key: 'marca', label: 'Marca' },
      { key: 'modelo', label: 'Modelo' },
      { key: 'serie', label: 'Número de serie' },
      { key: 'ipGestion', label: 'IP de gestión' },
      { key: 'wan', label: 'Interfaz exterior' },
      { key: 'lan', label: 'Segmentos interiores' },
      { key: 'rack', label: 'Rack', type: 'record', recordKind: 'rack' },
      ...equipmentStateFields,
      { key: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  {
    id: 'camara_ip',
    title: 'Cámara IP',
    kind: 'equipo',
    equipmentType: 'camara_ip',
    icon: 'Camera',
    description: 'Ubicación, alimentación y direccionamiento.',
    fields: [
      { key: 'marca', label: 'Marca' },
      { key: 'modelo', label: 'Modelo' },
      { key: 'serie', label: 'Número de serie' },
      { key: 'ipGestion', label: 'Dirección IP' },
      { key: 'zona', label: 'Zona cubierta' },
      {
        key: 'poe',
        label: 'Alimentación',
        type: 'select',
        options: ['PoE', 'PoE+', 'Adaptador', 'Por confirmar'],
      },
      { key: 'puerto', label: 'Puerto de switch', type: 'record', recordKind: 'puerto' },
      ...equipmentStateFields,
      { key: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  {
    id: 'ups',
    title: 'UPS',
    kind: 'equipo',
    equipmentType: 'ups',
    icon: 'BatteryCharging',
    description: 'Respaldo eléctrico, capacidad y autonomía.',
    fields: [
      { key: 'marca', label: 'Marca' },
      { key: 'modelo', label: 'Modelo' },
      { key: 'serie', label: 'Número de serie' },
      { key: 'ipGestion', label: 'IP de gestión (si aplica)' },
      { key: 'capacidad', label: 'Capacidad (VA)' },
      { key: 'autonomia', label: 'Autonomía estimada' },
      { key: 'rack', label: 'Rack', type: 'record', recordKind: 'rack' },
      ...equipmentStateFields,
      { key: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  {
    id: 'nas',
    title: 'Almacenamiento NAS',
    kind: 'equipo',
    equipmentType: 'nas',
    icon: 'HardDrive',
    description: 'Capacidad, red, sistema y ubicación física.',
    fields: [
      { key: 'marca', label: 'Marca' },
      { key: 'modelo', label: 'Modelo' },
      { key: 'serie', label: 'Número de serie' },
      { key: 'ipGestion', label: 'Dirección IP' },
      { key: 'capacidad', label: 'Capacidad utilizable' },
      { key: 'sistema', label: 'Sistema o firmware' },
      { key: 'rack', label: 'Rack', type: 'record', recordKind: 'rack' },
      ...equipmentStateFields,
      { key: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  {
    id: 'ip',
    title: 'Dirección IP',
    kind: 'ip',
    icon: 'Hash',
    description: 'Asignación, segmento y puerta de enlace.',
    fields: [
      { key: 'direccion', label: 'Dirección IPv4 o IPv6', required: true },
      { key: 'prefijo', label: 'Prefijo o máscara' },
      { key: 'equipo', label: 'Equipo asignado', type: 'record', recordKind: 'equipo' },
      { key: 'vlan', label: 'VLAN', type: 'record', recordKind: 'vlan' },
      { key: 'gateway', label: 'Puerta de enlace' },
      { key: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  {
    id: 'puerto',
    title: 'Puerto de switch',
    kind: 'puerto',
    icon: 'Cable',
    description: 'Modo, VLAN y destino conectado.',
    fields: [
      { key: 'switch', label: 'Switch', type: 'record', recordKind: 'equipo', required: true },
      { key: 'numero', label: 'Puerto / interfaz', required: true, placeholder: 'Gi1/0/1' },
      {
        key: 'modo',
        label: 'Modo',
        type: 'select',
        options: ['Acceso', 'Troncal', 'Híbrido', 'Por confirmar'],
      },
      { key: 'vlan', label: 'VLAN', type: 'record', recordKind: 'vlan' },
      { key: 'destino', label: 'Equipo conectado', type: 'record', recordKind: 'equipo' },
      { key: 'poe', label: 'PoE', type: 'select', options: ['Sí', 'No', 'Por confirmar'] },
      { key: 'cable', label: 'Etiqueta de cable', type: 'record', recordKind: 'cable' },
      { key: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  {
    id: 'vlan',
    title: 'VLAN',
    kind: 'vlan',
    icon: 'Layers',
    description: 'ID, nombre, segmento y propósito.',
    fields: [
      { key: 'vlanId', label: 'ID de VLAN', type: 'number', required: true },
      { key: 'subred', label: 'Subred / prefijo' },
      { key: 'proposito', label: 'Propósito' },
      { key: 'gateway', label: 'Puerta de enlace' },
      { key: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  {
    id: 'nodo',
    title: 'Etiqueta de nodo',
    kind: 'nodo',
    icon: 'Tag',
    description: 'Etiqueta física y correspondencia de cableado.',
    fields: [
      { key: 'etiqueta', label: 'Código de etiqueta', required: true },
      { key: 'area', label: 'Área o sala' },
      { key: 'panel', label: 'Patch panel', type: 'record', recordKind: 'panel' },
      { key: 'puertoPanel', label: 'Puerto del panel' },
      { key: 'destino', label: 'Equipo o destino', type: 'record', recordKind: 'equipo' },
      { key: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  {
    id: 'cable',
    title: 'Etiqueta de cable',
    kind: 'cable',
    icon: 'Cable',
    description: 'Código visible, extremos y características del cableado.',
    fields: [
      { key: 'codigo', label: 'Código de cable', required: true, placeholder: 'Ej. CBL-COL-001' },
      { key: 'etiquetaA', label: 'Etiqueta en extremo A' },
      { key: 'etiquetaB', label: 'Etiqueta en extremo B' },
      { key: 'extremoA', label: 'Origen físico', placeholder: 'Rack, patch panel o puerto' },
      { key: 'extremoB', label: 'Destino físico', placeholder: 'Nodo, equipo o puerto' },
      {
        key: 'tipoCable',
        label: 'Medio',
        type: 'select',
        options: ['UTP', 'Fibra óptica', 'Coaxial', 'DAC', 'Otro', 'Por confirmar'],
      },
      { key: 'categoria', label: 'Categoría o tipo de fibra' },
      { key: 'longitud', label: 'Longitud (m)', type: 'number' },
      { key: 'panel', label: 'Patch panel', type: 'record', recordKind: 'panel' },
      { key: 'puertoPanel', label: 'Puerto del panel' },
      { key: 'nodo', label: 'Etiqueta de nodo', type: 'record', recordKind: 'nodo' },
      {
        key: 'estadoCable',
        label: 'Estado del cable',
        type: 'select',
        options: ['En servicio', 'Reserva', 'Desconectado', 'Por confirmar'],
      },
      { key: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  {
    id: 'rack',
    title: 'Rack',
    kind: 'rack',
    icon: 'PanelTop',
    description: 'Ubicación, capacidad y referencia.',
    fields: [
      { key: 'codigo', label: 'Código de rack', required: true },
      { key: 'sala', label: 'Sala o cuarto' },
      { key: 'capacidad', label: 'Capacidad (U)', type: 'number' },
      { key: 'energia', label: 'Alimentación / UPS' },
      { key: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  {
    id: 'panel',
    title: 'Patch panel',
    kind: 'panel',
    icon: 'Grid2X2',
    description: 'Rack, cantidad de puertos y rango de etiquetas.',
    fields: [
      { key: 'rack', label: 'Rack', type: 'record', recordKind: 'rack' },
      { key: 'puertos', label: 'Cantidad de puertos', type: 'number' },
      { key: 'unidad', label: 'Unidad de rack (U)' },
      { key: 'rango', label: 'Rango de etiquetas' },
      { key: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  {
    id: 'troncal',
    title: 'Enlace troncal',
    kind: 'troncal',
    icon: 'GitBranch',
    description: 'Origen, destino, medio y capacidad.',
    fields: [
      {
        key: 'origen',
        label: 'Equipo de origen',
        type: 'record',
        recordKind: 'equipo',
        required: true,
      },
      { key: 'puertoOrigen', label: 'Puerto de origen' },
      {
        key: 'destino',
        label: 'Equipo de destino',
        type: 'record',
        recordKind: 'equipo',
        required: true,
      },
      { key: 'puertoDestino', label: 'Puerto de destino' },
      {
        key: 'medio',
        label: 'Medio',
        type: 'select',
        options: ['Fibra', 'Cobre', 'Inalámbrico', 'Por confirmar'],
      },
      { key: 'capacidad', label: 'Capacidad' },
      { key: 'vlans', label: 'VLANs transportadas' },
      { key: 'cable', label: 'Etiqueta de cable', type: 'record', recordKind: 'cable' },
      { key: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  {
    id: 'poe',
    title: 'Dispositivo PoE',
    kind: 'poe',
    icon: 'Zap',
    description: 'Fuente, puerto, estándar y consumo.',
    fields: [
      {
        key: 'equipo',
        label: 'Dispositivo alimentado',
        type: 'record',
        recordKind: 'equipo',
        required: true,
      },
      { key: 'switch', label: 'Switch fuente', type: 'record', recordKind: 'equipo' },
      { key: 'puerto', label: 'Puerto fuente' },
      {
        key: 'estandar',
        label: 'Estándar',
        type: 'select',
        options: ['802.3af', '802.3at', '802.3bt', 'Pasivo', 'Por confirmar'],
      },
      { key: 'consumo', label: 'Consumo estimado (W)', type: 'number' },
      { key: 'presupuesto', label: 'Presupuesto del puerto (W)', type: 'number' },
      { key: 'notas', label: 'Notas', type: 'textarea' },
    ],
  },
  {
    id: 'pendiente',
    title: 'Pendiente o inconsistencia',
    kind: 'pendiente',
    icon: 'AlertCircle',
    description: 'Hallazgo, responsable y resolución.',
    fields: [
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['Pendiente', 'Inconsistencia'] },
      { key: 'prioridad', label: 'Prioridad', type: 'select', options: ['Alta', 'Media', 'Baja'] },
      { key: 'responsable', label: 'Responsable' },
      { key: 'fechaLimite', label: 'Fecha límite', type: 'date' },
      { key: 'detalle', label: 'Descripción', type: 'textarea', required: true },
      { key: 'resolucion', label: 'Resolución / seguimiento', type: 'textarea' },
    ],
  },
  {
    id: 'prueba',
    title: 'Prueba realizada',
    kind: 'prueba',
    icon: 'FlaskConical',
    description: 'Evidencia de conectividad o validación.',
    fields: [
      { key: 'fecha', label: 'Fecha', type: 'date', required: true },
      { key: 'equipo', label: 'Equipo', type: 'record', recordKind: 'equipo' },
      { key: 'tipo', label: 'Tipo de prueba' },
      {
        key: 'resultado',
        label: 'Resultado',
        type: 'select',
        options: ['Aprobada', 'Fallida', 'Por confirmar'],
      },
      { key: 'detalle', label: 'Procedimiento y evidencia', type: 'textarea' },
    ],
  },
  {
    id: 'reporte',
    title: 'Reporte semanal',
    kind: 'reporte',
    icon: 'FileText',
    description: 'Avances, inventario, pruebas y siguientes pasos.',
    fields: [
      { key: 'semana', label: 'Semana que inicia', type: 'date', required: true },
      { key: 'avances', label: 'Avances de la semana', type: 'textarea', required: true },
      { key: 'equipos', label: 'Equipos inventariados', type: 'textarea' },
      { key: 'pruebas', label: 'Pruebas realizadas', type: 'textarea' },
      { key: 'proximos', label: 'Próximos pasos', type: 'textarea', required: true },
      { key: 'notas', label: 'Observaciones', type: 'textarea' },
    ],
  },
];
export const KIND_LABELS: Record<Kind, string> = {
  equipo: 'Equipo',
  ip: 'Dirección IP',
  puerto: 'Puerto',
  vlan: 'VLAN',
  nodo: 'Nodo',
  cable: 'Etiqueta de cable',
  rack: 'Rack',
  panel: 'Patch panel',
  troncal: 'Enlace troncal',
  poe: 'PoE',
  pendiente: 'Pendiente',
  prueba: 'Prueba',
  reporte: 'Reporte',
};
export const VERIFICATION_LABELS: Record<Verification, string> = {
  verificado: 'Verificado',
  pendiente: 'Pendiente',
  por_confirmar: 'Por confirmar',
};
export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  switch: 'Switch',
  computadora: 'Computadora de escritorio',
  laptop: 'Laptop',
  impresora: 'Impresora',
  punto_acceso: 'Punto de acceso',
  telefono_ip: 'Teléfono IP',
  servidor: 'Servidor',
  router: 'Router',
  firewall: 'Firewall',
  camara_ip: 'Cámara IP',
  ups: 'UPS',
  nas: 'Almacenamiento NAS',
};
export function templateFor(record: Pick<RecordItem, 'kind' | 'payload'>): Template {
  if (record.kind === 'equipo')
    return TEMPLATES.find((t) => t.id === record.payload.tipo) ?? TEMPLATES[0];
  return TEMPLATES.find((t) => t.kind === record.kind) ?? TEMPLATES[0];
}
