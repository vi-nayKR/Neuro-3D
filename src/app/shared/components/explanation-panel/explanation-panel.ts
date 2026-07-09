import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import { BrainDataService } from '../../../core/services/brain-data.service';
import { BrainSimulationService } from '../../../core/services/brain-simulation.service';
import { BrainStateService } from '../../../core/services/brain-state.service';

@Component({
  selector: 'app-explanation-panel',
  imports: [CommonModule],
  templateUrl: './explanation-panel.html',
  styleUrl: './explanation-panel.scss'
})
export class ExplanationPanelComponent {
  private readonly data = inject(BrainDataService);
  private readonly simulation = inject(BrainSimulationService);
  private readonly brainState = inject(BrainStateService);

  readonly panel$ = combineLatest([
    this.data.regions$,
    this.simulation.activeStep$,
    this.brainState.selectedRegion$
  ]).pipe(
    map(([regions, activeStep, selectedRegion]) => {
      const activeRegion = activeStep ? regions.find((region) => region.id === activeStep.regionId) : null;
      return {
        selectedRegion,
        activeStep,
        activeRegion
      };
    })
  );
}
