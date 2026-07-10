import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('toggles language, updates the document, and persists the preference', () => {
    const service = TestBed.inject(LanguageService);
    expect(service.language()).toBe('en');

    service.toggle();
    expect(service.language()).toBe('kn');
    expect(document.documentElement.lang).toBe('kn');
    expect(localStorage.getItem('preferredLanguage')).toBe('kn');
    expect(service.translate('Overview')).toBe('ಅವಲೋಕನ');

    service.toggle();
    expect(service.translate('Overview')).toBe('Overview');
  });

  it('restores Kannada from local storage', () => {
    localStorage.setItem('preferredLanguage', 'kn');
    const service = TestBed.inject(LanguageService);
    expect(service.language()).toBe('kn');
    expect(document.documentElement.lang).toBe('kn');
  });
});
