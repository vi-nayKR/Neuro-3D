import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { DecisionScenario } from '../../core/models/brain.models';
import { BrainDataService } from '../../core/services/brain-data.service';
import { BrainSimulationService } from '../../core/services/brain-simulation.service';
import { BrainSceneComponent } from '../../shared/components/brain-scene/brain-scene';
import { ExplanationPanelComponent } from '../../shared/components/explanation-panel/explanation-panel';
import { SimulationControlsComponent } from '../../shared/components/simulation-controls/simulation-controls';
import { TimelineComponent } from '../../shared/components/timeline/timeline';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-decision-making',
  imports: [AsyncPipe, BrainSceneComponent, ExplanationPanelComponent, SimulationControlsComponent, TimelineComponent, TranslatePipe],
  templateUrl: './decision-making.html',
  styleUrl: './decision-making.scss'
})
export class DecisionMakingComponent {
  private readonly data = inject(BrainDataService);
  private readonly simulation = inject(BrainSimulationService);
  private readonly selectedDecisionId = new BehaviorSubject<string>('safe-crossing');

  readonly decisions$ = this.data.decisionScenarios$;
  readonly selectedDecision$ = combineLatest([this.decisions$, this.selectedDecisionId]).pipe(
    map(([decisions, selectedId]) => decisions.find((decision) => decision.id === selectedId) ?? decisions[0])
  );

  chooseDecision(decision: DecisionScenario): void {
    this.selectedDecisionId.next(decision.id);
    this.simulation.selectScenario(decision.scenarioId);
    this.simulation.reset();
  }

  runDecision(decision: DecisionScenario): void {
    this.chooseDecision(decision);
    this.simulation.start();
  }
}
