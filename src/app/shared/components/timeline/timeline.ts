import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { Subscription, map } from 'rxjs';
import { BrainSimulationService } from '../../../core/services/brain-simulation.service';

@Component({
  selector: 'app-timeline',
  imports: [CommonModule],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss'
})
export class TimelineComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scroller') private readonly scrollerRef?: ElementRef<HTMLElement>;

  readonly simulation = inject(BrainSimulationService);
  readonly timeline$ = this.simulation.timeline$;
  readonly progress$ = this.timeline$.pipe(
    map((steps) => {
      if (steps.length <= 1) {
        return 0;
      }
      const activeIndex = steps.findIndex((step) => step.status === 'active');
      return Math.max(0, activeIndex) / (steps.length - 1);
    })
  );

  private readonly subscription = new Subscription();
  private readonly reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  ngAfterViewInit(): void {
    this.subscription.add(
      this.timeline$.subscribe(() => {
        // Wait for the DOM to reflect the new active step before scrolling to it.
        setTimeout(() => this.scrollActiveIntoView());
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private scrollActiveIntoView(): void {
    const scroller = this.scrollerRef?.nativeElement;
    const active = scroller?.querySelector<HTMLElement>('.timeline-step.active');
    if (!scroller || !active) {
      return;
    }
    const target = active.offsetLeft - scroller.clientWidth / 2 + active.clientWidth / 2;
    scroller.scrollTo({ left: target, behavior: this.reducedMotion ? 'auto' : 'smooth' });
  }
}
