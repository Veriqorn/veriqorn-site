import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Language = "ru" | "en" | "es";

const STORAGE_KEY = "veriqorn-site-language";

function toLanguage(value: string | null): Language | null {
  if (value === "ru" || value === "en" || value === "es") {
    return value;
  }

  return null;
}

function detectInitialLanguage(): Language {
  if (typeof window === "undefined") {
    return "ru";
  }

  const fromStorage = toLanguage(window.localStorage.getItem(STORAGE_KEY));
  if (fromStorage) {
    return fromStorage;
  }

  const browserLanguage = toLanguage(window.navigator.language.slice(0, 2).toLowerCase());
  return browserLanguage ?? "ru";
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({ language, setLanguage: setLanguageState }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}
