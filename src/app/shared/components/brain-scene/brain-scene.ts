import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { combineLatest, Subscription } from 'rxjs';
import { BrainPathway, BrainRegion, SimulationStep } from '../../../core/models/brain.models';
import { AnimationService } from '../../../core/services/animation.service';
import { BrainDataService } from '../../../core/services/brain-data.service';
import { BrainSimulationService } from '../../../core/services/brain-simulation.service';
import { BrainStateService } from '../../../core/services/brain-state.service';

interface RegionMesh extends THREE.Mesh {
  userData: {
    region: BrainRegion;
  };
}

interface PathwayObject {
  pathway: BrainPathway;
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  curve: THREE.QuadraticBezierCurve3;
  targetOpacity: number;
  targetPulse: number;
  targetColor: THREE.Color;
}

interface SignalObject {
  mesh: THREE.Mesh;
  glow: THREE.Mesh;
  curve: THREE.QuadraticBezierCurve3;
  startTime: number;
  duration: number;
}

interface RegionLabel {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  depth: number;
  visible: boolean;
  active: boolean;
  selected: boolean;
  hovered: boolean;
}

const INTRO_DURATION_MS = 1700;
const AUTO_ROTATE_RESUME_MS = 6000;

/** Fresnel rim glow — brightest where the surface grazes the view direction. */
const FRESNEL_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRESNEL_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewDir))), 2.4);
    gl_FragColor = vec4(uColor, fresnel * uIntensity);
  }
`;

/** Soft orb glow for regions — solid facing the camera, fading at the silhouette. */
const HALO_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float facing = abs(dot(normalize(vNormal), normalize(vViewDir)));
    gl_FragColor = vec4(uColor, pow(facing, 2.4) * uIntensity);
  }
`;

/** Pathway tube with a traveling pulse of light along its length (uv.x = 0..1). */
const PATHWAY_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PATHWAY_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uPulse;
  uniform float uOffset;
  varying vec2 vUv;
  void main() {
    float head = fract(vUv.x - uTime * 0.28 - uOffset);
    float pulse = smoothstep(0.22, 0.0, head) * uPulse;
    vec3 color = uColor + vec3(1.0) * pulse * 0.55;
    float alpha = uOpacity + pulse * 0.5;
    gl_FragColor = vec4(color, alpha);
  }
