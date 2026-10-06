import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { EventService } from '../../../services/event.service';
import { Intervention } from '../../../models/pravaah.models';

@Component({
  selector: 'app-operator-interventions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="interventions-container">
      <div class="header-section">
        <h1 class="page-title">Operational Interventions & Outcome Measurement</h1>
        <p class="page-subtitle">Human-approved interventions, capacity-constrained routing, and post-action impact verification</p>
      </div>

      <!-- Pipeline Stepper Highlighted at Action & Outcome -->
      <div class="pipeline-bar">
        <div class="pipeline-step"><div class="step-content"><p class="step-name">Observed</p><p class="step-desc">Site-camera feeds</p></div><svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></div>
        <div class="pipeline-step"><div class="step-content"><p class="step-name">Forecast</p><p class="step-desc">Projected pressure</p></div><svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></div>
        <div class="pipeline-step"><div class="step-content"><p class="step-name">Recommended</p><p class="step-desc">Suggested response</p></div><svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></div>
        <div class="pipeline-step active"><div class="step-content"><p class="step-name">Action</p><p class="step-desc">Organiser approves</p></div><svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></div>
        <div class="pipeline-step active"><div class="step-content"><p class="step-name">Outcome</p><p class="step-desc">Measured change</p></div></div>
      </div>

      <div class="content-grid">
        <!-- Left: Actionable Available Interventions -->
        <div class="left-col">
          <h2 class="col-title">Configured Operational Interventions</h2>

          <!-- 1. Redirect Arrivals -->
          <div class="action-card">
            <div class="card-icon-wrap">
              <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>
              </svg>
            </div>
            <div class="card-main">
              <h3 class="card-headline">Redirect Arrivals to Gate 3</h3>
              <p class="card-text">
                Move incoming visitor cohort toward North Causeway (Gate 3) which has 85% spare throughput capacity.
              </p>
              <div class="status-callout">
                <span>Before State: <strong>Gate 2: HIGH (28m queue)</strong></span>
                <span>Expected Outcome: <strong>Gate 2: MODERATE (7m queue)</strong></span>
              </div>
              <button 
                type="button" 
                class="action-btn"
                (click)="triggerIntervention('Redirect arrivals to Gate 3', 'REDIRECT', 'Gate 2 ➔ Gate 3', 'Gate 2: HIGH', 'Gate 2: MODERATE')">
                Approve & Dispatch Rerouting
              </button>
            </div>
          </div>

          <!-- 2. Open Alternate Gate -->
          <div class="action-card">
            <div class="card-icon-wrap">
              <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 20H2"/><path d="M11 4.562v16.157a1 1 0 0 0 1.242.97L19 20V5.562a2 2 0 0 0-1.515-1.94l-4-1A2 2 0 0 0 11 4.561z"/>
              </svg>
            </div>
            <div class="card-main">
              <h3 class="card-headline">Open Alternate Gate (Gate 4 Pontoon East)</h3>
              <p class="card-text">
                Unlock auxiliary pedestrian lanes along the East pontoon to relieve Central Zone bottlenecks.
              </p>
              <div class="status-callout">
                <span>Current State: <strong>Gate 4 STANDBY</strong></span>
                <span>Expected Outcome: <strong>Flow increased by 220/min</strong></span>
              </div>
              <button 
                type="button" 
                class="action-btn"
                (click)="triggerIntervention('Open Alternate Gate 4', 'OPEN_GATE', 'Gate 4 Pontoon East', 'STANDBY', 'FULL_ACTIVE')">
                Approve Gate Opening
              </button>
            </div>
          </div>

          <!-- 3. Adjust Shuttle Frequency -->
          <div class="action-card">
            <div class="card-icon-wrap">
              <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/>
              </svg>
            </div>
            <div class="card-main">
              <h3 class="card-headline">Adjust Shuttle Bus Allocation</h3>
              <p class="card-text">
                Shift 8 fleet buses from South Connector toward Shuttle S1 Central Line to reduce passenger buildup.
              </p>
              <div class="status-callout">
                <span>Before State: <strong>S1 Shuttle: 82% Loaded</strong></span>
                <span>Expected Outcome: <strong>Load reduced to 54%</strong></span>
              </div>
              <button 
                type="button" 
                class="action-btn"
                (click)="triggerIntervention('Adjust Shuttle Allocation', 'ADVISORY', 'Shuttle S1', '82% Load', '54% Load')">
                Approve Shuttle Shift
              </button>
            </div>
          </div>

          <!-- 4. Deploy Field Assistance -->
          <div class="action-card">
            <div class="card-icon-wrap">
              <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v20M2 12h20"/>
              </svg>
            </div>
            <div class="card-main">
              <h3 class="card-headline">Deploy Rapid Crowd Marshals</h3>
              <p class="card-text">
                Dispatch 12 volunteers and police liaisons to prevent physical crowding along the central Sangam ramp.
              </p>
              <div class="status-callout">
                <span>Zone: <strong>Central Ramp Corridor</strong></span>
                <span>Deployment: <strong>12 Rapid Marshals</strong></span>
              </div>
              <button 
                type="button" 
                class="action-btn"
                (click)="triggerIntervention('Deploy Rapid Marshals', 'DISPATCH_ASSISTANCE', 'Central Ramp', 'UNMONITORED', 'DEPLOYED')">
                Dispatch Marshals
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Outcome Measurement History (Step 24) -->
        <div class="right-col">
          <div class="history-card">
            <h2 class="col-title">Outcome Measurement Log</h2>
            <p class="history-sub">Verification of completed interventions (Observe ➔ Predict ➔ Act ➔ Measure)</p>

            <div class="outcome-records">
              <div *ngFor="let item of (eventService.interventions$ | async)" class="outcome-item">
                <div class="outcome-head">
                  <span class="outcome-name">{{ item.title }}</span>
                  <span class="badge" [class.badge-low]="item.status === 'COMPLETED' || item.status === 'APPROVED'" [class.badge-medium]="item.status === 'PENDING'">
                    {{ item.status }}
                  </span>
                </div>

                <div class="outcome-delta">
                  <div class="delta-box before">
                    <span class="delta-lbl">BEFORE</span>
                    <span class="delta-val">{{ item.beforeState }}</span>
                  </div>
                  <span class="delta-arr">➔</span>
                  <div class="delta-box after">
                    <span class="delta-lbl">AFTER</span>
                    <span class="delta-val">{{ item.afterState || 'IN PROGRESS' }}</span>
                  </div>
                </div>

                <p class="outcome-summary-text" *ngIf="item.measuredOutcome">
                  <strong>Measurement:</strong> {{ item.measuredOutcome }}
                </p>

                <p class="outcome-time">
                  Recorded: {{ item.createdAt | date:'mediumTime' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .interventions-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .header-section { display: flex; flex-direction: column; gap: 0.2rem; }
    .page-title { font-size: 1.15rem; font-weight: 600; color: var(--foreground); }
    .page-subtitle { font-size: 0.78rem; color: var(--foreground-muted); }

    .pipeline-bar {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 0.5rem 0.75rem;
      overflow-x: auto;
    }
    .pipeline-step { display: flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.6rem; border-radius: 0.5rem; flex-shrink: 0; }
    .pipeline-step.active { background: var(--surface-muted); }
    .step-name { font-size: 0.72rem; font-weight: 600; color: var(--foreground); }
    .pipeline-step:not(.active) .step-name { color: var(--foreground-muted); }
    .step-desc { font-size: 0.65rem; color: var(--foreground-muted); opacity: 0.7; }
    .chevron { width: 12px; height: 12px; color: var(--foreground-muted); opacity: 0.5; }

    .content-grid { display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
    @media (min-width: 1280px) {
      .content-grid { grid-template-columns: 1fr 380px; }
    }

    .col-title { font-size: 0.88rem; font-weight: 600; color: var(--foreground); margin-bottom: 0.75rem; }
    .left-col { display: flex; flex-direction: column; gap: 0.85rem; }
    .right-col { display: flex; flex-direction: column; gap: 1rem; }

    .action-card {
      display: flex;
      gap: 0.85rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1rem;
    }
    .card-icon-wrap {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--surface-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .card-icon { width: 16px; height: 16px; color: var(--foreground); }
    .card-main { flex: 1; display: flex; flex-direction: column; gap: 0.4rem; }
    .card-headline { font-size: 0.85rem; font-weight: 600; color: var(--foreground); }
    .card-text { font-size: 0.75rem; color: var(--foreground-muted); line-height: 1.45; }

    .status-callout {
      display: flex;
      gap: 1rem;
      font-size: 0.72rem;
      background: var(--surface-muted);
      padding: 6px 10px;
      border-radius: 6px;
      color: var(--foreground-muted);
      margin: 0.25rem 0;
    }

    .action-btn {
      align-self: flex-start;
      padding: 6px 14px;
      background: #3b82f6;
      color: #fff;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 6px;
      margin-top: 0.25rem;
    }

    .history-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1rem;
    }
    .history-sub { font-size: 0.72rem; color: var(--foreground-muted); margin-bottom: 0.85rem; }

    .outcome-records { display: flex; flex-direction: column; gap: 0.85rem; }
    .outcome-item {
      border: 1px solid var(--border);
      background: var(--surface-muted);
      border-radius: 0.65rem;
      padding: 0.75rem;
    }
    .outcome-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }
    .outcome-name { font-size: 0.8rem; font-weight: 600; color: var(--foreground); }

    .outcome-delta {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      margin: 0.4rem 0;
    }
    .delta-box {
      flex: 1;
      padding: 4px 6px;
      border-radius: 4px;
      border: 1px solid var(--border);
      display: flex;
      flex-direction: column;
    }
    .delta-lbl { font-size: 0.6rem; color: var(--foreground-muted); font-weight: 700; }
    .delta-val { font-size: 0.75rem; font-weight: 600; }
    .delta-arr { font-size: 0.8rem; color: var(--foreground-muted); }

    .outcome-summary-text { font-size: 0.72rem; color: var(--foreground); margin-top: 0.35rem; line-height: 1.35; }
    .outcome-time { font-size: 0.65rem; color: var(--foreground-muted); margin-top: 0.25rem; }
  `]
})
export class OperatorInterventionsComponent {
  constructor(public eventService: EventService, private http: HttpClient) {}

  triggerIntervention(title: string, actionType: any, targetEntity: string, beforeState: string, afterState: string): void {
    const payload = {
      eventId: this.eventService.activeEventSubject?.value?.id || 'maha-kumbh',
      title,
      actionType,
      targetEntity,
      description: `Dispatched operational action: ${title}`,
      beforeState,
      afterState,
      status: 'APPROVED'
    };

    this.http.post<any>('http://localhost:5000/api/interventions', payload).subscribe({
      next: (res) => {
        if (res && res.intervention) {
          const list = this.eventService.interventionsSubject.value;
          this.eventService.interventionsSubject.next([res.intervention, ...list]);
          this.eventService.approveResponse();
        }
      },
      error: () => {
        this.eventService.approveResponse();
      }
    });
  }
}
