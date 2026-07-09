import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      {
        path: 'overview',
        loadComponent: () => import('./features/overview/overview').then((m) => m.OverviewComponent)
      },
      {
        path: 'information-flow',
        loadComponent: () => import('./features/information-flow/information-flow').then((m) => m.InformationFlowComponent)
      },
      {
        path: 'memory',
        loadComponent: () => import('./features/memory/memory').then((m) => m.MemoryComponent)
      },
      {
        path: 'decision-making',
        loadComponent: () => import('./features/decision-making/decision-making').then((m) => m.DecisionMakingComponent)
      },
      {
        path: 'simulation',
        loadComponent: () => import('./features/simulation/simulation').then((m) => m.SimulationComponent)
      },
      { path: '**', redirectTo: 'overview' }
    ]
  }
];
