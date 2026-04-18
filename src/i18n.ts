import i18n, { type ResourceLanguage } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ru from './locales/ru.json';

const localeLoaders: Record<string, () => Promise<{ default: ResourceLanguage }>> = {
  en: () => import('./locales/en.json'),
  zh: () => import('./locales/zh.json'),
  fa: () => import('./locales/fa.json'),
};

const FALLBACK_LNG = 'ru';
const SUPPORTED_LANGS = [FALLBACK_LNG, ...Object.keys(localeLoaders)];

const loadedLanguages = new Set<string>([FALLBACK_LNG]);

async function loadLanguage(lng: string): Promise<void> {
  if (loadedLanguages.has(lng)) return;

  const loader = localeLoaders[lng];
  if (!loader) return;

  const mod = await loader();
  i18n.addResourceBundle(lng, 'translation', mod.default, true, true);
  loadedLanguages.add(lng);
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: FALLBACK_LNG,
    supportedLngs: SUPPORTED_LANGS,
    partialBundledLanguages: true,
    resources: {
      [FALLBACK_LNG]: { translation: ru as ResourceLanguage },
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'cabinet_language',
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },

    showSupportNotice: false,
  });

// Wait for the detected (non-fallback) language before first render, so pages
// don't flash raw translation keys. ru is already bundled synchronously above.
const detectedLng = i18n.language?.split('-')[0] || FALLBACK_LNG;
export const i18nReady: Promise<void> =
  detectedLng === FALLBACK_LNG ? Promise.resolve() : loadLanguage(detectedLng).catch(() => {});

// Lazy-load on language change
i18n.on('languageChanged', (lng: string) => {
  const code = lng.split('-')[0];
  loadLanguage(code);
});

export default i18n;
