import { useSettingsStore } from '@/stores/settings-store';
import zh from '@/i18n/zh.json';
import en from '@/i18n/en.json';

const messages: Record<string, Record<string, unknown>> = { zh, en };

function get(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : undefined;
}

export function useI18n() {
  const locale = useSettingsStore((s) => s.locale);
  const dict = messages[locale] ?? messages.zh;

  const t = (key: string): string => {
    return get(dict, key) ?? key;
  };

  return { t, locale };
}
