import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { OperatorShellComponent } from './pages/operator/operator-shell.component';
import { OperatorDashboardComponent } from './pages/operator/dashboard/operator-dashboard.component';
import { OperatorDemandComponent } from './pages/operator/demand/operator-demand.component';
import { OperatorCrowdComponent } from './pages/operator/crowd/operator-crowd.component';
import { OperatorInterventionsComponent } from './pages/operator/interventions/operator-interventions.component';
import { OperatorReportsComponent } from './pages/operator/reports/operator-reports.component';

import { VisitorShellComponent } from './pages/visitor/visitor-shell.component';
import { VisitorHomeComponent } from './pages/visitor/home/visitor-home.component';
import { VisitorLiveComponent } from './pages/visitor/live/visitor-live.component';
import { VisitorPlanComponent } from './pages/visitor/plan/visitor-plan.component';
import { VisitorProfileComponent } from './pages/visitor/profile/visitor-profile.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'operator',
    component: OperatorShellComponent,
    children: [
      { path: '', component: OperatorDashboardComponent },
      { path: 'dashboard', redirectTo: '', pathMatch: 'full' },
      { path: 'demand', component: OperatorDemandComponent },
      { path: 'crowd', component: OperatorCrowdComponent },
      { path: 'interventions', component: OperatorInterventionsComponent },
      { path: 'reports', component: OperatorReportsComponent }
    ]
  },
  {
    path: 'visitor',
    component: VisitorShellComponent,
    children: [
      { path: '', component: VisitorHomeComponent },
      { path: 'live', component: VisitorLiveComponent },
      { path: 'plan', component: VisitorPlanComponent },
      { path: 'profile', component: VisitorProfileComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
