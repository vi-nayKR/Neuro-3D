import { Component } from '@angular/core';
import { BrainSceneComponent } from '../../shared/components/brain-scene/brain-scene';
import { ExplanationPanelComponent } from '../../shared/components/explanation-panel/explanation-panel';
import { SimulationControlsComponent } from '../../shared/components/simulation-controls/simulation-controls';
import { TimelineComponent } from '../../shared/components/timeline/timeline';

@Component({
  selector: 'app-simulation',
  imports: [BrainSceneComponent, ExplanationPanelComponent, SimulationControlsComponent, TimelineComponent],
  templateUrl: './simulation.html',
  styleUrl: './simulation.scss'
})
export class SimulationComponent {}