`;

/** Layered trigonometric noise that suggests cortical folds. */
function corticalFold(vertex: THREE.Vector3, frequency: number): number {
  return (
    Math.sin(vertex.x * 4.6 * frequency) * Math.cos(vertex.y * 5.8 * frequency) * 0.45 +
    Math.sin(vertex.y * 7.2 * frequency + vertex.z * 5.4 * frequency) * 0.35 +
    Math.cos(vertex.z * 8.8 * frequency + vertex.x * 3.6 * frequency) * 0.2
  );
}

function wrinkledSphere(radius: number, amplitude: number, frequency: number): THREE.SphereGeometry {
  const geometry = new THREE.SphereGeometry(radius, 96, 72);
  const positions = geometry.attributes['position'] as THREE.BufferAttribute;
  const vertex = new THREE.Vector3();
  const normal = new THREE.Vector3();
  for (let index = 0; index < positions.count; index += 1) {
    vertex.fromBufferAttribute(positions, index);
    normal.copy(vertex).normalize();
    vertex.addScaledVector(normal, corticalFold(vertex, frequency) * amplitude);
    positions.setXYZ(index, vertex.x, vertex.y, vertex.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

@Component({
  selector: 'app-brain-scene',
  imports: [CommonModule],
  templateUrl: './brain-scene.html',
  styleUrl: './brain-scene.scss'
})
export class BrainSceneComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() compact = false;
  @Input() focusPathwayIds: string[] = [];
  @Input() memoryStrength: number | null = null;

  @ViewChild('stage', { static: true }) private readonly stageRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas', { static: true }) private readonly canvasRef!: ElementRef<HTMLCanvasElement>;

  // Signals so the zoneless app re-renders labels driven by the rAF loop.
  readonly labels = signal<RegionLabel[]>([]);
  readonly hoveredRegion = signal<BrainRegion | null>(null);

  private readonly data = inject(BrainDataService);
  private readonly simulation = inject(BrainSimulationService);
  private readonly brainState = inject(BrainStateService);
  private readonly animationService = inject(AnimationService);

  private readonly subscriptions = new Subscription();
  private readonly scene = new THREE.Scene();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly clock = new THREE.Clock();
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private animationFrame = 0;
  private resizeObserver?: ResizeObserver;
  private regionMeshes = new Map<string, RegionMesh>();
  private pathwayObjects: PathwayObject[] = [];
  private signals: SignalObject[] = [];
  private particles!: THREE.Points;
  private currentStep: SimulationStep | null = null;
  private labelsVisible = true;
  private pathwaysVisible = true;
  private reducedMotion = false;
  private selectedRegionId: string | null = null;
  private pointerInside = false;
  private introStart = 0;
  private introFromZ = 0;
  private introToZ = 0;
  private introActive = false;
  private autoRotateTimer: ReturnType<typeof setTimeout> | null = null;
  private lastLabelKey = '';
  private regionGlows = new Map<string, THREE.ShaderMaterial>();
  private shellGlow?: THREE.ShaderMaterial;

  ngAfterViewInit(): void {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.initScene();
    this.bindData();
    this.animate();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['focusPathwayIds'] || changes['memoryStrength']) {
      this.updatePathwayAppearance();
    }
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrame);
    if (this.autoRotateTimer) {
      clearTimeout(this.autoRotateTimer);
    }
    this.resizeObserver?.disconnect();
    this.subscriptions.unsubscribe();
    this.renderer?.dispose();
  }

  onPointerMove(event: PointerEvent): void {
    const bounds = this.canvasRef.nativeElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    this.pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    this.pointerInside = true;
    this.updateHover();
  }

  onPointerLeave(): void {
    this.pointerInside = false;
    this.hoveredRegion.set(null);
    this.canvasRef.nativeElement.style.cursor = 'grab';
  }

  onPointerDown(): void {
    const hit = this.pickRegion();
    if (hit) {
      this.brainState.selectRegion(hit.userData.region);
    }
  }

  private pickRegion(): RegionMesh | undefined {
    if (!this.camera) {
      return undefined;
    }
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersections = this.raycaster.intersectObjects([...this.regionMeshes.values()], false);
    return intersections[0]?.object as RegionMesh | undefined;
  }

  private updateHover(): void {
    const hit = this.pointerInside ? this.pickRegion() : undefined;
    const region = hit?.userData.region ?? null;
    if (region?.id !== this.hoveredRegion()?.id) {
      this.hoveredRegion.set(region);
      this.canvasRef.nativeElement.style.cursor = region ? 'pointer' : 'grab';
    }
  }

  private initScene(): void {
    const canvas = this.canvasRef.nativeElement;
    const bounds = this.stageRef.nativeElement.getBoundingClientRect();
    canvas.style.cursor = 'grab';

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(bounds.width, bounds.height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(48, bounds.width / bounds.height, 0.1, 100);
    this.introToZ = this.compact ? 8 : 7;
    this.introFromZ = this.introToZ + 3.4;
    this.camera.position.set(0, 1.2, this.reducedMotion ? this.introToZ : this.introFromZ);
    this.introStart = performance.now();
    this.introActive = !this.reducedMotion;

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 4.5;
    this.controls.maxDistance = 11;
    this.controls.target.set(0, 0, 0.15);
    this.controls.autoRotate = !this.reducedMotion;
    this.controls.autoRotateSpeed = 0.55;

    this.controls.addEventListener('start', () => {
      this.introActive = false;
      this.controls.autoRotate = false;
      this.canvasRef.nativeElement.style.cursor = 'grabbing';
      if (this.autoRotateTimer) {
        clearTimeout(this.autoRotateTimer);
        this.autoRotateTimer = null;
      }
    });

    this.controls.addEventListener('end', () => {
      this.canvasRef.nativeElement.style.cursor = this.hoveredRegion() ? 'pointer' : 'grab';
      if (this.reducedMotion) {
        return;
      }
      this.autoRotateTimer = setTimeout(() => {
        this.controls.autoRotate = true;
      }, AUTO_ROTATE_RESUME_MS);
    });

    this.scene.add(new THREE.AmbientLight('#d3c8ff', 1.7));
    const key = new THREE.PointLight('#b49bff', 46, 18);
    key.position.set(-4, 4, 5);
    this.scene.add(key);
    const rim = new THREE.PointLight('#39c9e8', 26, 16);
    rim.position.set(4, 2, -4);
    this.scene.add(rim);
    const under = new THREE.PointLight('#e879f9', 10, 12);
    under.position.set(0, -3.5, 1.5);
    this.scene.add(under);

    this.addBrainShell();
    this.addParticles();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.stageRef.nativeElement);
  }

  private bindData(): void {
    this.subscriptions.add(
      combineLatest([
        this.data.regions$,
        this.data.pathways$,
        this.simulation.activeStep$,
        this.simulation.state$,
        this.brainState.selectedRegion$
      ]).subscribe(([regions, pathways, activeStep, state, selectedRegion]) => {
        if (this.regionMeshes.size === 0) {
          this.createRegions(regions);
          this.createPathways(regions, pathways);
        }

        this.currentStep = activeStep;
        this.labelsVisible = state.labelsVisible;
        this.pathwaysVisible = state.pathwaysVisible;
        this.selectedRegionId = selectedRegion?.id ?? null;
        this.updatePathwayAppearance();
        this.updateLabels();

        if (activeStep?.nextRegionId && !this.reducedMotion) {
          this.spawnSignal(activeStep.regionId, activeStep.nextRegionId, regions);
        }
      })
    );
  }

  private addBrainShell(): void {
    const group = new THREE.Group();
    const cortexMaterial = new THREE.MeshPhysicalMaterial({
      color: '#241d3f',
      roughness: 0.52,
      metalness: 0.06,
      transparent: true,
      opacity: 0.46,
      transmission: 0.07,
      thickness: 0.6
    });

    this.shellGlow = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color('#8b7bff') },
        uIntensity: { value: 0.5 }
      },
      vertexShader: FRESNEL_VERTEX,
      fragmentShader: FRESNEL_FRAGMENT,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    // Two wrinkled hemispheres split along the mid-sagittal plane; the
    // brain's long axis runs along X (frontal at -x, occipital at +x).
    const hemisphereGeometry = wrinkledSphere(2.15, 0.085, 1);
    for (const side of [-1, 1] as const) {
      const hemisphere = new THREE.Mesh(hemisphereGeometry, cortexMaterial);
      hemisphere.scale.set(1.42, 0.86, 0.52);
      hemisphere.position.set(-0.1, 0.12, side * 0.58);
      group.add(hemisphere);

      const glow = new THREE.Mesh(hemisphereGeometry, this.shellGlow);
      glow.scale.copy(hemisphere.scale).multiplyScalar(1.015);
      glow.position.copy(hemisphere.position);
      group.add(glow);
    }

    // Cerebellum tucked under the occipital lobe, with finer folds.
    const cerebellum = new THREE.Mesh(wrinkledSphere(0.78, 0.05, 2.3), cortexMaterial);
    cerebellum.scale.set(1.1, 0.72, 0.95);
    cerebellum.position.set(2, -1.28, 0);
    group.add(cerebellum);

    // Brainstem descending from beneath the cerebellum.
    const stem = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.05, 16, 24), cortexMaterial);
    stem.position.set(1.35, -1.78, 0);
    stem.rotation.z = 0.5;
    group.add(stem);

    this.scene.add(group);
  }

  private addParticles(): void {
    const positions: number[] = [];
    const colors: number[] = [];
    const color = new THREE.Color();
    for (let index = 0; index < 360; index += 1) {
      positions.push((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 9);
      color.set(index % 3 === 0 ? '#a78bfa' : index % 3 === 1 ? '#22d3ee' : '#e879f9');
      colors.push(color.r, color.g, color.b);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: 0.025,
      vertexColors: true,
      transparent: true,
      opacity: 0.52,
      depthWrite: false
    });
    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  private createRegions(regions: BrainRegion[]): void {
    regions.forEach((region) => {
      const color = new THREE.Color(region.color);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 32, 24),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 1.1,
          roughness: 0.25
        })
      ) as unknown as RegionMesh;
      mesh.position.set(region.position.x, region.position.y, region.position.z);
      mesh.userData.region = region;

      const haloMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: color.clone() },
          uIntensity: { value: 0.32 }
        },
        vertexShader: FRESNEL_VERTEX,
        fragmentShader: HALO_FRAGMENT,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.32, 32, 24), haloMaterial);
      mesh.add(glow);
      this.regionGlows.set(region.id, haloMaterial);
      this.regionMeshes.set(region.id, mesh);
      this.scene.add(mesh);
    });
  }

  private createPathways(regions: BrainRegion[], pathways: BrainPathway[]): void {
    const regionMap = new Map(regions.map((region) => [region.id, region]));
    pathways.forEach((pathway) => {
      const from = regionMap.get(pathway.from);
      const to = regionMap.get(pathway.to);
      if (!from || !to) {
        return;
      }

      const curve = this.animationService.createCurve(from, to);
      const geometry = new THREE.TubeGeometry(curve, 64, 0.02, 6, false);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color('#8f86e8') },
          uOpacity: { value: 0.16 },
          uTime: { value: 0 },
          uPulse: { value: 0.3 },
          uOffset: { value: Math.random() }
        },
        vertexShader: PATHWAY_VERTEX,
        fragmentShader: PATHWAY_FRAGMENT,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geometry, material);
      this.pathwayObjects.push({
        pathway,
        mesh,
        material,
        curve,
        targetOpacity: 0.16,
        targetPulse: 0.3,
        targetColor: (material.uniforms['uColor'].value as THREE.Color).clone()
      });
      this.scene.add(mesh);
    });
  }

  private updatePathwayAppearance(): void {
    this.pathwayObjects.forEach((entry) => {
      const { pathway, mesh } = entry;
      const focused = this.focusPathwayIds.includes(pathway.id);
      const active =
        this.currentStep?.nextRegionId &&
        pathway.from === this.currentStep.regionId &&
        pathway.to === this.currentStep.nextRegionId;
      const strength = this.memoryStrength ?? pathway.strength;
      entry.targetOpacity = this.pathwaysVisible ? (active ? 0.75 : focused ? 0.55 : 0.08 + strength * 0.16) : 0;
      // Ambient pulses keep a faint information flow visible everywhere;
      // focused and active pathways carry markedly stronger pulses.
      entry.targetPulse = this.pathwaysVisible ? (active ? 1.5 : focused ? 0.9 : 0.3) : 0;
      entry.targetColor.set(active ? '#ffffff' : focused ? '#fbbf24' : '#8f86e8');
      mesh.visible = this.pathwaysVisible;
    });
  }

  private spawnSignal(fromRegionId: string, toRegionId: string, regions: BrainRegion[]): void {
    const from = regions.find((region) => region.id === fromRegionId);
    const to = regions.find((region) => region.id === toRegionId);
    if (!from || !to) {
      return;
    }

    const curve = this.animationService.createCurve(from, to);
    const color = new THREE.Color(from.color);
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 20, 16),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 })
    );
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 20, 16),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    mesh.add(glow);
    mesh.position.copy(curve.getPoint(0));
    this.scene.add(mesh);
    this.signals.push({ mesh, glow, curve, startTime: performance.now(), duration: 1100 });

    if (this.signals.length > 10) {
      const stale = this.signals.shift();
      if (stale) {
        this.scene.remove(stale.mesh);
      }
    }
  }

  private animate = (): void => {
    this.animationFrame = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    const elapsed = this.clock.elapsedTime;
    // Frame-rate independent smoothing factor for all eased properties.
    const smoothing = 1 - Math.exp(-delta * 9);

    if (this.introActive) {
      const progress = Math.min(1, (performance.now() - this.introStart) / INTRO_DURATION_MS);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.camera.position.z = this.introFromZ + (this.introToZ - this.introFromZ) * eased;
      if (progress >= 1) {
        this.introActive = false;
      }
    }

    this.controls.update();
    if (this.particles && !this.reducedMotion) {
      this.particles.rotation.y = elapsed * 0.03;
      this.particles.rotation.x = Math.sin(elapsed * 0.18) * 0.04;
    }

    this.easeRegions(elapsed, smoothing);
    this.easePathways(elapsed, smoothing);
    if (this.shellGlow) {
      this.shellGlow.uniforms['uIntensity'].value = this.reducedMotion
        ? 0.5
        : 0.46 + Math.sin(elapsed * 0.9) * 0.1;
    }

    const now = performance.now();
    this.signals = this.signals.filter((signal) => {
      const progress = Math.min(1, (now - signal.startTime) / signal.duration);
      const envelope = Math.sin(progress * Math.PI);
      signal.mesh.position.copy(signal.curve.getPoint(progress));
      signal.mesh.scale.setScalar(1 + envelope * 1.4);
      (signal.mesh.material as THREE.MeshBasicMaterial).opacity = 0.35 + envelope * 0.6;
      (signal.glow.material as THREE.MeshBasicMaterial).opacity = envelope * 0.34;
      if (progress >= 1) {
        this.scene.remove(signal.mesh);
        return false;
      }
      return true;
    });

    if (this.controls.autoRotate || this.introActive) {
      this.updateHover();
    }
    this.updateLabels();
    this.renderer.render(this.scene, this.camera);
  };

  private easeRegions(elapsed: number, smoothing: number): void {
    this.regionMeshes.forEach((mesh, id) => {
      const material = mesh.material as THREE.MeshStandardMaterial;
      const active = this.currentStep?.regionId === id;
      const selected = this.selectedRegionId === id;
      const hovered = this.hoveredRegion()?.id === id;

      let targetScale = active ? 1.85 : selected ? 1.55 : hovered ? 1.35 : 1;
      let targetEmissive = active ? 3.2 : selected ? 2.4 : hovered ? 2 : 1.1;
      let targetHalo = active ? 0.95 : selected ? 0.7 : hovered ? 0.6 : 0.32;
      if (active && !this.reducedMotion) {
        targetScale *= 1 + Math.sin(elapsed * 5) * 0.05;
        targetEmissive += Math.sin(elapsed * 5) * 0.4;
        targetHalo += Math.sin(elapsed * 5) * 0.15;
      }

      const eased = mesh.scale.x + (targetScale - mesh.scale.x) * smoothing;
      mesh.scale.setScalar(eased);
      material.emissiveIntensity += (targetEmissive - material.emissiveIntensity) * smoothing;

      const halo = this.regionGlows.get(id);
      if (halo) {
        halo.uniforms['uIntensity'].value += (targetHalo - halo.uniforms['uIntensity'].value) * smoothing;
      }
    });
  }

  private easePathways(elapsed: number, smoothing: number): void {
    this.pathwayObjects.forEach(({ material, targetOpacity, targetPulse, targetColor }) => {
      const uniforms = material.uniforms;
      uniforms['uTime'].value = this.reducedMotion ? 0 : elapsed;
      uniforms['uOpacity'].value += (targetOpacity - uniforms['uOpacity'].value) * smoothing;
      uniforms['uPulse'].value += ((this.reducedMotion ? 0 : targetPulse) - uniforms['uPulse'].value) * smoothing;
      (uniforms['uColor'].value as THREE.Color).lerp(targetColor, smoothing);
    });
  }

  private updateLabels(): void {
    if (!this.camera || this.regionMeshes.size === 0) {
      return;
    }

    // Skip the signal write (and the change-detection cycle it schedules)
    // on frames where neither the camera nor any highlight state changed.
    const key =
      this.camera.matrixWorld.elements.join(',') +
      `|${this.currentStep?.regionId}|${this.selectedRegionId}|${this.hoveredRegion()?.id}|${this.labelsVisible}`;
    if (key === this.lastLabelKey) {
      return;
    }
    this.lastLabelKey = key;

    const bounds = this.stageRef.nativeElement.getBoundingClientRect();
    const labels = [...this.regionMeshes.entries()].map(([id, mesh]) => {
      const position = mesh.position.clone().project(this.camera);
      const region = mesh.userData.region;
      const active = this.currentStep?.regionId === id;
      const selected = this.selectedRegionId === id;
      const hovered = this.hoveredRegion()?.id === id;
      return {
        id,
        name: region.name,
        color: region.color,
        x: (position.x * 0.5 + 0.5) * bounds.width,
        y: (-position.y * 0.5 + 0.5) * bounds.height,
        depth: position.z,
        visible: (this.labelsVisible || active || selected || hovered) && position.z < 1,
        active,
        selected,
        hovered
      };
    });
    this.labels.set(labels);
  }

  private resize(): void {
    const bounds = this.stageRef.nativeElement.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) {
      return;
    }
    this.camera.aspect = bounds.width / bounds.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(bounds.width, bounds.height);
  }
}
