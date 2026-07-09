import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrainSimulationService } from '../../../core/services/brain-simulation.service';

@Component({
  selector: 'app-simulation-controls',
  imports: [CommonModule, FormsModule],
  templateUrl: './simulation-controls.html',
  styleUrl: './simulation-controls.scss'
})
export class SimulationControlsComponent {
  readonly simulation = inject(BrainSimulationService);
  readonly scenarios$ = this.simulation.scenarios$;
  readonly state$ = this.simulation.state$;
}
