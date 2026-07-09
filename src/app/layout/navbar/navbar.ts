import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  readonly links = [
    { path: '/overview', label: 'Overview' },
    { path: '/information-flow', label: 'Information Flow' },
    { path: '/memory', label: 'Memory' },
    { path: '/decision-making', label: 'Decision Making' },
    { path: '/simulation', label: 'Simulation' }
  ];
}
