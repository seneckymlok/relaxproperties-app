"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface CookiePreferences {
  essential: boolean; // always true
  analytics: boolean;
  marketing: boolean;
}

interface CookieConsentContextType {
  preferences: CookiePreferences;
  hasConsented: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (prefs: Partial<CookiePreferences>) => void;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

const STORAGE_KEY = "relaxproperties_cookie_consent";

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
};

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);
  const [hasConsented, setHasConsented] = useState(true); // default true to avoid flash

  useEffect(() => {
    const stored = getCookie(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CookiePreferences;
        setPreferences({ ...parsed, essential: true });
        setHasConsented(true);
      } catch {
        setHasConsented(false);
      }
    } else {
      setHasConsented(false);
    }
  }, []);

  const persist = useCallback((prefs: CookiePreferences) => {
    setPreferences(prefs);
    setHasConsented(true);
    setCookie(STORAGE_KEY, JSON.stringify(prefs), 365);
  }, []);

  const acceptAll = useCallback(() => {
    persist({ essential: true, analytics: true, marketing: true });
  }, [persist]);

  const rejectAll = useCallback(() => {
    persist({ essential: true, analytics: false, marketing: false });
  }, [persist]);

  const savePreferences = useCallback((prefs: Partial<CookiePreferences>) => {
    persist({ ...preferences, ...prefs, essential: true });
  }, [persist, preferences]);

  return (
    <CookieConsentContext.Provider value={{ preferences, hasConsented, acceptAll, rejectAll, savePreferences }}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error("useCookieConsent must be used within CookieConsentProvider");
  return ctx;
}
