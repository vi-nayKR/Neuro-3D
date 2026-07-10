import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';

@Component({
  selector: 'app-shell',
  imports: [NavbarComponent, RouterOutlet, FooterComponent],
  templateUrl: './shell.html',
  styleUrl: './shell.scss'
})
export class ShellComponent {}
