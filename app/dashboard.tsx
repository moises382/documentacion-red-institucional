'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowDownToLine,
  ArrowRight,
  BatteryCharging,
  Boxes,
  Cable,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  Filter,
  FlaskConical,
  GitBranch,
  Grid2X2,
  HardDrive,
  Hash,
  Headphones,
  Languages,
  Layers,
  LayoutDashboard,
  Laptop,
  LockKeyhole,
  MapPin,
  Menu,
  Monitor,
  Network,
  PanelTop,
  Pencil,
  Phone,
  Plus,
  Printer,
  Router,
  Search,
  Server,
  Shield,
  ShieldCheck,
  Tag,
  Trash2,
  Wifi,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from 'lucide-react';
import { LANGUAGES, LanguageProvider, useI18n } from './i18n';
import VaultPanel from './vault-panel';
import {
  EQUIPMENT_LABELS,
  EQUIPMENT_STATES,
  KIND_LABELS,
  SITES,
  TEMPLATES,
  VERIFICATION_LABELS,
  type ChangeItem,
  type EquipmentState,
  type Kind,
  type RecordItem,
  type Site,
  type Template,
  type Verification,
  templateFor,
} from '@/lib/models';

type View =
  | 'resumen'
  | 'inventario'
  | 'topologia'
  | 'pendientes'
  | 'reportes'
  | 'historial'
  | 'plantillas'
  | 'boveda';
type SiteFilter = Site | 'Todas las sedes';
type Modal = { mode: 'choose' } | { mode: 'form'; template: Template; record?: RecordItem } | null;
const iconMap: Record<string, LucideIcon> = {
  Network,
  Monitor,
  Laptop,
  Router,
  Shield,
  Camera,
  BatteryCharging,
  HardDrive,
  Headphones,
  Printer,
  Wifi,
  Phone,
  Server,
  Hash,
  Cable,
  Layers,
  Tag,
  PanelTop,
  Grid2X2,
  GitBranch,
  Zap,
  AlertCircle,
  FlaskConical,
  FileText,
};
const nav: { id: View; title: string; icon: LucideIcon }[] = [
  { id: 'resumen', title: 'Resumen', icon: LayoutDashboard },
  { id: 'inventario', title: 'Inventario', icon: Boxes },
  { id: 'topologia', title: 'Topología', icon: Network },
  { id: 'pendientes', title: 'Pendientes y pruebas', icon: AlertCircle },
  { id: 'reportes', title: 'Reportes semanales', icon: FileText },
  { id: 'historial', title: 'Historial de cambios', icon: Activity },
  { id: 'plantillas', title: 'Plantillas', icon: Grid2X2 },
  { id: 'boveda', title: 'Bóveda segura', icon: LockKeyhole },
];
const inventoryKinds: Kind[] = [
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
  'componente_telefono',
];
const quickEquipment = new Set(['switch', 'computadora', 'laptop', 'punto_acceso', 'servidor']);
const equipmentCode: Record<string, string> = {
  switch: 'SW',
  computadora: 'PC',
  laptop: 'LT',
  impresora: 'PR',
  punto_acceso: 'AP',
  telefono_ip: 'IP',
  servidor: 'SV',
  router: 'RT',
  firewall: 'FW',
  camara_ip: 'CAM',
  ups: 'UPS',
  nas: 'NAS',
};
function parseDate(value: string) {
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
}
function date(value?: string, locale = 'es-MX') {
  if (!value) return '—';
  const d = parseDate(value);
  return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}
