import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { MemoryFlow } from '../../core/models/brain.models';
import { BrainDataService } from '../../core/services/brain-data.service';
import { BrainSimulationService } from '../../core/services/brain-simulation.service';
import { BrainSceneComponent } from '../../shared/components/brain-scene/brain-scene';
import { ExplanationPanelComponent } from '../../shared/components/explanation-panel/explanation-panel';
import { SimulationControlsComponent } from '../../shared/components/simulation-controls/simulation-controls';
import { TimelineComponent } from '../../shared/components/timeline/timeline';

@Component({
  selector: 'app-memory',
  imports: [AsyncPipe, DecimalPipe, BrainSceneComponent, ExplanationPanelComponent, SimulationControlsComponent, TimelineComponent],
  templateUrl: './memory.html',
  styleUrl: './memory.scss'
})
export class MemoryComponent {
  private readonly data = inject(BrainDataService);
  private readonly simulation = inject(BrainSimulationService);
  private readonly selectedFlowId = new BehaviorSubject<string>('store-memory');

  readonly memoryFlows$ = this.data.memoryFlows$;
  readonly selectedFlow$ = combineLatest([this.memoryFlows$, this.selectedFlowId]).pipe(
    map(([flows, selectedId]) => flows.find((flow) => flow.id === selectedId) ?? flows[0])
  );

  chooseFlow(flow: MemoryFlow): void {
    this.selectedFlowId.next(flow.id);
    this.simulation.selectScenario(flow.scenarioId);
    this.simulation.reset();
  }

  runFlow(flow: MemoryFlow): void {
    this.chooseFlow(flow);
    this.simulation.start();
  }
}
