import { Component } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-footer',
  imports: [TranslatePipe],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class FooterComponent {}
