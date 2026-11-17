'use client';

import { useState } from 'react';
import { Check, ChevronDown, Languages, MonitorCog, Moon, Sun } from 'lucide-react';
import { LANGUAGES, useI18n } from './i18n';
import { useTheme, type ThemeMode } from './theme';

const modes: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'dark', label: 'Oscuro', icon: Moon },
  { id: 'system', label: 'Automático', icon: MonitorCog },
];

export function ThemeControl() {
  const { t } = useI18n();
  const { mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const current = modes.find((item) => item.id === mode) ?? modes[2];
  const Icon = current.icon;
  return (
    <div
      className="pref-control"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        className="pref-trigger"
        aria-label={`${t('Tema')}: ${t(current.label)}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon size={17} />
        <span className="pref-title">{t('Tema')}</span>
        <strong>{t(current.label)}</strong>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div
          className="pref-menu"
          role="menu"
          aria-label={t('Tema')}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false);
          }}
        >
          {modes.map((item) => {
            const OptionIcon = item.icon;
            return (
              <button
                type="button"
                role="menuitemradio"
                aria-checked={mode === item.id}
                key={item.id}
                onClick={() => {
                  setMode(item.id);
                  setOpen(false);
                }}
              >
                <OptionIcon size={17} />
                <span>{t(item.label)}</span>
                {mode === item.id && <Check size={15} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LanguageControl() {
  const { language, setLanguage, t } = useI18n();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((item) => item.code === language) ?? LANGUAGES[0];
  return (
    <div
      className="pref-control"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        className="pref-trigger"
        aria-label={`${t('Idioma')}: ${current.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Languages size={17} />
        <span className="pref-title">{t('Idioma')}</span>
        <strong>{current.code.toUpperCase()}</strong>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div
          className="pref-menu pref-menu-languages"
          role="menu"
          aria-label={t('Idioma')}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false);
          }}
        >
          {LANGUAGES.map((item) => (
            <button
              type="button"
              role="menuitemradio"
              aria-checked={language === item.code}
              lang={item.code === 'zh' ? 'zh-CN' : item.code}
              key={item.code}
              onClick={() => {
                setLanguage(item.code);
                setOpen(false);
              }}
            >
              <span className="pref-code">{item.code.toUpperCase()}</span>
              <span>{item.label}</span>
              {language === item.code && <Check size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
