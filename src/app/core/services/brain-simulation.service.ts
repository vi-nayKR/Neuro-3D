import { Injectable, OnDestroy, inject } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  map,
  shareReplay,
  take
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
  private readonly stateSubject = new BehaviorSubject<SimulationState>(initialState);
  private playbackTimer: ReturnType<typeof setTimeout> | null = null;

  readonly state$ = this.stateSubject.asObservable();
  readonly scenarios$ = this.data.scenarios$;

  readonly activeScenario$ = combineLatest([this.scenarios$, this.state$]).pipe(
    map(([scenarios, state]) => scenarios.find((scenario) => scenario.id === state.selectedScenarioId) ?? scenarios[0]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly activeStep$ = combineLatest([this.activeScenario$, this.state$]).pipe(
    map(([scenario, state]) => scenario?.steps[state.currentStepIndex] ?? null)
  );

  readonly timeline$ = combineLatest([this.activeScenario$, this.state$]).pipe(
    map(([scenario, state]) => this.toTimeline(scenario, state.currentStepIndex))
  );

  ngOnDestroy(): void {
    this.clearPlaybackTimer();
  }

  start(): void {
    const state = this.stateSubject.value;
    this.patchState({ status: 'running', currentStepIndex: state.status === 'completed' ? 0 : state.currentStepIndex });
    this.scheduleNextStep();
  }

  pause(): void {
    this.clearPlaybackTimer();
    this.patchState({ status: 'paused' });
  }

  reset(): void {
    this.clearPlaybackTimer();
    this.patchState({ status: 'idle', currentStepIndex: 0 });
  }

  selectScenario(selectedScenarioId: string): void {
    this.clearPlaybackTimer();
    this.patchState({ selectedScenarioId, currentStepIndex: 0, status: 'idle' });
  }

  setSpeed(speed: number): void {
    this.patchState({ speed: Math.min(3, Math.max(0.5, speed)) });
    if (this.stateSubject.value.status === 'running') this.scheduleNextStep();
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
    this.activeScenario$.pipe(take(1)).subscribe((scenario) => {
        const state = this.stateSubject.value;
        const lastIndex = Math.max(0, scenario.steps.length - 1);
        const nextIndex = Math.min(lastIndex, state.currentStepIndex + 1);
        const completed = nextIndex === lastIndex;
        this.patchState({
          currentStepIndex: nextIndex,
          status: completed ? 'completed' : state.status
        });
        if (completed) this.clearPlaybackTimer();
        else if (state.status === 'running') this.scheduleNextStep();
      });
  }

  stepBackward(): void {
    this.clearPlaybackTimer();
    const state = this.stateSubject.value;
    this.patchState({
      currentStepIndex: Math.max(0, state.currentStepIndex - 1),
      status: state.status === 'idle' ? 'idle' : 'paused'
    });
  }

  goToStep(index: number): void {
    this.clearPlaybackTimer();
    this.activeScenario$.pipe(take(1)).subscribe((scenario) => {
      this.patchState({
        currentStepIndex: Math.min(Math.max(0, scenario.steps.length - 1), Math.max(0, index)),
        status: this.stateSubject.value.status === 'idle' ? 'idle' : 'paused'
      });
    });
  }

  stepDurationMs(speed = this.stateSubject.value.speed): number {
    return 2400 / speed;
  }

  private patchState(partial: Partial<SimulationState>): void {
    this.stateSubject.next({ ...this.stateSubject.value, ...partial });
  }

  private scheduleNextStep(): void {
    this.clearPlaybackTimer();
    this.playbackTimer = setTimeout(() => this.stepForward(), this.stepDurationMs());
  }

  private clearPlaybackTimer(): void {
    if (this.playbackTimer !== null) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
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
