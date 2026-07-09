import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, shareReplay } from 'rxjs';
import {
  BrainPathway,
  BrainRegion,
  DecisionScenario,
  MemoryFlow,
  SimulationScenario
} from '../models/brain.models';

interface BrainRegionData {
  regions: BrainRegion[];
  pathways: BrainPathway[];
}

@Injectable({ providedIn: 'root' })
export class BrainDataService {
  private readonly http = inject(HttpClient);
  private readonly dataRoot = 'assets/data';

  readonly brainData$ = this.http
    .get<BrainRegionData>(`${this.dataRoot}/brain-regions.json`)
    .pipe(shareReplay(1));

  readonly regions$ = this.brainData$.pipe(map((data) => data.regions));
  readonly pathways$ = this.brainData$.pipe(map((data) => data.pathways));

  readonly scenarios$ = this.http
    .get<SimulationScenario[]>(`${this.dataRoot}/simulation-scenarios.json`)
    .pipe(shareReplay(1));

  readonly decisionScenarios$ = this.http
    .get<DecisionScenario[]>(`${this.dataRoot}/decision-scenarios.json`)
    .pipe(shareReplay(1));

  readonly memoryFlows$ = this.http
    .get<MemoryFlow[]>(`${this.dataRoot}/memory-flows.json`)
    .pipe(shareReplay(1));

  readonly appData$ = forkJoin({
    regions: this.regions$,
    pathways: this.pathways$,
    scenarios: this.scenarios$,
    decisions: this.decisionScenarios$,
    memoryFlows: this.memoryFlows$
  }).pipe(shareReplay(1));
}
