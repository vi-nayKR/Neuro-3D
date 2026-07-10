export type SimulationStatus = 'idle' | 'running' | 'paused' | 'completed';
export type TimelineStepStatus = 'pending' | 'active' | 'completed';

export interface Vector3Tuple {
  x: number;
  y: number;
  z: number;
}

export interface BrainRegion {
  id: string;
  name: string;
  nickname?: string;
  emoji?: string;
  shortDescription: string;
  role: string;
  position: Vector3Tuple;
  color: string;
  relatedPathways: string[];
  exampleActivity: string;
}

export interface BrainPathway {
  id: string;
  from: string;
  to: string;
  label: string;
  strength: number;
}

export interface SimulationStep {
  id: string;
  order: number;
  regionId: string;
  title: string;
  description: string;
  what: string;
  why: string;
  analogy: string;
  nextRegionId?: string;
}

export interface SimulationScenario {
  id: string;
  name: string;
  category: 'visual' | 'memory-storage' | 'memory-retrieval' | 'decision';
  scenario: string;
  summary: string;
  steps: SimulationStep[];
}

export interface DecisionScenario {
  id: string;
  name: string;
  description: string;
  scenarioId: string;
  pathwayBias: string[];
  output: {
    sensoryEvidence: string;
    memoryInfluence: string;
    emotionalInfluence: string;
    logicalEvaluation: string;
    finalAction: string;
  };
}

export interface MemoryFlow {
  id: string;
  name: string;
  description: string;
  scenarioId: string;
  strength: number;
  pathwayIds: string[];
}

export interface NeuralSignal {
  id: string;
  fromRegionId: string;
  toRegionId: string;
  progress: number;
  color: string;
}

export interface TimelineStep extends SimulationStep {
  status: TimelineStepStatus;
}

export interface SimulationState {
  status: SimulationStatus;
  selectedScenarioId: string;
  currentStepIndex: number;
  speed: number;
  labelsVisible: boolean;
  pathwaysVisible: boolean;
  explanationMode: boolean;
}
