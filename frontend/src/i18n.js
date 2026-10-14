import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enTranslation from "./locales/en.json"; // Direct import
import faTranslation from "./locales/fa.json"; // Direct import
import esTranslation from "./locales/es.json"; // Direct import
import frTranslation from "./locales/fr.json"; // Direct import
import arTranslation from "./locales/ar.json"; // Direct import
import deTranslation from "./locales/de.json"; // Direct import
import ruTranslation from "./locales/ru.json"; // Direct import
import hyTranslation from "./locales/hy.json"; // Direct import
import zhTranslation from "./locales/zh.json"; // Direct import
import jaTranslation from "./locales/ja.json"; // Direct import
import koTranslation from "./locales/ko.json"; // Direct import
import hiTranslation from "./locales/hi.json"; // Direct import
import bnTranslation from "./locales/bn.json"; // Direct import
import idTranslation from "./locales/id.json"; // Direct import
import trTranslation from "./locales/tr.json"; // Direct import


i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: {translation : arTranslation},
      de: {translation : deTranslation},
      en: { translation: enTranslation },
      fa: { translation: faTranslation },
      es: {translation : esTranslation},
      fr: {translation : frTranslation},
      hy: {translation : hyTranslation},
      ru: {translation : ruTranslation},
      zh: {translation : zhTranslation},
      ja: {translation : jaTranslation},
      ko: {translation : koTranslation},
      hi: {translation : hiTranslation},
      bn: {translation : bnTranslation},
      id: {translation : idTranslation},
      tr: {translation : trTranslation}
     
    },
    supportedLngs: ["de" ,"en", "fa" , "es", "fr" , "ar" , "ru", "hy","zh","ja","ko","hi","bn","id","tr"],
    fallbackLng: "en",
    detection: {
      order: ["querystring", "cookie", "localStorage", "navigator", "htmlTag"],
      caches: ["localStorage", "cookie"],
      lookupLocalStorage: "i18nextLng",
    },
    react: {
      useSuspense: false,
    },
    interpolation: {
      escapeValue: false,
    },
    debug: process.env.NODE_ENV === "development",
  });

const rtlLanguages = new Set(["fa", "ar"]);

function applyDocumentLocale(language) {
  const normalizedLanguage = language?.split("-")[0] || "en";
  document.documentElement.lang = normalizedLanguage;
  document.documentElement.dir = rtlLanguages.has(normalizedLanguage) ? "rtl" : "ltr";
}

applyDocumentLocale(i18n.language);
i18n.on("languageChanged", applyDocumentLocale);

export default i18n;
