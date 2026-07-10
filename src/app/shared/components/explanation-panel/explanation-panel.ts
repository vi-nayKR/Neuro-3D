import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import { BrainPathway } from '../../../core/models/brain.models';
import { BrainDataService } from '../../../core/services/brain-data.service';
import { BrainSimulationService } from '../../../core/services/brain-simulation.service';
import { BrainStateService } from '../../../core/services/brain-state.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-explanation-panel',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './explanation-panel.html',
  styleUrl: './explanation-panel.scss'
})
export class ExplanationPanelComponent {
  private readonly data = inject(BrainDataService);
  private readonly simulation = inject(BrainSimulationService);
  private readonly brainState = inject(BrainStateService);

  readonly panel$ = combineLatest([
    this.data.regions$,
    this.data.pathways$,
    this.simulation.activeScenario$,
    this.simulation.activeStep$,
    this.brainState.selectedRegion$
  ]).pipe(
    map(([regions, pathways, activeScenario, activeStep, selectedRegion]) => {
      const activeRegion = activeStep ? regions.find((region) => region.id === activeStep.regionId) : null;
      const selectedPathways = selectedRegion ? this.pathwaysForRegion(pathways, selectedRegion.id) : [];
      const activeStepIndex = activeScenario && activeStep ? activeScenario.steps.findIndex((step) => step.id === activeStep.id) : -1;

      return {
        selectedRegion,
        selectedPathways,
        activeScenario,
        activeStep,
        activeRegion,
        progressLabel:
          activeScenario && activeStepIndex >= 0 ? `${activeStepIndex + 1} of ${activeScenario.steps.length}` : null
      };
    })
  );

  private pathwaysForRegion(pathways: BrainPathway[], regionId: string): BrainPathway[] {
    return pathways.filter((pathway) => pathway.from === regionId || pathway.to === regionId).slice(0, 4);
  }
}
