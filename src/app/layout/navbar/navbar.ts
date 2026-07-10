import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LanguageService } from '../../core/i18n/language.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  readonly language = inject(LanguageService);
  readonly menuOpen = signal(false);
  readonly links = [
    { path: '/overview', label: 'Overview' },
    { path: '/information-flow', label: 'Information Flow' },
    { path: '/memory', label: 'Memory' },
    { path: '/decision-making', label: 'Decision Making' },
    { path: '/simulation', label: 'Simulation' }
  ];

  toggleMenu(): void { this.menuOpen.update((open) => !open); }
  closeMenu(): void { this.menuOpen.set(false); }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.closeMenu(); }
}
