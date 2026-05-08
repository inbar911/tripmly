'use client';
import { Languages } from 'lucide-react';
import { useI18n } from './I18nProvider';

export default function LangToggle() {
  const { lang } = useI18n();
  function toggle() {
    const next = lang === 'he' ? 'en' : 'he';
    document.cookie = `lang=${next};path=/;max-age=31536000;samesite=lax`;
    location.reload();
  }
  return (
    <button onClick={toggle} className="flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50" aria-label="Switch language">
      <Languages className="h-4 w-4" />
      <span className="text-xs font-bold">{lang === 'he' ? 'EN' : 'עב'}</span>
    </button>
  );
}
