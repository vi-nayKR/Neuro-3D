import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BrainRegion } from '../models/brain.models';

@Injectable({ providedIn: 'root' })
export class BrainStateService {
  private readonly selectedRegionSubject = new BehaviorSubject<BrainRegion | null>(null);
  readonly selectedRegion$ = this.selectedRegionSubject.asObservable();

  selectRegion(region: BrainRegion): void {
    this.selectedRegionSubject.next(region);
  }
}
