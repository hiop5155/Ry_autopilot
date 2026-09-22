// client/src/context/I18nContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { I18N, TRAIN_TYPES_MAP } from "../i18n/locales";

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("app_lang") || "zh-TW";
  });

  useEffect(() => {
    localStorage.setItem("app_lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key, params = {}) => {
    const dict = I18N[lang] || I18N["zh-TW"];
    let text = dict[key] || I18N["zh-TW"][key] || key;
    if (typeof text === "string" && params) {
      Object.keys(params).forEach((p) => {
        text = text.replaceAll(`{${p}}`, params[p]);
      });
    }
    return text;
  };

  const formatTrainType = (type) => {
    if (!type || typeof type !== "string") return type || "";
    const clean = type.trim();
    if (TRAIN_TYPES_MAP[clean]) {
      return TRAIN_TYPES_MAP[clean][lang] || TRAIN_TYPES_MAP[clean]["zh-TW"] || clean;
    }
    return clean;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t, formatTrainType }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
