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

  readonly highlights = [
    {
      title: 'Perception to meaning',
      body: 'Follow raw sensory input as it becomes shape, sound, memory context, and emotional priority.'
    },
    {
      title: 'Memory as a network',
      body: 'Compare encoding, retrieval, fading, and repetition to see why stronger pathways recall faster.'
    },
    {
      title: 'Decisions as convergence',
      body: 'Watch evidence, emotion, rules, and goals combine before the motor system prepares action.'
    }
  ];
}
