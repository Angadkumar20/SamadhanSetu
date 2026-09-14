import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en.json';
import hiTranslation from './locales/hi.json';
import bnTranslation from './locales/bn.json';
import taTranslation from './locales/ta.json';
import teTranslation from './locales/te.json';
import mrTranslation from './locales/mr.json';
import guTranslation from './locales/gu.json';
import knTranslation from './locales/kn.json';
import mlTranslation from './locales/ml.json';
import paTranslation from './locales/pa.json';
import orTranslation from './locales/or.json';
import urTranslation from './locales/ur.json';
import asTranslation from './locales/as.json';

/**
 * 13 Major Indian Languages supported by SamadhanSetu with complete native UI resources
 */
export const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', isComplete: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isComplete: true },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', isComplete: true },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', isComplete: true },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', isComplete: true },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', isComplete: true },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', isComplete: true },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', isComplete: true },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', isComplete: true },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', isComplete: true },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', isComplete: true },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', isComplete: true, isRtl: true },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', isComplete: true },
];

// Initialize all resources with actual localized dictionaries
const resources = {
  en: { translation: enTranslation },
  hi: { translation: hiTranslation },
  bn: { translation: bnTranslation },
  ta: { translation: taTranslation },
  te: { translation: teTranslation },
  mr: { translation: mrTranslation },
  gu: { translation: guTranslation },
  kn: { translation: knTranslation },
  ml: { translation: mlTranslation },
  pa: { translation: paTranslation },
  or: { translation: orTranslation },
  ur: { translation: urTranslation },
  as: { translation: asTranslation },
};

const supportedLanguageCodes = AVAILABLE_LANGUAGES.map(({ code }) => code);

// Global RTL / LTR direction handler
export const applyDirection = (lng) => {
  if (lng === 'ur') {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ur';
    document.body.classList.add('rtl-layout');
  } else {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = lng || 'en';
    document.body.classList.remove('rtl-layout');
  }
};

// Detect saved language from localStorage or default to English
const savedLanguage = localStorage.getItem('language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    supportedLngs: supportedLanguageCodes,
    load: 'languageOnly',
    interpolation: {
      escapeValue: false, // React already safeguards against XSS
    },
  });

// Apply initial layout direction based on saved language
applyDirection(savedLanguage);

// Listen to language change to synchronize with localStorage and page direction
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
  applyDirection(lng);
});

export default i18n;
