import { createContext, useContext } from 'react';
import { STRINGS, type Lang, type Strings } from './strings';

export const I18nContext = createContext<{ lang: Lang; t: Strings }>({ lang: 'da', t: STRINGS.da });

export const useI18n = () => useContext(I18nContext);

/** Number formatting in the chosen language (Danish uses decimal comma). */
export function formatNumber(lang: Lang, n: number, digits = 1): string {
  if (!Number.isFinite(n)) return '–';
  return n.toLocaleString(lang === 'da' ? 'da-DK' : 'en-GB', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: false,
  });
}
