import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  resolveLocale,
  type SupportedLocale,
} from "@/lib/i18n/shared";
import { appTranslations } from "@/lib/i18n/appTranslations";

type TranslationValue =
  | string
  | number
  | boolean
  | null
  | TranslationValue[]
  | { [key: string]: TranslationValue };

interface LanguageContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: <T = TranslationValue>(
    key: string,
    params?: Record<string, string | number>
  ) => T;
}

const STORAGE_KEY = "monAmieChicken.locale";

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

const template = (input: string, params?: Record<string, string | number>) => {
  if (!params) {
    return input;
  }
  return Object.entries(params).reduce((acc, [key, value]) => {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    return acc.replace(pattern, String(value));
  }, input);
};

const traverse = (
  obj: TranslationValue,
  path: string[]
): TranslationValue | undefined => {
  if (!path.length) {
    return obj;
  }
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return undefined;
  }
  const [head, ...rest] = path;
  if (!(head in obj)) {
    return undefined;
  }
  return traverse(obj[head], rest);
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    if (typeof window === "undefined") {
      return "de";
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return resolveLocale(stored);
      }
    } catch (_error) {
      // ignore storage access errors
    }
    return "de";
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", locale);
    }
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, locale);
      } catch (_error) {
        // ignore storage write errors
      }
    }
  }, [locale]);

  const setLocale = useCallback((candidate: SupportedLocale) => {
    setLocaleState(resolveLocale(candidate));
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const translations = appTranslations[locale];
    const fallbackTranslations = appTranslations.de;
    return {
      locale,
      setLocale,
      t: (key, params) => {
        const path = key.split(".");
        const primary = traverse(translations, path);
        const fallback =
          primary !== undefined
            ? primary
            : traverse(fallbackTranslations, path);
        if (typeof fallback === "string") {
          return template(fallback, params) as unknown as ReturnType<
            LanguageContextValue["t"]
          >;
        }
        if (Array.isArray(fallback)) {
          return fallback as unknown as ReturnType<LanguageContextValue["t"]>;
        }
        if (fallback !== null && typeof fallback === "object") {
          return fallback as unknown as ReturnType<LanguageContextValue["t"]>;
        }
        return (fallback ?? key) as unknown as ReturnType<
          LanguageContextValue["t"]
        >;
      },
    };
  }, [locale, setLocale]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
