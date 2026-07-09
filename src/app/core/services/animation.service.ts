import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { BrainRegion } from '../models/brain.models';

@Injectable({ providedIn: 'root' })
export class AnimationService {
  createCurve(from: BrainRegion, to: BrainRegion): THREE.QuadraticBezierCurve3 {
    const start = new THREE.Vector3(from.position.x, from.position.y, from.position.z);
    const end = new THREE.Vector3(to.position.x, to.position.y, to.position.z);
    const midpoint = start.clone().lerp(end, 0.5);
    midpoint.y += 0.9 + start.distanceTo(end) * 0.18;
    midpoint.z += 0.35;
    return new THREE.QuadraticBezierCurve3(start, midpoint, end);
  }
}
