'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ArrowDownToLine,
  Check,
  Clock3,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import { useI18n } from './i18n';
import { SITES, type RecordItem, type Site } from '@/lib/models';
import {
  createVault,
  decryptVault,
  encryptVaultDocument,
  makeVaultBackup,
  parseVaultBackup,
  vaultEvent,
  type StoredVault,
  type VaultDocument,
  type VaultEntry,
} from '@/lib/vault';

type Draft = Omit<VaultEntry, 'id' | 'updatedAt'>;
const categories = [
  'Administración web',
  'Administración de central',
  'Troncal SIP',
  'Cuenta SIP',
  'Aprovisionamiento',
  'Acceso SSH',
  'Otro acceso',
];
function blankDraft(site: Site, linkedRecordId = ''): Draft {
  return {
    title: '',
    site,
    linkedRecordId,
    category: categories[0],
    username: '',
    password: '',
    address: '',
    notes: '',
  };
}
function message(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}
export default function VaultPanel({
  records,
  site,
  preferredRecordId,
}: {
  records: RecordItem[];
  site: Site | 'Todas las sedes';
  preferredRecordId: string;
}) {
  const { t, dateLocale } = useI18n();
  const [stored, setStored] = useState<StoredVault | null>(null);
  const [document, setDocument] = useState<VaultDocument | null>(null);
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [backupPhrase, setBackupPhrase] = useState('');
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() =>
    blankDraft(site === 'Todas las sedes' ? 'Colima' : site, preferredRecordId),
  );
  const [showPassword, setShowPassword] = useState(false);
  const [lastActivity, setLastActivity] = useState(0);

  const load = useCallback(async () => {
    const response = await fetch('/api/vault', { cache: 'no-store' });
    const result = (await response.json()) as { vault?: StoredVault | null; error?: string };
    if (!response.ok) throw new Error(result.error ?? 'No se pudo cargar la bóveda.');
    setStored(result.vault ?? null);
  }, []);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      void load()
        .catch((cause) => {
          if (active) setError(message(cause, 'No se pudo cargar la bóveda.'));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    });
    return () => {
      active = false;
    };
  }, [load]);
  useEffect(() => {
    if (!key) return;
    const timer = setTimeout(
      () => {
        setKey(null);
        setDocument(null);
        setDraft(blankDraft('Colima'));
        setFormOpen(false);
        setNotice('La bóveda se bloqueó tras 10 minutos sin actividad.');
      },
      10 * 60 * 1000,
    );
    return () => clearTimeout(timer);
  }, [key, lastActivity]);
  function lock() {
    setKey(null);
    setDocument(null);
    setDraft(blankDraft('Colima'));
    setEditingId(null);
    setFormOpen(false);
    setPassphrase('');
    setBackupPhrase('');
    setShowPassword(false);
    setNotice('Bóveda bloqueada.');
  }
  async function writeVault(
    action: 'initialize' | 'save',
    envelope: StoredVault['envelope'],
    baseRevision?: string,
  ): Promise<StoredVault> {
    const response = await fetch('/api/vault', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, envelope, baseRevision }),
    });
    const result = (await response.json()) as { vault?: StoredVault; error?: string };
    if (!response.ok || !result.vault)
      throw new Error(result.error ?? 'No se pudo guardar la bóveda.');
    return result.vault;
  }
  async function initialize(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (passphrase !== confirmation) {
      setError('Las frases maestras no coinciden.');
      return;
    }
    setBusy(true);
    try {
      const created = await createVault(passphrase);
      const saved = await writeVault('initialize', created.envelope);
      setStored(saved);
      setKey(created.key);
      setDocument(created.document);
      setPassphrase('');
      setConfirmation('');
      setLastActivity(Date.now());
      setNotice('Bóveda creada. Descarga un respaldo cifrado.');
    } catch (cause) {
      setError(message(cause, 'No se pudo crear la bóveda.'));
    } finally {
      setBusy(false);
    }
  }
  async function unlock(event: FormEvent) {
    event.preventDefault();
    if (!stored) return;
    setError('');
    setBusy(true);
    try {
      const opened = await decryptVault(stored.envelope, passphrase);
      setKey(opened.key);
      setDocument(opened.document);
      setPassphrase('');
      setLastActivity(Date.now());
      setNotice('');
    } catch (cause) {
      setError(message(cause, 'No se pudo abrir la bóveda.'));
    } finally {
      setBusy(false);
    }
  }
  async function saveDocument(next: VaultDocument) {
    if (!key || !stored) throw new Error('Desbloquea la bóveda primero.');
    const envelope = await encryptVaultDocument(
      next,
      key,
      stored.envelope.salt,
      stored.envelope.iterations,
    );
    const saved = await writeVault('save', envelope, stored.revision);
    setStored(saved);
    setDocument(next);
    setLastActivity(Date.now());
  }
  function openNew() {
    const linked = records.find((item) => item.id === preferredRecordId);
    const initialSite = linked?.site ?? (site === 'Todas las sedes' ? 'Colima' : site);
    setDraft({
      ...blankDraft(initialSite, linked?.id ?? ''),
      category:
        linked?.payload.tipo === 'central_telefonica' ? 'Administración de central' : categories[0],
    });
    setEditingId(null);
    setShowPassword(false);
    setFormOpen(true);
    setError('');
  }
  function openEdit(entry: VaultEntry) {
    setDraft({
      title: entry.title,
      site: entry.site as Site,
      linkedRecordId: entry.linkedRecordId,
      category: entry.category,
      username: entry.username,
      password: entry.password,
      address: entry.address,
      notes: entry.notes,
    });
    setEditingId(entry.id);
    setShowPassword(false);
    setFormOpen(true);
    setError('');
  }
  async function saveEntry(event: FormEvent) {
    event.preventDefault();
    if (!document) return;
    if (!draft.title.trim() || (!draft.username.trim() && !draft.password)) {
      setError('Escribe un nombre y al menos un usuario o contraseña.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const old = document.entries.find((item) => item.id === editingId);
      const entry: VaultEntry = {
        ...draft,
        title: draft.title.trim(),
        username: draft.username.trim(),
        id: old?.id ?? crypto.randomUUID(),
        updatedAt: new Date().toISOString(),
      };
      const next: VaultDocument = {
        version: 1,
        entries: old
          ? document.entries.map((item) => (item.id === old.id ? entry : item))
          : [entry, ...document.entries],
        events: vaultEvent(old ? 'updated' : 'created', entry.title, document.events),
      };
      await saveDocument(next);
      setDraft(blankDraft('Colima'));
      setFormOpen(false);
      setEditingId(null);
      setNotice('Credencial guardada con cifrado.');
    } catch (cause) {
      setError(message(cause, 'No se pudo guardar la credencial.'));
    } finally {
      setBusy(false);
    }
  }
  async function deleteEntry(entry: VaultEntry) {
    if (!document || !window.confirm(t('¿Eliminar esta credencial de la bóveda?'))) return;
    setBusy(true);
    setError('');
    try {
      const next: VaultDocument = {
        version: 1,
        entries: document.entries.filter((item) => item.id !== entry.id),
        events: vaultEvent('deleted', entry.title, document.events),
      };
      await saveDocument(next);
      setNotice('Credencial eliminada.');
    } catch (cause) {
      setError(message(cause, 'No se pudo eliminar la credencial.'));
    } finally {
      setBusy(false);
    }
  }
  function exportBackup() {
    if (!stored) return;
    const backup = makeVaultBackup(stored.envelope);
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = 'respaldo-boveda-red-' + new Date().toISOString().slice(0, 10) + '.json';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    setNotice('Respaldo cifrado descargado.');
  }
  async function importBackup(event: FormEvent) {
    event.preventDefault();
    if (!backupFile) {
      setError('Selecciona un archivo de respaldo.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      if (backupFile.size > 750_000) throw new Error('El respaldo es demasiado grande.');
      const backup = parseVaultBackup(await backupFile.text());
      const opened = await decryptVault(backup.envelope, backupPhrase);
      if (!stored) {
        const saved = await writeVault('initialize', backup.envelope);
        setStored(saved);
        setKey(opened.key);
        setDocument(opened.document);
        setNotice('Respaldo restaurado y bóveda abierta.');
      } else {
        if (!key || !document) throw new Error('Desbloquea la bóveda actual primero.');
        const merged = new Map(document.entries.map((item) => [item.id, item]));
        for (const item of opened.document.entries) {
          const current = merged.get(item.id);
          if (!current || item.updatedAt > current.updatedAt) merged.set(item.id, item);
        }
        const next: VaultDocument = {
          version: 1,
          entries: [...merged.values()],
          events: vaultEvent('imported', 'Respaldo cifrado', document.events),
        };
        await saveDocument(next);
        setNotice('Respaldo integrado en la bóveda actual.');
      }
      setBackupFile(null);
      setBackupPhrase('');
    } catch (cause) {
      setError(message(cause, 'No se pudo restaurar el respaldo.'));
    } finally {
      setBusy(false);
    }
  }
  const devices = records.filter((item) => item.kind === 'equipo');
  const visibleEntries = (document?.entries ?? []).filter(
    (entry) => site === 'Todas las sedes' || entry.site === site,
  );
  const linkedName = (id: string) => devices.find((item) => item.id === id)?.name ?? '';
  return (
    <section
      className="vault-page"
      onPointerDown={() => key && setLastActivity(Date.now())}
      onKeyDown={() => key && setLastActivity(Date.now())}
    >
      <div className="page-intro vault-intro">
        <div>
          <span className="section-kicker">{t('CREDENCIALES')}</span>
          <h1>{t('Bóveda segura')}</h1>
          <p>
            {t(
              'Guarda accesos de teléfonos IP, centrales telefónicas y otros equipos con cifrado antes de enviarlos al servidor.',
            )}
          </p>
        </div>
        {document && (
          <div className="vault-actions">
            <button type="button" className="button button-secondary" onClick={exportBackup}>
              <ArrowDownToLine size={17} /> {t('Descargar respaldo cifrado')}
            </button>
            <button type="button" className="button button-secondary" onClick={lock}>
              <LockKeyhole size={17} /> {t('Bloquear')}
            </button>
            <button type="button" className="button button-primary" onClick={openNew}>
              <Plus size={17} /> {t('Añadir credencial')}
            </button>
          </div>
        )}
      </div>
      <div className="vault-security card">
        <span className="vault-security-icon">
          <ShieldCheck size={21} />
        </span>
        <div>
          <strong>{t('Solo tú conoces la frase maestra')}</strong>
          <p>
            {t(
              'La frase maestra no se envía ni se guarda. Si la pierdes, no podrás recuperar las credenciales. Conserva una copia cifrada del respaldo.',
            )}
          </p>
        </div>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {t(error)}
        </div>
      )}
      {notice && (
        <div className="vault-notice" role="status">
          <Check size={16} />
          {t(notice)}
        </div>
      )}
      {loading ? (
        <div className="loading">
          <span className="spinner" />
          {t('Cargando bóveda…')}
        </div>
      ) : !document ? (
        <div className="vault-entry-grid">
          <form
            className="card vault-gate"
            onSubmit={(event) => void (stored ? unlock(event) : initialize(event))}
          >
            <span className="vault-gate-icon">
              <KeyRound size={25} />
            </span>
            <span className="section-kicker">
              {stored ? t('BÓVEDA BLOQUEADA') : t('CONFIGURACIÓN INICIAL')}
            </span>
            <h2>{stored ? t('Desbloquear credenciales') : t('Crear tu bóveda cifrada')}</h2>
            <p>
              {stored
                ? t('Escribe tu frase maestra para consultar y editar los accesos.')
                : t(
                    'Elige una frase maestra larga y única. La necesitarás para abrir la bóveda y restaurar respaldos.',
                  )}
            </p>
            <label className="field">
              <span>{t('Frase maestra')}</span>
              <input
                type="password"
                autoComplete="off"
                required
                value={passphrase}
                onChange={(event) => setPassphrase(event.target.value)}
              />
            </label>
            {!stored && (
              <label className="field">
                <span>{t('Confirmar frase maestra')}</span>
                <input
                  type="password"
                  autoComplete="off"
                  required
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
              </label>
            )}
            <button className="button button-primary" type="submit" disabled={busy}>
              <LockKeyhole size={17} /> {stored ? t('Desbloquear') : t('Crear bóveda')}
            </button>
          </form>
          {!stored && (
            <form className="card vault-gate" onSubmit={(event) => void importBackup(event)}>
              <span className="vault-gate-icon">
                <Upload size={25} />
              </span>
              <span className="section-kicker">{t('RECUPERACIÓN')}</span>
              <h2>{t('Restaurar un respaldo')}</h2>
              <p>
                {t(
                  'Selecciona un archivo de respaldo cifrado y escribe la frase maestra con la que fue creado.',
                )}
              </p>
              <label className="field">
                <span>{t('Archivo de respaldo')}</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(event) => setBackupFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <label className="field">
                <span>{t('Frase maestra del respaldo')}</span>
                <input
                  type="password"
                  autoComplete="off"
                  value={backupPhrase}
                  onChange={(event) => setBackupPhrase(event.target.value)}
                />
              </label>
              <button className="button button-secondary" type="submit" disabled={busy}>
                <Upload size={17} /> {t('Restaurar respaldo')}
              </button>
            </form>
          )}
        </div>
      ) : (
        <>
          <div className="vault-metrics">
            <div className="card">
              <span>{t('Credenciales guardadas')}</span>
              <strong>{visibleEntries.length}</strong>
            </div>
            <div className="card">
              <span>{t('Protección')}</span>
              <strong>AES-256-GCM</strong>
            </div>
            <div className="card">
              <span>{t('Última actualización')}</span>
              <strong>
                {stored ? new Date(stored.updatedAt).toLocaleDateString(dateLocale) : '—'}
              </strong>
            </div>
          </div>
          {visibleEntries.length ? (
            <div className="vault-list">
              {visibleEntries.map((entry) => (
                <div className="card vault-item" key={entry.id}>
                  <span className="vault-item-icon">
                    <KeyRound size={21} />
                  </span>
                  <div className="vault-item-copy">
                    <strong>{entry.title}</strong>
                    <span>
                      {t(entry.category)} · {entry.site}
                      {entry.linkedRecordId
                        ? ' · ' + (linkedName(entry.linkedRecordId) || t('Equipo no encontrado'))
                        : ''}
                    </span>
                    <small>
                      {t('Usuario')}: {entry.username || '—'} · {t('Contraseña')}: ••••••••
                    </small>
                  </div>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => openEdit(entry)}
                  >
                    {t('Ver y editar')}
                  </button>
                  <button
                    className="icon-button vault-delete"
                    type="button"
                    onClick={() => void deleteEntry(entry)}
                    aria-label={t('Eliminar credencial')}
                  >
                    <X size={17} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="card vault-empty">
              <KeyRound size={28} />
              <h3>{t('No hay credenciales para esta sede')}</h3>
              <p>
                {t(
                  'Añade la primera credencial. Su usuario, contraseña y notas quedarán cifrados.',
                )}
              </p>
              <button type="button" className="button button-primary" onClick={openNew}>
                <Plus size={17} />
                {t('Añadir credencial')}
              </button>
            </div>
          )}
          <div className="vault-bottom-grid">
            <form className="card vault-import" onSubmit={(event) => void importBackup(event)}>
              <span className="section-kicker">{t('RESPALDOS')}</span>
              <h3>{t('Integrar un respaldo cifrado')}</h3>
              <p>
                {t(
                  'Se añadirán las credenciales faltantes y se conservará la versión más reciente de cada una.',
                )}
              </p>
              <div className="vault-import-fields">
                <label className="field">
                  <span>{t('Archivo de respaldo')}</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={(event) => setBackupFile(event.target.files?.[0] ?? null)}
                  />
                </label>
                <label className="field">
                  <span>{t('Frase maestra del respaldo')}</span>
                  <input
                    type="password"
                    autoComplete="off"
                    value={backupPhrase}
                    onChange={(event) => setBackupPhrase(event.target.value)}
                  />
                </label>
              </div>
              <button className="button button-secondary" type="submit" disabled={busy}>
                <Upload size={17} />
                {t('Integrar respaldo')}
              </button>
            </form>
            <div className="card vault-history">
              <span className="section-kicker">{t('ACTIVIDAD CIFRADA')}</span>
              <h3>{t('Cambios en la bóveda')}</h3>
              {document.events.length ? (
                document.events.slice(0, 5).map((item) => (
                  <div className="vault-event" key={item.id}>
                    <Clock3 size={15} />
                    <span>
                      {t(
                        {
                          created: 'Creada',
                          updated: 'Actualizada',
                          deleted: 'Eliminada',
                          imported: 'Respaldo integrado',
                        }[item.action],
                      )}
                      : {item.title}
                    </span>
                    <small>{new Date(item.at).toLocaleDateString(dateLocale)}</small>
                  </div>
                ))
              ) : (
                <p>{t('Aún no hay cambios en la bóveda.')}</p>
              )}
            </div>
          </div>
        </>
      )}
      {formOpen && document && (
        <div
          className="modal-scrim"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setFormOpen(false);
          }}
        >
          <div
            className="form-modal modal vault-form-modal"
            role="dialog"
            aria-modal="true"
            aria-label={editingId ? t('Editar credencial') : t('Añadir credencial')}
          >
            <form onSubmit={(event) => void saveEntry(event)}>
              <div className="modal-head">
                <div>
                  <span className="section-kicker">{t('BÓVEDA CIFRADA')}</span>
                  <h2>{editingId ? t('Editar credencial') : t('Añadir credencial')}</h2>
                  <p>{t('La información de esta ficha se cifra antes de guardarse.')}</p>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={t('Cerrar')}
                  onClick={() => setFormOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="form-scroll">
                <div className="form-grid">
                  <label className="field span-2">
                    <span>{t('Nombre de la credencial')} *</span>
                    <input
                      required
                      maxLength={160}
                      value={draft.title}
                      onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                      placeholder={t('Ej. Administración del teléfono de recepción')}
                    />
                  </label>
                  <label className="field">
                    <span>{t('Sede')}</span>
                    <select
                      value={draft.site}
                      onChange={(event) => setDraft({ ...draft, site: event.target.value as Site })}
                    >
                      {SITES.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>{t('Tipo de acceso')}</span>
                    <select
                      value={draft.category}
                      onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                    >
                      {categories.map((item) => (
                        <option key={item} value={item}>
                          {t(item)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field span-2">
                    <span>{t('Equipo vinculado')}</span>
                    <select
                      value={draft.linkedRecordId}
                      onChange={(event) =>
                        setDraft({ ...draft, linkedRecordId: event.target.value })
                      }
                    >
                      <option value="">{t('Sin vínculo')}</option>
                      {devices.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} · {item.site}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>{t('Usuario')}</span>
                    <input
                      maxLength={300}
                      autoComplete="off"
                      value={draft.username}
                      onChange={(event) => setDraft({ ...draft, username: event.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>{t('Contraseña')}</span>
                    <div className="vault-password-field">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        maxLength={3000}
                        autoComplete="new-password"
                        value={draft.password}
                        onChange={(event) => setDraft({ ...draft, password: event.target.value })}
                      />
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={t(showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña')}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </label>
                  <label className="field span-2">
                    <span>{t('Dirección o servicio')}</span>
                    <input
                      maxLength={500}
                      value={draft.address}
                      onChange={(event) => setDraft({ ...draft, address: event.target.value })}
                      placeholder="https://..."
                    />
                  </label>
                  <label className="field span-2">
                    <span>{t('Notas privadas')}</span>
                    <textarea
                      rows={3}
                      maxLength={4000}
                      value={draft.notes}
                      onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                    />
                  </label>
                </div>
              </div>
              <div className="form-footer">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setFormOpen(false)}
                >
                  {t('Cancelar')}
                </button>
                <button className="button button-primary" type="submit" disabled={busy}>
                  <Check size={17} />
                  {t('Guardar cifrado')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
