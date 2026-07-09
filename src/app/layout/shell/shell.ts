import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar';

@Component({
  selector: 'app-shell',
  imports: [NavbarComponent, RouterOutlet],
  templateUrl: './shell.html',
  styleUrl: './shell.scss'
})
export class ShellComponent {}
