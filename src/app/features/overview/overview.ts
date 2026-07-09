import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BrainSceneComponent } from '../../shared/components/brain-scene/brain-scene';
import { ExplanationPanelComponent } from '../../shared/components/explanation-panel/explanation-panel';
import { SimulationControlsComponent } from '../../shared/components/simulation-controls/simulation-controls';
import { TimelineComponent } from '../../shared/components/timeline/timeline';

@Component({
  selector: 'app-overview',
  imports: [CommonModule, BrainSceneComponent, ExplanationPanelComponent, SimulationControlsComponent, TimelineComponent],
  templateUrl: './overview.html',
  styleUrl: './overview.scss'
})
export class OverviewComponent {
  readonly stats = [
    { value: '9', label: 'interactive regions' },
    { value: '4', label: 'simulation flows' },
    { value: '15', label: 'neural pathways' }
  ];
}
