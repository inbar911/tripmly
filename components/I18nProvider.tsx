'use client';
import { createContext, useContext } from 'react';
import { type Lang, type TKey, tFor } from '@/lib/i18n';

const Ctx = createContext<{ lang: Lang; t: (k: TKey) => string }>({ lang: 'he', t: tFor('he') });

export function I18nProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <Ctx.Provider value={{ lang, t: tFor(lang) }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
