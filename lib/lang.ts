"use client";

import { useSyncExternalStore } from "react";

// English by default (international audience), French on demand; the choice is remembered in this browser.
export type Lang = "en" | "fr";
const KEY = "tas-tv-lang";
const listeners = new Set<() => void>();
let current: Lang | null = null;

function read(): Lang {
  if (current === null) {
    current = "en";
    try { if (localStorage.getItem(KEY) === "fr") current = "fr"; } catch {}
  }
  return current;
}

export function setLang(lang: Lang) {
  current = lang;
  try { localStorage.setItem(KEY, lang); } catch {}
  document.documentElement.lang = lang;
  listeners.forEach((listener) => listener());
}

export function useLang() {
  const lang = useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    read,
    () => "en" as Lang,
  );
  return { lang, tr: (en: string, fr: string) => (lang === "fr" ? fr : en) };
}
