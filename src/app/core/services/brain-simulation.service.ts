import { Injectable, OnDestroy, inject } from '@angular/core';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  interval,
  map,
  takeUntil,
  withLatestFrom
} from 'rxjs';
import { BrainDataService } from './brain-data.service';
import {
  SimulationScenario,
  SimulationState,
  SimulationStep,
  TimelineStep
} from '../models/brain.models';

const initialState: SimulationState = {
  status: 'idle',
  selectedScenarioId: 'visual-apple',
  currentStepIndex: 0,
  speed: 1,
  labelsVisible: true,
  pathwaysVisible: true,
  explanationMode: true
};

@Injectable({ providedIn: 'root' })
export class BrainSimulationService implements OnDestroy {
  private readonly data = inject(BrainDataService);
  private readonly destroy$ = new Subject<void>();
  private readonly stateSubject = new BehaviorSubject<SimulationState>(initialState);
  private lastAutoAdvance = 0;

  readonly state$ = this.stateSubject.asObservable();
  readonly scenarios$ = this.data.scenarios$;

  readonly activeScenario$ = combineLatest([this.scenarios$, this.state$]).pipe(
    map(([scenarios, state]) => scenarios.find((scenario) => scenario.id === state.selectedScenarioId) ?? scenarios[0])
  );

  readonly activeStep$ = combineLatest([this.activeScenario$, this.state$]).pipe(
    map(([scenario, state]) => scenario?.steps[state.currentStepIndex] ?? null)
  );

  readonly timeline$ = combineLatest([this.activeScenario$, this.state$]).pipe(
    map(([scenario, state]) => this.toTimeline(scenario, state.currentStepIndex))
  );

  constructor() {
    interval(120)
      .pipe(withLatestFrom(this.state$, this.activeScenario$), takeUntil(this.destroy$))
      .subscribe(([, state, scenario]) => {
        if (state.status !== 'running' || !scenario) {
          return;
        }

        const now = performance.now();
        const delay = 1800 / state.speed;
        if (now - this.lastAutoAdvance < delay) {
          return;
        }

        this.lastAutoAdvance = now;
        this.stepForward();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  start(): void {
    this.patchState({ status: 'running' });
  }

  pause(): void {
    this.patchState({ status: 'paused' });
  }

  reset(): void {
    this.lastAutoAdvance = 0;
    this.patchState({ status: 'idle', currentStepIndex: 0 });
  }

  selectScenario(selectedScenarioId: string): void {
    this.lastAutoAdvance = 0;
    this.patchState({ selectedScenarioId, currentStepIndex: 0, status: 'idle' });
  }

  setSpeed(speed: number): void {
    this.patchState({ speed });
  }

  toggleLabels(): void {
    const state = this.stateSubject.value;
    this.patchState({ labelsVisible: !state.labelsVisible });
  }

  togglePathways(): void {
    const state = this.stateSubject.value;
    this.patchState({ pathwaysVisible: !state.pathwaysVisible });
  }

  toggleExplanationMode(): void {
    const state = this.stateSubject.value;
    this.patchState({ explanationMode: !state.explanationMode });
  }

  stepForward(): void {
    combineLatest([this.activeScenario$, this.state$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([scenario, state]) => {
        const lastIndex = Math.max(0, scenario.steps.length - 1);
        const nextIndex = Math.min(lastIndex, state.currentStepIndex + 1);
        this.patchState({
          currentStepIndex: nextIndex,
          status: nextIndex === lastIndex ? 'completed' : state.status
        });
      })
      .unsubscribe();
  }

  stepBackward(): void {
    const state = this.stateSubject.value;
    this.patchState({
      currentStepIndex: Math.max(0, state.currentStepIndex - 1),
      status: state.status === 'completed' ? 'paused' : state.status
    });
  }

  private patchState(partial: Partial<SimulationState>): void {
    this.stateSubject.next({ ...this.stateSubject.value, ...partial });
  }

  private toTimeline(scenario: SimulationScenario | undefined, currentStepIndex: number): TimelineStep[] {
    if (!scenario) {
      return [];
    }

    return scenario.steps.map((step: SimulationStep, index: number) => ({
      ...step,
      status: index < currentStepIndex ? 'completed' : index === currentStepIndex ? 'active' : 'pending'
    }));
  }
}
