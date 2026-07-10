import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { AppLanguage, KANNADA_TRANSLATIONS } from './translations';

const STORAGE_KEY = 'preferredLanguage';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  readonly language = signal<AppLanguage>(this.savedLanguage());

  constructor() {
    this.document.documentElement.lang = this.language();
  }

  toggle(): void {
    this.setLanguage(this.language() === 'en' ? 'kn' : 'en');
  }

  setLanguage(language: AppLanguage): void {
    this.language.set(language);
    this.document.documentElement.lang = language;
    try { localStorage.setItem(STORAGE_KEY, language); } catch { /* Storage may be unavailable. */ }
  }

  translate(value: string | null | undefined): string {
    if (!value || this.language() === 'en') return value ?? '';
    return KANNADA_TRANSLATIONS[value] ?? value;
  }

  private savedLanguage(): AppLanguage {
    try { return localStorage.getItem(STORAGE_KEY) === 'kn' ? 'kn' : 'en'; } catch { return 'en'; }
  }
}