function shortDate(value?: string, locale = 'es-MX') {
  if (!value) return '—';
  const d = parseDate(value);
  return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }).format(d);
}
function weekStart() {
  const d = new Date();
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function kindTitle(record: RecordItem) {
  if (record.kind === 'equipo')
    return EQUIPMENT_LABELS[record.payload.tipo as keyof typeof EQUIPMENT_LABELS] ?? 'Equipo';
  return KIND_LABELS[record.kind];
}
function equipmentUsage(record: RecordItem): EquipmentState {
  const value = record.payload.estadoUso as EquipmentState;
  return EQUIPMENT_STATES.includes(value) ? value : 'Por confirmar';
}
function summary(record: RecordItem, all: RecordItem[]) {
  const p = record.payload;
  const resolve = (id?: string) =>
    all.find((r) => r.id === id)?.name ?? (id ? 'Referencia no encontrada' : '');
  switch (record.kind) {
    case 'equipo':
      return [p.modelo, p.ipGestion].filter(Boolean).join(' · ') || 'Sin detalles adicionales';
    case 'ip':
      return [p.direccion, resolve(p.equipo)].filter(Boolean).join(' · ');
    case 'puerto':
      return [resolve(p.switch), p.numero, p.modo].filter(Boolean).join(' · ');
    case 'vlan':
      return [p.vlanId, p.subred].filter(Boolean).join(' · ');
    case 'nodo':
      return [p.etiqueta, p.area].filter(Boolean).join(' · ');
    case 'cable':
      return [
        p.codigo,
        p.extremoA && p.extremoB ? `${p.extremoA} → ${p.extremoB}` : p.extremoA || p.extremoB,
      ]
        .filter(Boolean)
        .join(' · ');
    case 'rack':
      return [p.codigo, p.sala].filter(Boolean).join(' · ');
    case 'panel':
      return [resolve(p.rack), p.puertos && `${p.puertos} puertos`].filter(Boolean).join(' · ');
    case 'troncal':
      return [resolve(p.origen), resolve(p.destino)].filter(Boolean).join(' → ');
    case 'poe':
      return [resolve(p.equipo), p.consumo && `${p.consumo} W`].filter(Boolean).join(' · ');
    case 'componente_telefono':
      return [p.tipo, resolve(p.telefono), p.modelo].filter(Boolean).join(' · ');
    case 'pendiente':
      return [p.tipo, p.prioridad].filter(Boolean).join(' · ');
    case 'prueba':
      return [p.tipo, p.resultado].filter(Boolean).join(' · ');
    case 'reporte':
      return p.semana ? `Semana del ${shortDate(p.semana)}` : 'Reporte semanal';
  }
}
function getIcon(record: RecordItem) {
  return iconMap[templateFor(record).icon] ?? HardDrive;
}
function Status({ value }: { value: Verification }) {
  const { t } = useI18n();
  const I = value === 'verificado' ? CheckCircle2 : value === 'pendiente' ? Clock3 : CircleHelp;
  return (
    <span className={`status status-${value}`}>
      <I size={13} />
      {t(VERIFICATION_LABELS[value])}
    </span>
  );
}
function UsageStatus({ value }: { value: EquipmentState }) {
  const { t } = useI18n();
  const style = value.toLowerCase().replaceAll(' ', '-');
  return (
    <span className={`usage-status usage-status-${style}`}>
      <i aria-hidden="true" />
      {t(value)}
    </span>
  );
}
function Empty({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={26} />
      </span>
      <h3>{t(title)}</h3>
      <p>{t(description)}</p>
      {action}
    </div>
  );
}

export default function Dashboard({ displayName, hosted = false }: { displayName: string; hosted?: boolean }) {
  return (
    <LanguageProvider>
      <DashboardContent displayName={displayName} hosted={hosted} />
    </LanguageProvider>
  );
}

function DashboardContent({ displayName, hosted }: { displayName: string; hosted: boolean }) {
  const { language, setLanguage, t, dateLocale } = useI18n();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [changes, setChanges] = useState<ChangeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [view, setView] = useState<View>('resumen');
  const [site, setSite] = useState<SiteFilter>('Todas las sedes');
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<Kind | 'todos'>('todos');
  const [verificationFilter, setVerificationFilter] = useState<Verification | 'todos'>('todos');
  const [usageFilter, setUsageFilter] = useState<EquipmentState | 'todos'>('todos');
  const [modal, setModal] = useState<Modal>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [workTab, setWorkTab] = useState<'pendientes' | 'pruebas'>('pendientes');
  const [preferredVaultRecordId, setPreferredVaultRecordId] = useState('');
  const selected = records.find((r) => r.id === selectedId) ?? null;

  const reload = useCallback(async () => {
    try {
      const response = await fetch('/api/data', { cache: 'no-store' });
      const result = (await response.json()) as {
        error?: string;
        records: RecordItem[];
        changes: ChangeItem[];
      };
      if (!response.ok) throw new Error(result.error ?? 'No se pudo cargar la información.');
      setRecords(result.records);
      setChanges(result.changes);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar la información.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  const scoped = useMemo(
    () => records.filter((r) => site === 'Todas las sedes' || r.site === site),
    [records, site],
  );
  const visibleChanges = useMemo(
    () => changes.filter((c) => site === 'Todas las sedes' || c.site === site),
    [changes, site],
  );
  const equipment = scoped.filter((r) => r.kind === 'equipo');
  const usableItems = scoped.filter(
    (r) => r.kind === 'equipo' || r.kind === 'componente_telefono',
  );
  const usageCounts = Object.fromEntries(
    EQUIPMENT_STATES.map((state) => [
      state,
      usableItems.filter((record) => equipmentUsage(record) === state).length,
    ]),
  ) as Record<EquipmentState, number>;
  const pending = scoped.filter((r) => r.kind === 'pendiente' && r.verification !== 'verificado');
  const tests = scoped.filter((r) => r.kind === 'prueba');
  const crossSiteLinks = records
    .filter((r) => r.kind === 'troncal')
    .filter((r) => {
      const a = records.find((x) => x.id === r.payload.origen);
      const b = records.find((x) => x.id === r.payload.destino);
      return (
        a &&
        b &&
        a.site !== b.site &&
        (site === 'Todas las sedes' || a.site === site || b.site === site)
      );
    });
  const verified = scoped.filter((r) => r.verification === 'verificado' && r.kind !== 'reporte');
  const documentable = scoped.filter(
    (r) => r.kind !== 'reporte' && r.kind !== 'pendiente' && r.kind !== 'prueba',
  );
  const percentage = documentable.length
    ? Math.round(
        (documentable.filter((r) => r.verification === 'verificado').length / documentable.length) *
          100,
      )
    : 0;
  const filteredInventory = useMemo(
    () =>
      scoped
        .filter((r) => inventoryKinds.includes(r.kind))
        .filter((r) => kindFilter === 'todos' || r.kind === kindFilter)
        .filter((r) => verificationFilter === 'todos' || r.verification === verificationFilter)
        .filter(
          (r) =>
            usageFilter === 'todos' ||
            ((r.kind === 'equipo' || r.kind === 'componente_telefono') &&
              equipmentUsage(r) === usageFilter),
        )
        .filter(
          (r) =>
            !search ||
            [r.name, r.site, r.location, kindTitle(r), ...Object.values(r.payload)]
              .join(' ')
              .toLowerCase()
              .includes(search.toLowerCase()),
        ),
    [scoped, kindFilter, verificationFilter, usageFilter, search],
  );
  const automaticIssues = useMemo(() => {
    const issues: { title: string; description: string; site: Site }[] = [];
    const ips = new Map<string, RecordItem[]>();
    const ports = new Map<string, RecordItem[]>();
    const cableLabels = new Map<string, RecordItem[]>();
    for (const r of scoped) {
      if (r.kind === 'ip' && r.payload.direccion) {
        const key = `${r.site}:${r.payload.direccion.toLowerCase()}`;
        ips.set(key, [...(ips.get(key) ?? []), r]);
      }
      if (r.kind === 'puerto' && r.payload.switch && r.payload.numero) {
        const key = `${r.payload.switch}:${r.payload.numero.toLowerCase()}`;
        ports.set(key, [...(ports.get(key) ?? []), r]);
      }
      if (r.kind === 'cable' && r.payload.codigo) {
        const key = `${r.site}:${r.payload.codigo.toLowerCase()}`;
        cableLabels.set(key, [...(cableLabels.get(key) ?? []), r]);
      }
      const template = templateFor(r);
      for (const field of template?.fields ?? []) {
        if (
          field.type === 'record' &&
          r.payload[field.key] &&
          !records.some((x) => x.id === r.payload[field.key])
        ) {
          issues.push({
            title: 'Referencia faltante',
            description: `${r.name}: ${field.label.toLowerCase()} apunta a un registro eliminado.`,
            site: r.site,
          });
        }
      }
    }
    for (const group of ips.values())
      if (group.length > 1)
        issues.push({
          title: 'Dirección IP duplicada',
          description: `${group[0].payload.direccion} aparece en ${group.map((r) => r.name).join(', ')}.`,
          site: group[0].site,
        });
    for (const group of ports.values())
      if (group.length > 1)
        issues.push({
          title: 'Puerto duplicado',
          description: `${group[0].payload.numero} aparece en ${group.map((r) => r.name).join(', ')}.`,
          site: group[0].site,
        });
    for (const group of cableLabels.values())
      if (group.length > 1)
        issues.push({
          title: 'Etiqueta de cable duplicada',
          description: `${group[0].payload.codigo} aparece en ${group.map((r) => r.name).join(', ')}.`,
          site: group[0].site,
        });
    return issues;
  }, [scoped, records]);

  async function mutate(body: Record<string, unknown>, success: string) {
    setBusy(true);
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'No se pudo guardar.');
      await reload();
      setToast(success);
      setModal(null);
      if (body.action === 'delete') setSelectedId(null);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar.');
      return false;
    } finally {
      setBusy(false);
    }
  }
  function openNew(template: Template) {
    setModal({ mode: 'form', template });
    setMobileMenu(false);
  }
  function openEdit(record: RecordItem) {
    const template = templateFor(record);
    setModal({ mode: 'form', template, record });
    setSelectedId(null);
  }
  function navigate(next: View) {
    setView(next);
    setMobileMenu(false);
    setSelectedId(null);
  }
  async function remove(record: RecordItem) {
    if (!window.confirm(`¿Eliminar «${record.name}»? El cambio quedará en el historial.`)) return;
    await mutate(
      { action: 'delete', id: record.id, baseUpdatedAt: record.updatedAt },
      'Registro eliminado',
    );
  }
  function reportMarkdown(report: RecordItem) {
    const p = report.payload;
    return `# ${report.name}\n\nSede: ${report.site}\nSemana: ${p.semana || 'Por confirmar'}\nEstado: ${VERIFICATION_LABELS[report.verification]}\n\n## Avances\n${p.avances || '—'}\n\n## Equipos inventariados\n${p.equipos || '—'}\n\n## Pruebas realizadas\n${p.pruebas || '—'}\n\n## Próximos pasos\n${p.proximos || '—'}\n\n## Observaciones\n${p.notas || '—'}\n`;
  }
  function downloadReport(report: RecordItem) {
    const blob = new Blob([reportMarkdown(report)], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-red-${report.site.toLowerCase()}-${report.payload.semana || 'semana'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }
  const siteTitle = site === 'Todas las sedes' ? t('Todas las sedes').toLowerCase() : site;
  const firstName = displayName === 'Proyecto' ? t('Proyecto') : displayName.includes('@')
    ? displayName.split('@')[0]
    : displayName.split(' ')[0];
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <Network size={22} strokeWidth={2.3} />
          </div>
          <div>
            <strong>{t('Red Institucional')}</strong>
            <span>{t('Centro de documentación')}</span>
          </div>
          <button
            className="mobile-close icon-button"
            onClick={() => setMobileMenu(false)}
            aria-label={t('Cerrar menú')}
          >
            <X size={20} />
          </button>
        </div>
        <div className="sidebar-label">{t('ESPACIO DE TRABAJO')}</div>
        <nav aria-label={t('Navegación principal')}>
          {nav.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              <item.icon size={18} />
              <span>{t(item.title)}</span>
              {item.id === 'pendientes' && pending.length > 0 && <em>{pending.length}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="privacy-box">
          <ShieldCheck size={17} />
          <div>
            <strong>{t(hosted ? 'Espacio privado' : 'Datos locales')}</strong>
            <span>{t(hosted ? 'Acceso privado. Las claves van en la bóveda cifrada.' : 'La demo usa SQLite en tu equipo. Las claves van en la bóveda cifrada.')}</span>
          </div>
        </div>
        <div className="user-card">
          <span className="avatar">{firstName.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{firstName}</strong>
            <span>{t('Documentación de red')}</span>
          </div>
        </div>
      </aside>
      {mobileMenu && (
        <button
          className="menu-backdrop"
          aria-label={t('Cerrar menú')}
          onClick={() => setMobileMenu(false)}
        />
      )}
      <div className="main-area">
        <header className="topbar">
          <button
            className="menu-button icon-button"
            onClick={() => setMobileMenu(true)}
            aria-label={t('Abrir menú')}
          >
            <Menu size={22} />
          </button>
          <div className="breadcrumbs">
            <span>{t('Proyecto')}</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{t(nav.find((n) => n.id === view)?.title ?? '')}</strong>
          </div>
          <div className="topbar-actions">
            <label className="language-select">
              <Languages size={16} />
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as typeof language)}
                aria-label={t('Idioma')}
              >
                {LANGUAGES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </label>
            <label className="site-select">
              <MapPin size={16} />
              <select
                value={site}
                onChange={(e) => setSite(e.target.value as SiteFilter)}
                aria-label={t('Filtrar por sede')}
              >
                <option value="Todas las sedes">{t('Todas las sedes')}</option>
                {SITES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <ChevronDown size={14} />
            </label>
            <button
              className="button button-primary top-add"
              onClick={() => setModal({ mode: 'choose' })}
            >
              <Plus size={17} />
              {t('Nuevo registro')}
            </button>
          </div>
        </header>
        <main className="content">
          {error && (
            <div className="error-banner" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button
                onClick={() => {
                  setError('');
                  void reload();
                }}
                aria-label="Reintentar"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {loading ? (
            <div className="loading">
              <span className="spinner" />
              {t('Cargando documentación…')}
            </div>
          ) : (
            <>
              {view === 'resumen' && (
                <section>
                  <div className="hero">
                    <div className="hero-copy">
                      <span className="eyebrow">
                        <span className="live-dot" />
                        {t(hosted ? 'PROYECTO ACTIVO' : 'PROYECTO PERSONAL')} · {siteTitle.toUpperCase()}
                      </span>
                      <h1>
                        {t('Tu red, documentada')}
                        <br />
                        <em>{t('con claridad.')}</em>
                      </h1>
                      <p>{t(hosted ? 'Inventario, cableado y seguimiento en un solo lugar. Retoma el trabajo desde cualquier equipo autorizado.' : 'Inventario, verificación y seguimiento en un solo lugar. Esta versión guarda los datos en tu equipo.')}</p>
                      <div className="hero-actions">
                        <button
                          className="button button-light"
                          onClick={() => setModal({ mode: 'choose' })}
                        >
                          <Plus size={17} />
                          {t('Agregar registro')}
                        </button>
                        <button
                          className="button button-ghost-light"
                          onClick={() => navigate('topologia')}
                        >
                          {t('Ver topología')} <ArrowRight size={17} />
                        </button>
                      </div>
                    </div>
                    <div className="hero-art" aria-hidden="true">
                      <div className="art-orbit art-orbit-one" />
                      <div className="art-orbit art-orbit-two" />
                      <div className="art-line art-line-one" />
                      <div className="art-line art-line-two" />
                      <div className="art-line art-line-three" />
                      <span className="art-node art-node-main">
                        <Network size={28} />
                      </span>
                      <span className="art-node art-node-a">
                        <Server size={22} />
                      </span>
                      <span className="art-node art-node-b">
                        <Wifi size={22} />
                      </span>
                      <span className="art-node art-node-c">
                        <Printer size={22} />
                      </span>
                      <span className="art-pulse" />
                    </div>
                  </div>
                  <div className="section-heading">
                    <div>
                      <span className="section-kicker">{t('PANORAMA')}</span>
                      <h2>{t('Estado de la documentación')}</h2>
                    </div>
                    <span className="muted-small">{t('Actualizado con tus registros')}</span>
                  </div>
                  <div className="stats-grid">
                    <Stat
                      icon={Boxes}
                      label="Equipos inventariados"
                      value={equipment.length}
                      color="blue"
                    />
                    <Stat
                      icon={CheckCircle2}
                      label="Registros verificados"
                      value={verified.length}
                      color="green"
                    />
                    <Stat
                      icon={AlertCircle}
                      label="Pendientes abiertos"
                      value={pending.length + automaticIssues.length}
                      color="orange"
                    />
                    <Stat
                      icon={FlaskConical}
                      label="Pruebas registradas"
                      value={tests.length}
                      color="purple"
                    />
                  </div>
                  <div className="usage-overview card">
                    <div>
                      <span className="section-kicker">{t('ESTADO DE USO')}</span>
                      <h3>{t('Equipos y componentes por estado')}</h3>
                    </div>
                    <div className="usage-overview-grid">
                      {EQUIPMENT_STATES.map((state) => (
                        <button
                          key={state}
                          onClick={() => {
                            setKindFilter('todos');
                            setUsageFilter(state);
                            setVerificationFilter('todos');
                            setSearch('');
                            navigate('inventario');
                          }}
                        >
                          <UsageStatus value={state} />
                          <strong>{usageCounts[state]}</strong>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="dashboard-grid">
                    <div className="card progress-card">
                      <div className="card-title-row">
                        <div>
                          <span className="section-kicker">{t('AVANCE')}</span>
                          <h3>{t('Verificación del inventario')}</h3>
                        </div>
                        <span className="large-percent">{percentage}%</span>
                      </div>
                      <p>
                        {documentable.filter((r) => r.verification === 'verificado').length} {t('de')}{' '}
                        {documentable.length} {t('registros de inventario verificados.')}
                      </p>
                      <div className="progress-track">
                        <span style={{ width: `${percentage}%` }} />
                      </div>
                      <div className="progress-legend">
                        <span>
                          <i className="legend-dot green" />
                          {t('Verificado')}
                        </span>
                        <span>
                          <i className="legend-dot amber" />
                          {t('Pendiente')}
                        </span>
                        <span>
                          <i className="legend-dot gray" />
                          {t('Por confirmar')}
                        </span>
                      </div>
                      <div className="site-breakdown">
                        {SITES.map((s) => {
                          const rows = records.filter(
                            (r) => r.site === s && inventoryKinds.includes(r.kind),
                          );
                          const done = rows.filter((r) => r.verification === 'verificado').length;
                          return (
                            <button
                              key={s}
                              className="site-row"
                              onClick={() => {
                                setSite(s);
                                navigate('inventario');
                              }}
                            >
                              <span>{s}</span>
                              <div className="mini-track">
                                <span
                                  style={{
                                    width: `${rows.length ? Math.round((done / rows.length) * 100) : 0}%`,
                                  }}
                                />
                              </div>
                              <strong>
                                {done}/{rows.length}
                              </strong>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="card attention-card">
                      <div className="card-title-row">
                        <div>
                          <span className="section-kicker">{t('SEGUIMIENTO')}</span>
                          <h3>{t('Requiere atención')}</h3>
                        </div>
                        <button className="text-link" onClick={() => navigate('pendientes')}>
                          {t('Ver todos')} <ArrowRight size={14} />
                        </button>
                      </div>
                      {pending.length + automaticIssues.length === 0 ? (
                        <div className="compact-empty">
                          <CheckCircle2 size={30} />
                          <strong>{t('Sin pendientes abiertos')}</strong>
                          <span>{t('Los nuevos hallazgos aparecerán aquí.')}</span>
                        </div>
                      ) : (
                        <div className="attention-list">
                          {[
                            ...automaticIssues.map((a, i) => ({
                              id: `auto-${i}`,
                              title: a.title,
                              subtitle: a.description,
                              site: a.site,
                              auto: true,
                            })),
                            ...pending.map((p) => ({
                              id: p.id,
                              title: p.name,
                              subtitle: p.payload.detalle || 'Sin descripción',
                              site: p.site,
                              auto: false,
                            })),
                          ]
                            .slice(0, 4)
                            .map((item) => (
                              <button
                                key={item.id}
                                className="attention-item"
                                onClick={() =>
                                  item.auto ? navigate('pendientes') : setSelectedId(item.id)
                                }
                              >
                                <span className="attention-icon">
                                  <AlertCircle size={17} />
                                </span>
                                <span className="attention-text">
                                  <strong>{item.title}</strong>
                                  <small>{item.subtitle}</small>
                                </span>
                                <span className="location-tag">{item.site}</span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="dashboard-bottom">
                    <div className="card">
                      <div className="card-title-row">
                        <div>
                          <span className="section-kicker">{t('ACCESO RÁPIDO')}</span>
                          <h3>{t('Plantillas de equipo')}</h3>
                        </div>
                        <button className="text-link" onClick={() => navigate('plantillas')}>
                          {t('Todas')} <ArrowRight size={14} />
                        </button>
                      </div>
                      <div className="quick-templates">
                        {TEMPLATES.filter((template) => quickEquipment.has(template.id)).map((template) => {
                          const I = iconMap[template.icon];
                          return (
                            <button key={template.id} onClick={() => openNew(template)}>
                              <span className="quick-icon">
                                <I size={20} />
                              </span>
                              <strong>{t(template.title)}</strong>
                              <Plus size={16} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="card activity-card">
                      <div className="card-title-row">
                        <div>
                          <span className="section-kicker">{t('BITÁCORA')}</span>
                          <h3>{t('Actividad reciente')}</h3>
                        </div>
                        <button className="text-link" onClick={() => navigate('historial')}>
                          {t('Historial')} <ArrowRight size={14} />
                        </button>
                      </div>
                      {visibleChanges.length === 0 ? (
                        <div className="compact-empty">
                          <Clock3 size={26} />
                          <strong>{t('Aún no hay cambios')}</strong>
                          <span>{t('Tu actividad se registrará aquí.')}</span>
                        </div>
                      ) : (
                        visibleChanges.slice(0, 4).map((c) => (
                          <div className="activity-row" key={c.id}>
                            <span className="activity-dot" />
                            <div>
                              <strong>{c.name}</strong>
                              <span>
                                {t(c.action)} · {c.site}
                              </span>
                            </div>
                            <time>{shortDate(c.occurredAt, dateLocale)}</time>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </section>
              )}
              {view === 'inventario' && (
                <section>
                  <PageHeader
                    kicker="INVENTARIO"
                    title="Mapa de activos y conexiones"
                    description="Consulta y actualiza equipos, direccionamiento, cableado y componentes físicos."
                    action={
                      <button
                        className="button button-primary"
                        onClick={() => setModal({ mode: 'choose' })}
                      >
                        <Plus size={17} />
                        {t('Nuevo registro')}
                      </button>
                    }
                  />
                  <div className="inventory-summary">
                    <span>
                      <Boxes size={17} />
                      {scoped.filter((r) => inventoryKinds.includes(r.kind)).length} {t('registros')}
                    </span>
                    <span>
                      <CheckCircle2 size={17} />
                      {
                        scoped.filter(
                          (r) => inventoryKinds.includes(r.kind) && r.verification === 'verificado',
                        ).length
                      }{' '}
                      {t('verificados')}
                    </span>
                    <span>
                      <MapPin size={17} />
                      {siteTitle}
                    </span>
                  </div>
                  <div className="card table-card">
                    <div className="table-toolbar">
                      <label className="search-field">
                        <Search size={17} />
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder={t('Buscar nombre, IP, etiqueta…')}
                          aria-label={t('Buscar registros')}
                        />
                      </label>
                      <label className="filter-select">
                        <Filter size={15} />
                        <select
                          value={kindFilter}
                          onChange={(e) => setKindFilter(e.target.value as Kind | 'todos')}
                          aria-label={t('Filtrar tipo')}
                        >
                          <option value="todos">{t('Todos los tipos')}</option>
                          {inventoryKinds.map((k) => (
                            <option value={k} key={k}>
                              {t(KIND_LABELS[k])}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} />
                      </label>
                      <label className="filter-select">
                        <select
                          value={verificationFilter}
                          onChange={(e) =>
                            setVerificationFilter(e.target.value as Verification | 'todos')
                          }
                          aria-label={t('Filtrar verificación')}
                        >
                          <option value="todos">{t('Toda verificación')}</option>
                          <option value="verificado">{t('Verificado')}</option>
                          <option value="pendiente">{t('Pendiente')}</option>
                          <option value="por_confirmar">{t('Por confirmar')}</option>
                        </select>
                        <ChevronDown size={14} />
                      </label>
                      <label className="filter-select">
                        <select
                          value={usageFilter}
                          onChange={(e) =>
                            setUsageFilter(e.target.value as EquipmentState | 'todos')
                          }
                          aria-label={t('Filtrar estado de uso de equipos')}
                        >
                          <option value="todos">{t('Cualquier estado de uso')}</option>
                          {EQUIPMENT_STATES.map((state) => (
                            <option key={state} value={state}>
                              {t(state)}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} />
                      </label>
                    </div>
                    {filteredInventory.length === 0 ? (
                      <Empty
                        icon={Boxes}
                        title={records.length === 0 ? 'Comienza tu inventario' : 'Sin resultados'}
                        description={
                          records.length === 0
                            ? 'Agrega un switch, una dirección IP o cualquier otro elemento para empezar.'
                            : 'Prueba otro término o cambia los filtros.'
                        }
                        action={
                          records.length === 0 ? (
                            <button
                              className="button button-primary"
                              onClick={() => setModal({ mode: 'choose' })}
                            >
                              <Plus size={16} />
                              {t('Crear primer registro')}
                            </button>
                          ) : undefined
                        }
                      />
                    ) : (
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>{t('REGISTRO')}</th>
                              <th>{t('SEDE Y UBICACIÓN')}</th>
                              <th>{t('DETALLES')}</th>
                              <th>{t('USO DEL EQUIPO')}</th>
                              <th>{t('VERIFICACIÓN')}</th>
                              <th>{t('ACTUALIZADO')}</th>
                              <th>
                                <span className="sr-only">{t('Acciones')}</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredInventory.map((r) => {
                              const I = getIcon(r);
                              return (
                                <tr key={r.id}>
                                  <td>
                                    <button
                                      className="record-name"
                                      onClick={() => setSelectedId(r.id)}
                                    >
                                      <span className="record-icon">
                                        <I size={19} />
                                      </span>
                                      <span>
                                        <strong>{r.name}</strong>
                                        <small>{t(kindTitle(r))}</small>
                                      </span>
                                    </button>
                                  </td>
                                  <td>
                                    <strong className="table-main">{r.site}</strong>
                                    <small className="table-sub">
                                      {r.location || t('Ubicación por confirmar')}
                                    </small>
                                  </td>
                                  <td className="detail-cell">{summary(r, records)}</td>
                                  <td>
                                    {r.kind === 'equipo' || r.kind === 'componente_telefono' ? (
                                      <UsageStatus value={equipmentUsage(r)} />
                                    ) : (
                                      '—'
                                    )}
                                  </td>
                                  <td>
                                    <Status value={r.verification} />
                                  </td>
                                  <td className="date-cell">{shortDate(r.updatedAt, dateLocale)}</td>
                                  <td>
                                    <button
                                      className="row-action"
                                      onClick={() => openEdit(r)}
                                      aria-label={`Editar ${r.name}`}
                                    >
                                      <Pencil size={16} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {filteredInventory.length > 0 && (
                      <div className="table-footer">
                        {t('Mostrando')} {filteredInventory.length} {t('de')}{' '}
                        {scoped.filter((r) => inventoryKinds.includes(r.kind)).length} {t('registros')}
                      </div>
                    )}
                  </div>
                </section>
              )}
              {view === 'topologia' && (
                <section>
                  <PageHeader
                    kicker="TOPOLOGÍA"
                    title="Visor de conexiones"
                    description="Visualiza equipos, puertos y enlaces troncales a partir de los registros documentados."
                    action={
                      <button
                        className="button button-primary"
                        onClick={() => openNew(TEMPLATES.find((t) => t.kind === 'troncal')!)}
                      >
                        <GitBranch size={17} />
                        {t('Nuevo enlace')}
                      </button>
                    }
                  />
                  <div className="topology-toolbar">
                    <div className="legend">
                      <span>
                        <i className="line-swatch solid" />
                        {t('Enlace troncal')}
                      </span>
                      <span>
                        <i className="line-swatch dashed" />
                        {t('Puerto de switch')}
                      </span>
                      <span>
                        <i className="legend-dot green" />
                        {t('Verificado')}
                      </span>
                    </div>
                    <div className="zoom-actions">
                      <button
                        onClick={() =>
                          setZoom((z) => Math.max(0.7, Math.round((z - 0.15) * 100) / 100))
                        }
                        aria-label={t('Alejar')}
                      >
                        <ZoomOut size={17} />
                      </button>
                      <span>{Math.round(zoom * 100)}%</span>
                      <button
                        onClick={() =>
                          setZoom((z) => Math.min(1.6, Math.round((z + 0.15) * 100) / 100))
                        }
                        aria-label={t('Acercar')}
                      >
                        <ZoomIn size={17} />
                      </button>
                    </div>
                  </div>
                  {(site === 'Todas las sedes' ? SITES : [site]).map((s) => (
                    <TopologyDiagram
                      key={s}
                      site={s}
                      records={records}
                      zoom={zoom}
                      onSelect={setSelectedId}
                      onCreate={() => openNew(TEMPLATES[0])}
                    />
                  ))}
                  {crossSiteLinks.length > 0 && (
                    <div className="card cross-links">
                      <h3>{t('Enlaces entre sedes')}</h3>
                      {crossSiteLinks.map((r) => (
                        <button key={r.id} onClick={() => setSelectedId(r.id)}>
                          <GitBranch size={17} />
                          <span>{summary(r, records)}</span>
                          <Status value={r.verification} />
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}
              {view === 'pendientes' && (
                <section>
                  <PageHeader
                    kicker="SEGUIMIENTO"
                    title="Pendientes e inconsistencias"
                    description="Registra hallazgos, conserva evidencia de pruebas y detecta duplicados."
                    action={
                      <button
                        className="button button-primary"
                        onClick={() => openNew(TEMPLATES.find((t) => t.kind === 'pendiente')!)}
                      >
                        <Plus size={17} />
                        {t('Nuevo pendiente')}
                      </button>
                    }
                  />
                  <div className="segmented">
                    <button
                      className={workTab === 'pendientes' ? 'selected' : ''}
                      onClick={() => setWorkTab('pendientes')}
                    >
                      {t('Pendientes')}{' '}
                      <span>
                        {scoped.filter((r) => r.kind === 'pendiente').length +
                          automaticIssues.length}
                      </span>
                    </button>
                    <button
                      className={workTab === 'pruebas' ? 'selected' : ''}
                      onClick={() => setWorkTab('pruebas')}
                    >
                      {t('Pruebas realizadas')} <span>{tests.length}</span>
                    </button>
                  </div>
                  {workTab === 'pendientes' ? (
                    <>
                      {automaticIssues.length > 0 && (
                        <div className="auto-issues">
                          <div className="auto-heading">
                            <Zap size={17} />
                            <strong>{t('Inconsistencias detectadas automáticamente')}</strong>
                            <span>{automaticIssues.length}</span>
                          </div>
                          {automaticIssues.map((item, i) => (
                            <div key={i} className="auto-issue">
                              <AlertCircle size={18} />
                              <div>
                                <strong>{t(item.title)}</strong>
                                <p>{item.description}</p>
                              </div>
                              <span className="location-tag">{item.site}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {scoped.filter((r) => r.kind === 'pendiente').length === 0 ? (
                        <Empty
                          icon={AlertCircle}
                          title="No hay pendientes registrados"
                          description="Agrega hallazgos, tareas por confirmar o inconsistencias detectadas en campo."
                          action={
                            <button
                              className="button button-primary"
                              onClick={() =>
                                openNew(TEMPLATES.find((t) => t.kind === 'pendiente')!)
                              }
                            >
                              <Plus size={16} />
                              {t('Registrar pendiente')}
                            </button>
                          }
                        />
                      ) : (
                        <div className="issues-grid">
                          {scoped
                            .filter((r) => r.kind === 'pendiente')
                            .map((r) => (
                              <button
                                className="issue-card card"
                                key={r.id}
                                onClick={() => setSelectedId(r.id)}
                              >
                                <div className="issue-top">
                                  <span
                                    className={`priority priority-${(r.payload.prioridad || 'Media').toLowerCase()}`}
                                  >
                                    {t(r.payload.prioridad || 'Media')}
                                  </span>
                                  <Status value={r.verification} />
                                </div>
                                <h3>{r.name}</h3>
                                <p>{r.payload.detalle || t('Sin descripción')}</p>
                                <div className="issue-meta">
                                  <span>
                                    <MapPin size={14} />
                                    {r.site}
                                  </span>
                                  <span>
                                    <Clock3 size={14} />
                                    {r.payload.fechaLimite
                                      ? date(r.payload.fechaLimite, dateLocale)
                                      : t('Sin fecha límite')}
                                  </span>
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="subview-actions">
                        <p>{t('Conserva el resultado y la evidencia de cada validación.')}</p>
                        <button
                          className="button button-secondary"
                          onClick={() => openNew(TEMPLATES.find((t) => t.kind === 'prueba')!)}
                        >
                          <Plus size={16} />
                          {t('Registrar prueba')}
                        </button>
                      </div>
                      {tests.length === 0 ? (
                        <Empty
                          icon={FlaskConical}
                          title="Aún no hay pruebas"
                          description="Registra conectividad, PoE, VLANs u otras validaciones realizadas."
                        />
                      ) : (
                        <div className="test-list">
                          {tests.map((r) => (
                            <button
                              className="test-row card"
                              key={r.id}
                              onClick={() => setSelectedId(r.id)}
                            >
                              <span
                                className={`test-icon ${r.payload.resultado === 'Aprobada' ? 'pass' : r.payload.resultado === 'Fallida' ? 'fail' : ''}`}
                              >
                                <FlaskConical size={20} />
                              </span>
                              <span className="test-main">
                                <strong>{r.name}</strong>
                                <small>
                                  {t(r.payload.tipo || 'Prueba')} · {r.site}
                                </small>
                              </span>
                              <span className="test-result">
                                {t(r.payload.resultado || 'Por confirmar')}
                              </span>
                              <time>{date(r.payload.fecha, dateLocale)}</time>
                              <ArrowRight size={17} />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </section>
              )}
              {view === 'reportes' && (
                <section>
                  <PageHeader
                    kicker="REPORTES"
                    title="Avance semana a semana"
                    description="Documenta lo realizado, los equipos inventariados, las pruebas y los próximos pasos."
                    action={
                      <button
                        className="button button-primary"
                        onClick={() => openNew(TEMPLATES.find((t) => t.kind === 'reporte')!)}
                      >
                        <Plus size={17} />
                        {t('Nuevo reporte')}
                      </button>
                    }
                  />
                  <div className="report-intro">
                    <FileText size={25} />
                    <div>
                      <strong>{t('Una bitácora útil para tomar decisiones')}</strong>
                      <span>
                        {t('Cada creación y edición de reporte aparece en el historial de cambios.')}
                      </span>
                    </div>
                  </div>
                  {scoped.filter((r) => r.kind === 'reporte').length === 0 ? (
                    <Empty
                      icon={FileText}
                      title="Aún no hay reportes semanales"
                      description="Crea el primero con avances, equipos inventariados, pruebas y siguientes pasos."
                      action={
                        <button
                          className="button button-primary"
                          onClick={() => openNew(TEMPLATES.find((t) => t.kind === 'reporte')!)}
                        >
                          <Plus size={16} />
                          {t('Crear reporte')}
                        </button>
                      }
                    />
                  ) : (
                    <div className="reports-grid">
                      {scoped
                        .filter((r) => r.kind === 'reporte')
                        .map((r) => (
                          <article className="report-card card" key={r.id}>
                            <div className="report-card-top">
                              <span className="report-icon">
                                <FileText size={21} />
                              </span>
                              <Status value={r.verification} />
                            </div>
                            <span className="section-kicker">
                              {r.site.toUpperCase()} · {t('SEMANA DEL')}{' '}
                              {shortDate(r.payload.semana, dateLocale).toUpperCase()}
                            </span>
                            <h3>{r.name}</h3>
                            <p>{r.payload.avances || t('Sin avances descritos.')}</p>
                            <div className="report-metrics">
                              <span>
                                <Boxes size={15} />
                                {t('Equipos')}
                              </span>
                              <span>
                                <FlaskConical size={15} />
                                {t('Pruebas')}
                              </span>
                              <span>
                                <ArrowRight size={15} />
                                {t('Próximos pasos')}
                              </span>
                            </div>
                            <div className="report-actions">
                              <button onClick={() => setSelectedId(r.id)}>{t('Ver detalle')}</button>
                              <button onClick={() => downloadReport(r)}>
                                <ArrowDownToLine size={15} />
                                {t('Descargar')}
                              </button>
                            </div>
                          </article>
                        ))}
                    </div>
                  )}
                </section>
              )}
              {view === 'historial' && (
                <section>
                  <PageHeader
                    kicker="BITÁCORA"
                    title="Historial de cambios"
                    description="Consulta quién creó, actualizó o eliminó cada registro y cuándo ocurrió."
                  />
                  {visibleChanges.length === 0 ? (
                    <Empty
                      icon={Activity}
                      title="El historial está vacío"
                      description="Cada registro que crees o edites dejará una entrada aquí."
                    />
                  ) : (
                    <div className="history-card card">
                      <div className="history-head">
                        <strong>{visibleChanges.length} {t('cambios recientes')}</strong>
                        <span>{t('Se muestran los 500 más recientes del proyecto')}</span>
                      </div>
                      {visibleChanges.map((c) => (
                        <div className="history-item" key={c.id}>
                          <span className={`history-icon history-${c.action}`}>
                            {c.action === 'creado' ? (
                              <Plus size={17} />
                            ) : c.action === 'eliminado' ? (
                              <Trash2 size={16} />
                            ) : (
                              <Pencil size={16} />
                            )}
                          </span>
                          <div className="history-content">
                            <strong>
                              {c.name} <span>{t(c.action)}</span>
                            </strong>
                            <p>{c.description}</p>
                            <small>
                              {t(KIND_LABELS[c.kind])} · {c.site} · {c.actor}
                            </small>
                          </div>
                          <time>{date(c.occurredAt, dateLocale)}</time>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
              {view === 'plantillas' && (
                <section>
                  <PageHeader
                    kicker="PLANTILLAS"
                    title="Documenta de forma consistente"
                    description="Empieza con una ficha adaptada a cada equipo o componente de la red."
                  />
                  <div className="template-heading">
                    <h3>{t('Equipos')}</h3>
                    <span>{TEMPLATES.filter((item) => item.kind === 'equipo').length} {t('plantillas')}</span>
                  </div>
                  <div className="template-grid">
                    {TEMPLATES.filter((t) => t.kind === 'equipo').map((t) => (
                      <TemplateCard key={t.id} template={t} onClick={() => openNew(t)} />
                    ))}
                  </div>
                  <div className="template-heading">
                    <h3>{t('Infraestructura y seguimiento')}</h3>
                    <span>{TEMPLATES.filter((item) => item.kind !== 'equipo').length} {t('plantillas')}</span>
                  </div>
                  <div className="template-grid">
                    {TEMPLATES.filter((t) => t.kind !== 'equipo').map((t) => (
                      <TemplateCard key={t.id} template={t} onClick={() => openNew(t)} />
                    ))}
                  </div>
                </section>
              )}
              {view === 'boveda' && (
                <VaultPanel
                  records={records}
                  site={site}
                  preferredRecordId={preferredVaultRecordId}
                />
              )}
            </>
          )}
        </main>
      </div>
      {selected && (
        <DetailPanel
          record={selected}
          all={records}
          onClose={() => setSelectedId(null)}
          onEdit={() => openEdit(selected)}
          onDelete={() => void remove(selected)}
          onVault={() => {
            setPreferredVaultRecordId(selected.id);
            setSelectedId(null);
            navigate('boveda');
          }}
        />
      )}
      {modal?.mode === 'choose' && (
        <div
          className="modal-scrim"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div
            className="chooser modal"
            role="dialog"
            aria-modal="true"
            aria-label={t('Seleccionar plantilla')}
          >
            <div className="modal-head">
              <div>
                <span className="section-kicker">{t('NUEVO REGISTRO')}</span>
                <h2>{t('¿Qué quieres documentar?')}</h2>
              </div>
              <button className="icon-button" onClick={() => setModal(null)} aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>
            <div className="chooser-scroll">
              <div className="chooser-label">{t('EQUIPOS')}</div>
              <div className="chooser-grid">
                {TEMPLATES.filter((t) => t.kind === 'equipo').map((t) => (
                  <TemplateCard key={t.id} template={t} onClick={() => openNew(t)} />
                ))}
              </div>
              <div className="chooser-label">{t('INFRAESTRUCTURA Y SEGUIMIENTO')}</div>
              <div className="chooser-grid">
                {TEMPLATES.filter((t) => t.kind !== 'equipo').map((t) => (
                  <TemplateCard key={t.id} template={t} onClick={() => openNew(t)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {modal?.mode === 'form' && (
        <RecordForm
          key={modal.record?.id ?? modal.template.id}
          template={modal.template}
          record={modal.record}
          all={records}
          initialSite={site === 'Todas las sedes' ? 'Colima' : site}
          busy={busy}
          onCancel={() => setModal(null)}
          onSave={async (value) => {
            await mutate(
              {
                action: modal.record ? 'update' : 'create',
                id: modal.record?.id,
                baseUpdatedAt: modal.record?.updatedAt,
                record: value,
              },
              modal.record ? 'Registro actualizado' : 'Registro creado',
            );
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {t(toast)}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
}) {
  const { t } = useI18n();
  return (
    <div className="stat-card card">
      <span className={`stat-icon stat-${color}`}>
        <Icon size={22} />
      </span>
      <div>
        <strong>{value}</strong>
        <span>{t(label)}</span>
      </div>
      <ArrowRight className="stat-arrow" size={16} />
    </div>
  );
}
function PageHeader({
  kicker,
  title,
  description,
  action,
}: {
  kicker: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="page-header">
      <div>
        <span className="section-kicker">{t(kicker)}</span>
        <h1>{t(title)}</h1>
        <p>{t(description)}</p>
      </div>
      {action}
    </div>
  );
}
function TemplateCard({ template, onClick }: { template: Template; onClick: () => void }) {
  const { t } = useI18n();
  const Icon = iconMap[template.icon] ?? Boxes;
  return (
    <button className="template-card card" onClick={onClick}>
      <span className="template-icon">
        <Icon size={23} />
      </span>
      <strong>{t(template.title)}</strong>
      <p>{t(template.description)}</p>
      <span className="template-action">
        {t('Usar plantilla')} <ArrowRight size={15} />
      </span>
    </button>
  );
}

function TopologyDiagram({
  site,
  records,
  zoom,
  onSelect,
  onCreate,
}: {
  site: Site;
  records: RecordItem[];
  zoom: number;
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  const { t } = useI18n();
  const equipment = records.filter((r) => r.site === site && r.kind === 'equipo');
  const panels = records.filter((r) => r.site === site && r.kind === 'panel');
  const nodes = [...equipment, ...panels];
  const columns = [
    nodes.filter(
      (r) => r.kind === 'equipo' && ['switch', 'router', 'firewall'].includes(r.payload.tipo),
    ),
    nodes.filter(
      (r) =>
        (r.kind === 'equipo' && ['servidor', 'nas'].includes(r.payload.tipo)) || r.kind === 'panel',
    ),
    nodes.filter(
      (r) =>
        r.kind === 'equipo' &&
        !['switch', 'router', 'firewall', 'servidor', 'nas'].includes(r.payload.tipo),
    ),
  ];
  const positions = new Map<string, { x: number; y: number }>();
  columns.forEach((group, col) =>
    group.forEach((r, row) => positions.set(r.id, { x: 42 + col * 300, y: 104 + row * 104 })),
  );
  const height = Math.max(370, Math.max(...columns.map((c) => c.length), 1) * 104 + 154);
  const width = 900;
  const links: {
    id: string;
    from: string;
    to: string;
    type: 'troncal' | 'puerto' | 'nodo';
    name: string;
  }[] = [];
  const linkName = (record: RecordItem) => {
    const cable = records.find((item) => item.id === record.payload.cable);
    return cable ? `${record.name} · Cable ${cable.payload.codigo || cable.name}` : record.name;
  };
  for (const r of records.filter((r) => r.site === site)) {
    if (r.kind === 'troncal' && positions.has(r.payload.origen) && positions.has(r.payload.destino))
      links.push({
        id: r.id,
        from: r.payload.origen,
        to: r.payload.destino,
        type: 'troncal',
        name: linkName(r),
      });
    if (r.kind === 'puerto' && positions.has(r.payload.switch) && positions.has(r.payload.destino))
      links.push({
        id: r.id,
        from: r.payload.switch,
        to: r.payload.destino,
        type: 'puerto',
        name: linkName(r),
      });
    if (r.kind === 'nodo' && positions.has(r.payload.panel) && positions.has(r.payload.destino))
      links.push({
        id: r.id,
        from: r.payload.panel,
        to: r.payload.destino,
        type: 'nodo',
        name: r.name,
      });
  }
  return (
    <div className="topology-card card">
      <div className="topology-card-head">
        <div>
          <span className="site-dot" />
          <h3>{site}</h3>
          <span>
            {equipment.length} {t('equipos')} · {links.length} {t('conexiones')}
          </span>
        </div>
        <span className="topology-card-tag">{t('DIAGRAMA')}</span>
      </div>
      {nodes.length === 0 ? (
        <div className="topology-empty">
          <div className="placeholder-diagram" aria-hidden="true">
            <span>
              <Network size={22} />
            </span>
            <i />
            <span>
              <Server size={20} />
            </span>
            <i />
            <span>
              <Wifi size={20} />
            </span>
          </div>
          <h4>{t('Sin equipos documentados en')} {site}</h4>
          <p>{t('Agrega equipos y sus conexiones para construir el diagrama automáticamente.')}</p>
          <button className="button button-secondary" onClick={onCreate}>
            <Plus size={16} />
            Agregar switch
          </button>
        </div>
      ) : (
        <div className="topology-viewport">
          <div style={{ width: width * zoom, height: height * zoom }}>
            <svg
              className="topology-svg"
              width={width}
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
              role="img"
              aria-label={`Diagrama de red de ${site}`}
            >
              <defs>
                <pattern id={`grid-${site}`} width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="#e2e9ef" />
                </pattern>
                <marker
                  id={`arrow-${site}`}
                  markerWidth="7"
                  markerHeight="7"
                  refX="5"
                  refY="3.5"
                  orient="auto"
                >
                  <path d="M0 0L6 3.5L0 7" fill="none" stroke="#6a98b5" strokeWidth="1.2" />
                </marker>
              </defs>
              <rect x="0" y="0" width={width} height={height} fill={`url(#grid-${site})`} />
              {links.map((link) => {
                const a = positions.get(link.from)!;
                const b = positions.get(link.to)!;
                const forward = b.x >= a.x;
                const x1 = forward ? a.x + 208 : a.x,
                  y1 = a.y + 34,
                  x2 = forward ? b.x : b.x + 208,
                  y2 = b.y + 34;
                const delta = x2 - x1;
                const arch = Math.abs(delta) > 320 && Math.abs(y2 - y1) < 70;
                const path = arch
                  ? `M ${x1} ${y1} C ${x1 + delta * 0.2} ${Math.min(y1, y2) - 120}, ${x2 - delta * 0.2} ${Math.min(y1, y2) - 120}, ${x2} ${y2}`
                  : `M ${x1} ${y1} C ${x1 + delta * 0.45} ${y1}, ${x2 - delta * 0.45} ${y2}, ${x2} ${y2}`;
                return (
                  <g
                    key={link.id}
                    className="topology-link"
                    onClick={() => onSelect(link.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSelect(link.id);
                    }}
                  >
                    <title>{link.name}</title>
                    <path
                      d={path}
                      fill="none"
                      stroke={link.type === 'troncal' ? '#327ba2' : '#8bb0c4'}
                      strokeWidth={link.type === 'troncal' ? 2.5 : 1.8}
                      strokeDasharray={link.type === 'troncal' ? undefined : '6 5'}
                      markerEnd={`url(#arrow-${site})`}
                    />
                    <path d={path} fill="none" stroke="transparent" strokeWidth="18" />
                  </g>
                );
              })}
              {nodes.map((r) => {
                const pos = positions.get(r.id)!;
                return (
                  <g
                    key={r.id}
                    className="topology-node"
                    onClick={() => onSelect(r.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSelect(r.id);
                    }}
                  >
                    <title>
                      {r.name} · {kindTitle(r)} · {VERIFICATION_LABELS[r.verification]}
                      {r.kind === 'equipo' ? ` · ${equipmentUsage(r)}` : ''}
                    </title>
                    <rect
                      x={pos.x}
                      y={pos.y}
                      width="208"
                      height="68"
                      rx="14"
                      fill={
                        r.kind === 'equipo' && equipmentUsage(r) === 'No utilizado'
                          ? '#f3f6f7'
                          : '#fff'
                      }
                      stroke={
                        r.kind === 'equipo' && equipmentUsage(r) === 'Inactivo'
                          ? '#e6c498'
                          : r.verification === 'verificado'
                            ? '#a9d6c8'
                            : '#dbe4e9'
                      }
                      strokeWidth="1.5"
                    />
                    <rect
                      x={pos.x + 11}
                      y={pos.y + 11}
                      width="46"
                      height="46"
                      rx="11"
                      fill="#e8f2f5"
                    />
                    <text
                      x={pos.x + 34}
                      y={pos.y + 40}
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="700"
                      fill="#245871"
                    >
                      {r.kind === 'panel' ? 'PP' : (equipmentCode[r.payload.tipo] ?? 'EQ')}
                    </text>
                    <text
                      x={pos.x + 69}
                      y={pos.y + 28}
                      fontSize="12"
                      fontWeight="700"
                      fill="#20343e"
                    >
                      {r.name.length > 18 ? `${r.name.slice(0, 17)}…` : r.name}
                    </text>
                    <text x={pos.x + 69} y={pos.y + 47} fontSize="10.5" fill="#758996">
                      {kindTitle(r)}
                    </text>
                    <circle
                      cx={pos.x + 192}
                      cy={pos.y + 15}
                      r="5"
                      fill={
                        r.verification === 'verificado'
                          ? '#35ac82'
                          : r.verification === 'pendiente'
                            ? '#e8a24e'
                            : '#aebbc4'
                      }
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}
      {(panels.length > 0 ||
        records.some((r) => r.site === site && (r.kind === 'rack' || r.kind === 'cable' || r.kind === 'componente_telefono'))) && (
        <div className="physical-strip">
          <strong>{t('Infraestructura física y cableado')}</strong>
          <div>
            {records
              .filter(
                (r) =>
                  r.site === site &&
                  (r.kind === 'rack' || r.kind === 'panel' || r.kind === 'cable' || r.kind === 'componente_telefono'),
              )
              .map((r) => (
                <button key={r.id} onClick={() => onSelect(r.id)}>
                  {r.kind === 'rack' ? (
                    <PanelTop size={15} />
                  ) : r.kind === 'cable' ? (
                    <Cable size={15} />
                  ) : r.kind === 'componente_telefono' ? (
                    <Headphones size={15} />
                  ) : (
                    <Grid2X2 size={15} />
                  )}{' '}
                  {r.name}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailPanel({
  record,
  all,
  onClose,
  onEdit,
  onDelete,
  onVault,
}: {
  record: RecordItem;
  all: RecordItem[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onVault: () => void;
}) {
  const { t, dateLocale } = useI18n();
  const template = templateFor(record);
  const Icon = getIcon(record);
  const resolve = (id: string) =>
    all.find((r) => r.id === id)?.name ?? t('Referencia no encontrada');
  return (
    <div
      className="drawer-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        className="detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t('Detalle de') + ' ' + record.name}
      >
        <div className="drawer-head">
          <span>{t('DETALLE DEL REGISTRO')}</span>
          <button className="icon-button" onClick={onClose} aria-label={t('Cerrar')}>
            <X size={20} />
          </button>
        </div>
        <div className="drawer-content">
          <span className="drawer-icon">
            <Icon size={27} />
          </span>
          <h2>{record.name}</h2>
          <p>
            {t(kindTitle(record))} · {record.site}
          </p>
          <div className="drawer-statuses">
            <Status value={record.verification} />
            {(record.kind === 'equipo' || record.kind === 'componente_telefono') && (
              <UsageStatus value={equipmentUsage(record)} />
            )}
          </div>
          <div className="drawer-section">
            <h3>{t('Información general')}</h3>
            <dl>
              <div>
                <dt>{t('Sede')}</dt>
                <dd>{record.site}</dd>
              </div>
              <div>
                <dt>{t('Ubicación')}</dt>
                <dd>{record.location || t('Por confirmar')}</dd>
              </div>
              <div>
                <dt>{t('Creado')}</dt>
                <dd>{date(record.createdAt, dateLocale)}</dd>
              </div>
              <div>
                <dt>{t('Actualizado')}</dt>
                <dd>{date(record.updatedAt, dateLocale)}</dd>
              </div>
            </dl>
          </div>
          <div className="drawer-section">
            <h3>{t('Datos documentados')}</h3>
            <dl>
              {template.fields.map((f) => (
                <div key={f.key}>
                  <dt>{t(f.label)}</dt>
                  <dd className={f.type === 'textarea' ? 'multiline' : ''}>
                    {record.payload[f.key]
                      ? f.type === 'record'
                        ? resolve(record.payload[f.key])
                        : f.type === 'select'
                          ? t(record.payload[f.key])
                          : record.payload[f.key]
                      : t('Por confirmar')}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          {record.kind === 'equipo' && record.payload.tipo === 'telefono_ip' && (
            <div className="drawer-section">
              <h3>{t('Componentes conectados')}</h3>
              <div className="phone-components">
                {all.filter((item) => item.kind === 'componente_telefono' && item.payload.telefono === record.id).length ? (
                  all
                    .filter((item) => item.kind === 'componente_telefono' && item.payload.telefono === record.id)
                    .map((item) => (
                      <div className="phone-component" key={item.id}>
                        <Headphones size={17} />
                        <span><strong>{item.name}</strong><small>{t(item.payload.tipo || 'Componente de teléfono IP')} · {t(equipmentUsage(item))}</small></span>
                      </div>
                    ))
                ) : <p className="phone-components-empty">{t('Todavía no hay componentes vinculados a este teléfono.')}</p>}
              </div>
            </div>
          )}
        </div>
        <div className="drawer-footer">
          {record.kind === 'equipo' && record.payload.tipo === 'telefono_ip' && (
            <button className="button button-secondary" onClick={onVault}>
              <LockKeyhole size={16} />
              {t('Abrir credenciales del teléfono')}
            </button>
          )}
          <button className="button button-primary" onClick={onEdit}>
            <Pencil size={16} />
            {t('Editar registro')}
          </button>
          <button className="button button-danger" onClick={onDelete}>
            <Trash2 size={16} />
            {t('Eliminar')}
          </button>
        </div>
      </aside>
    </div>
  );
}

function RecordForm({
  template,
  record,
  all,
  initialSite,
  busy,
  onCancel,
  onSave,
}: {
  template: Template;
  record?: RecordItem;
  all: RecordItem[];
  initialSite: Site;
  busy: boolean;
  onCancel: () => void;
  onSave: (value: Omit<RecordItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(record?.name ?? '');
  const [site, setSite] = useState<Site>(record?.site ?? initialSite);
  const [location, setLocation] = useState(record?.location ?? '');
  const [verification, setVerification] = useState<Verification>(
    record?.verification ?? 'por_confirmar',
  );
  const [payload, setPayload] = useState<Record<string, string>>(() => {
    const initial =
      record?.payload ??
      (template.kind === 'equipo'
        ? { tipo: template.id }
        : template.kind === 'reporte'
          ? { semana: weekStart() }
          : template.kind === 'pendiente'
            ? { tipo: 'Pendiente', prioridad: 'Media' }
            : {});
    return template.kind === 'equipo' || template.kind === 'componente_telefono'
      ? { estadoUso: 'Por confirmar', ...initial }
      : initial;
  });
  const setField = (key: string, value: string) => setPayload((p) => ({ ...p, [key]: value }));
  function fillWeeklyDraft() {
    const start = payload.semana || weekStart();
    const end = new Date(`${start}T00:00:00`);
    end.setDate(end.getDate() + 7);
    const inWeek = (r: RecordItem) =>
      r.site === site && r.createdAt >= `${start}T00:00:00` && new Date(r.createdAt) < end;
    const equipment = all.filter((r) => (r.kind === 'equipo' || r.kind === 'componente_telefono') && inWeek(r));
    const cables = all.filter((r) => r.kind === 'cable' && inWeek(r));
    const tests = all.filter((r) => r.kind === 'prueba' && inWeek(r));
    setPayload((p) => ({
      ...p,
      avances: `Se ${equipment.length === 1 ? 'documentó' : 'documentaron'} ${equipment.length} ${equipment.length === 1 ? 'equipo' : 'equipos'} y se ${tests.length === 1 ? 'registró' : 'registraron'} ${tests.length} ${tests.length === 1 ? 'prueba' : 'pruebas'} durante la semana.${cables.length ? ` Se documentaron ${cables.length} etiquetas de cable.` : ''}`,
      equipos: equipment.length
        ? equipment.map((r) => `• ${r.name} (${kindTitle(r)}; ${equipmentUsage(r)})`).join('\n')
        : 'No se registraron equipos nuevos.',
      pruebas: tests.length
        ? tests.map((r) => `• ${r.name}: ${r.payload.resultado || 'por confirmar'}`).join('\n')
        : 'No se registraron pruebas nuevas.',
    }));
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    await onSave({ kind: template.kind, name, site, location, verification, payload });
  }
  return (
    <div
      className="modal-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="form-modal modal"
        role="dialog"
        aria-modal="true"
        aria-label={record ? `${t('Editar registro')}: ${record.name}` : `${t('Crear registro')}: ${t(template.title)}`}
      >
        <form onSubmit={(e) => void submit(e)}>
          <div className="modal-head">
            <div>
              <span className="section-kicker">
                {t(record ? 'EDITAR REGISTRO' : 'NUEVO REGISTRO')} · {t(template.title).toUpperCase()}
              </span>
              <h2>{record ? t('Actualizar información') : `${t('Documentar')} ${t(template.title)}`}</h2>
              <p>{t(template.description)}</p>
            </div>
            <button type="button" className="icon-button" onClick={onCancel} aria-label={t('Cerrar')}>
              <X size={20} />
            </button>
          </div>
          <div className="form-scroll">
            <div className="form-tip">
              <ShieldCheck size={17} />
              <span>
                {t('Registra datos técnicos y de ubicación. Guarda usuarios y contraseñas solo en la bóveda cifrada.')}
              </span>
            </div>
            <div className="form-section-title">{t('Identificación')}</div>
            <div className="form-grid">
              <label className="field span-2">
                <span>
                  {t('Nombre o identificador')} <em>*</em>
                </span>
                <input
                  autoFocus
                  required
                  minLength={2}
                  maxLength={160}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    template.kind === 'equipo'
                      ? `${t('Ej.')} ${t(template.title)} COL-01`
                      : template.kind === 'cable'
                        ? `${t('Ej.')} CBL-COL-001`
                        : template.kind === 'reporte'
                          ? t('Ej. Avance semanal de red')
                          : t('Ej. Identificador del registro')
                  }
                />
              </label>
              <label className="field">
                <span>
                  {t('Sede')} <em>*</em>
                </span>
                <select value={site} onChange={(e) => setSite(e.target.value as Site)}>
                  {SITES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{t('Ubicación específica')}</span>
                <input
                  maxLength={160}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('Edificio, piso, sala…')}
                />
              </label>
              <label className="field span-2">
                <span>
                  {t('Estado de verificación')} <em>*</em>
                </span>
                <select
                  value={verification}
                  onChange={(e) => setVerification(e.target.value as Verification)}
                >
                  <option value="por_confirmar">{t('Por confirmar')}</option>
                  <option value="pendiente">{t('Pendiente')}</option>
                  <option value="verificado">{t('Verificado')}</option>
                </select>
              </label>
            </div>
            <div className="form-section-title">
              {t(template.kind === 'reporte' ? 'Contenido del reporte' : 'Datos técnicos')}
            </div>
            {template.kind === 'reporte' && (
              <button type="button" className="draft-button" onClick={fillWeeklyDraft}>
                <Zap size={16} />
                {t('Rellenar borrador con registros de esta semana')}
              </button>
            )}
            <div className="form-grid">
              {template.fields.map((field) => {
                const value = payload[field.key] ?? '';
                const options =
                  field.type === 'record'
                    ? all
                        .filter(
                          (r) =>
                            r.kind === field.recordKind &&
                            (field.key === 'switch'
                              ? r.payload.tipo === 'switch'
                              : field.key === 'telefono'
                                ? r.payload.tipo === 'telefono_ip'
                                : field.key === 'computadora'
                                  ? r.payload.tipo === 'computadora' || r.payload.tipo === 'laptop'
                                  : true),
                        )
                        .filter(
                          (r) =>
                            field.key === 'origen' || field.key === 'destino' || r.site === site,
                        )
                    : [];
                return (
                  <label
                    className={`field ${field.type === 'textarea' ? 'span-2' : ''}`}
                    key={field.key}
                  >
                    <span>
                      {t(field.label)} {field.required && <em>*</em>}
                    </span>
                    {field.type === 'textarea' ? (
                      <textarea
                        required={field.required}
                        maxLength={4000}
                        rows={4}
                        value={value}
                        onChange={(e) => setField(field.key, e.target.value)}
                        placeholder={t(field.placeholder || 'Escribe aquí…')}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        required={field.required}
                        value={value}
                        onChange={(e) => setField(field.key, e.target.value)}
                      >
                        <option value="">{t('Seleccionar…')}</option>
                        {field.options?.map((o) => (
                          <option key={o} value={o}>{t(o)}</option>
                        ))}
                      </select>
                    ) : field.type === 'record' ? (
                      <select
                        required={field.required}
                        value={value}
                        onChange={(e) => setField(field.key, e.target.value)}
                      >
                        <option value="">{t('Seleccionar registro…')}</option>
                        {options.map((r) => (
                          <option value={r.id} key={r.id}>
                            {r.name} · {r.site}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        required={field.required}
                        type={
                          field.type === 'number'
                            ? 'number'
                            : field.type === 'date'
                              ? 'date'
                              : 'text'
                        }
                        min={field.type === 'number' ? '0' : undefined}
                        maxLength={4000}
                        value={value}
                        onChange={(e) => setField(field.key, e.target.value)}
                        placeholder={field.placeholder || ''}
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="form-footer">
            <button type="button" className="button button-secondary" onClick={onCancel}>
              {t('Cancelar')}
            </button>
            <button className="button button-primary" type="submit" disabled={busy}>
              {busy ? <span className="spinner small" /> : <Check size={16} />}{' '}
              {t(busy ? 'Guardando…' : record ? 'Guardar cambios' : 'Crear registro')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
