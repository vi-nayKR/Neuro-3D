import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { BrainSimulationService } from '../../core/services/brain-simulation.service';
import { BrainSceneComponent } from '../../shared/components/brain-scene/brain-scene';
import { ExplanationPanelComponent } from '../../shared/components/explanation-panel/explanation-panel';
import { SimulationControlsComponent } from '../../shared/components/simulation-controls/simulation-controls';
import { TimelineComponent } from '../../shared/components/timeline/timeline';

@Component({
  selector: 'app-information-flow',
  imports: [AsyncPipe, BrainSceneComponent, ExplanationPanelComponent, SimulationControlsComponent, TimelineComponent],
  templateUrl: './information-flow.html',
  styleUrl: './information-flow.scss'
})
export class InformationFlowComponent {
  readonly simulation = inject(BrainSimulationService);
  readonly scenario$ = this.simulation.activeScenario$;

  constructor() {
    this.simulation.selectScenario('visual-apple');
  }
}
