"use client";
import { useEffect, useSyncExternalStore } from "react";
import {
  parseLocale,
  translate,
  translateAudit,
  intlLocales,
  type Locale,
} from "./translate";
export { type Locale, intlLocales } from "./translate";
const storageKey = "citycom.locale";
let locale: Locale = "ru";
let initialized = false;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const snapshot = () => locale;
const serverSnapshot = (): Locale => "ru";
export const getLocale = () => locale;
export function setLocale(next: Locale) {
  locale = parseLocale(next);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(storageKey, locale);
    } catch {
      /* Storage may be disabled. */
    }
    document.documentElement.lang = locale;
    document.title = `CityCom — ${translate(locale, "Городская аналитика")}`;
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute(
      "content",
      translate(locale, "Единая аналитика городской обратной связи"),
    );
  }
  listeners.forEach((listener) => listener());
}
export function useLocale() {
  const current = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  useEffect(() => {
    if (!initialized) {
      initialized = true;
      let stored: string | null = null;
      try {
        stored = window.localStorage.getItem(storageKey);
      } catch {
        /* Keep RU default. */
      }
      setLocale(parseLocale(stored));
      window.addEventListener("storage", (event) => {
        if (event.key === storageKey) setLocale(parseLocale(event.newValue));
      });
    }
  }, []);
  return current;
}
export function t<T>(value: T, params?: readonly unknown[]): T {
  return translate(locale, value, params);
}
export const formatDate = (
  value: string,
  options?: Intl.DateTimeFormatOptions,
) => new Date(value).toLocaleString(intlLocales[locale], options);

export const formatAudit = (value: string) => translateAudit(locale, value);
