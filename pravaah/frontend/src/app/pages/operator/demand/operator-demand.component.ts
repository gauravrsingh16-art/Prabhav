import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventService } from '../../../services/event.service';

@Component({
  selector: 'app-operator-demand',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="demand-container">
      <div class="header-section">
        <h1 class="page-title">Destination-Wide Demand Distribution</h1>
        <p class="page-subtitle">Real-time demand, capacity and forecast across all zones — simulated scenario</p>
      </div>

      <!-- Pipeline Stepper -->
      <div class="pipeline-bar">
        <div class="pipeline-step"><div class="step-content"><p class="step-name">Observed</p><p class="step-desc">Site-camera feeds</p></div><svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></div>
        <div class="pipeline-step active"><div class="step-content"><p class="step-name">Forecast</p><p class="step-desc">Projected pressure</p></div><svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></div>
        <div class="pipeline-step"><div class="step-content"><p class="step-name">Recommended</p><p class="step-desc">Suggested response</p></div><svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></div>
        <div class="pipeline-step"><div class="step-content"><p class="step-name">Action</p><p class="step-desc">Organiser approves</p></div><svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></div>
        <div class="pipeline-step"><div class="step-content"><p class="step-name">Outcome</p><p class="step-desc">Measured change</p></div></div>
      </div>

      <div class="content-grid">
        <div class="left-col">
          <!-- Zone Demand Table -->
          <div class="table-card">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Visitors</th>
                  <th>Accommodation</th>
                  <th>Crowd</th>
                  <th>Transport</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let zn of (eventService.zones$ | async)">
                  <td class="font-medium">{{ zn.name }}</td>
                  <td class="tabular-nums text-muted">{{ (zn.currentOccupancy / 1000) | number:'1.1-1' }}K</td>
                  <td class="tabular-nums text-muted">
                    {{ zn.accommodationPressure || zn.pressurePercent }}% 
                    <span class="free-text">({{ 100 - (zn.accommodationPressure || zn.pressurePercent) }}% free)</span>
                  </td>
                  <td class="tabular-nums text-muted">{{ zn.pressurePercent }}%</td>
                  <td class="tabular-nums text-muted">{{ zn.pressurePercent + 8 }}%</td>
                  <td>
                    <span class="badge" [ngClass]="getBadgeClass(zn.status)">
                      <span class="dot"></span>{{ zn.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Forecast Grid (Next 20 min) -->
          <div class="forecast-card">
            <h2 class="section-heading">Forecast (next 20 min) — if nothing changes</h2>
            <div class="forecast-zones-list">
              <div *ngFor="let zn of (eventService.zones$ | async)" class="zone-forecast-item">
                <p class="zone-title">{{ zn.name }}</p>
                <div class="forecast-blocks">
                  <div class="f-block">
                    <p class="f-time">Now</p>
                    <p class="f-val">{{ zn.pressurePercent }}%</p>
                    <span class="badge" [ngClass]="getBadgeClass(zn.status)"><span class="dot"></span>{{ zn.status }}</span>
                  </div>
                  <div class="f-block">
                    <p class="f-time">+10 min</p>
                    <p class="f-val">{{ zn.pressurePercent + 6 }}%</p>
                    <span class="badge" [ngClass]="getBadgeClass(zn.pressurePercent + 6 > 60 ? 'HIGH' : 'MODERATE')">
                      <span class="dot"></span>{{ zn.pressurePercent + 6 > 60 ? 'High' : 'Moderate' }}
                    </span>
                  </div>
                  <div class="f-block">
                    <p class="f-time">+20 min</p>
                    <p class="f-val text-risk-high">{{ zn.pressurePercent + 12 }}%</p>
                    <span class="badge badge-high"><span class="dot"></span>High</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Transport Capacity List -->
          <div class="transport-card">
            <h2 class="section-heading">Transport Capacity Utilization</h2>
            <div class="transport-items">
              <div *ngFor="let tr of (eventService.transport$ | async)" class="tr-row">
                <div class="tr-info">
                  <p class="tr-name">{{ tr.name }}</p>
                  <p class="tr-sub">{{ (tr.capacityPerHour * tr.utilizationPercent / 100) | number:'1.0-0' }} / {{ tr.capacityPerHour | number }} per hour</p>
                </div>
                <div class="tr-metric">
                  <span class="tr-pct">{{ tr.utilizationPercent }}%</span>
                  <span class="badge" [class.badge-high]="tr.utilizationPercent > 65" [class.badge-medium]="tr.utilizationPercent <= 65">
                    <span class="dot"></span>{{ tr.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="right-col">
          <div class="side-panel">
            <h2 class="section-heading">Recommended Intervention</h2>
            <div *ngIf="(eventService.demoState$ | async) === 'spike'" class="rec-alert-box">
              <p class="rec-headline">Gate 2 Overcapacity Alert</p>
              <p class="rec-body">Central Zone transport shuttles reaching 82% peak load. Recommend routing to Gate 3.</p>
              <button class="approve-btn" (click)="eventService.approveResponse()">Execute Diversion</button>
            </div>
            <p *ngIf="(eventService.demoState$ | async) !== 'spike'" class="empty-note">
              No destination redistribution required at current visitor arrival rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .demand-container { display: flex; flex-direction: column; gap: 1.25rem; }
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

    .content-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
    @media (min-width: 1280px) {
      .content-grid { grid-template-columns: 1fr 340px; }
    }

    .left-col { display: flex; flex-direction: column; gap: 1rem; }
    .right-col { display: flex; flex-direction: column; gap: 1rem; }

    .table-card, .forecast-card, .transport-card, .side-panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1rem;
    }

    .section-heading { font-size: 0.85rem; font-weight: 600; margin-bottom: 0.75rem; }

    .data-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; text-align: left; }
    .data-table th { padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--border); font-size: 0.7rem; text-transform: uppercase; color: var(--foreground-muted); }
    .data-table td { padding: 0.75rem; border-bottom: 1px solid var(--border); }
    .free-text { font-size: 0.7rem; opacity: 0.7; }

    .forecast-zones-list { display: flex; flex-direction: column; gap: 0.85rem; }
    .zone-title { font-size: 0.75rem; font-weight: 500; color: var(--foreground-muted); margin-bottom: 0.35rem; }
    .forecast-blocks { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
    .f-block {
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      padding: 0.6rem;
      text-align: center;
      background: var(--surface-muted);
    }
    .f-time { font-size: 0.68rem; color: var(--foreground-muted); }
    .f-val { font-size: 1.1rem; font-weight: 700; margin: 0.2rem 0; }

    .transport-items { display: flex; flex-direction: column; gap: 0.65rem; }
    .tr-row { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
    .tr-name { font-size: 0.8rem; font-weight: 500; }
    .tr-sub { font-size: 0.7rem; color: var(--foreground-muted); }
    .tr-metric { display: flex; align-items: center; gap: 0.5rem; }
    .tr-pct { font-size: 0.82rem; font-weight: 600; }

    .rec-alert-box { background: var(--risk-high-bg); border: 1px solid var(--risk-high); border-radius: 0.5rem; padding: 0.75rem; }
    .rec-headline { font-size: 0.8rem; font-weight: 600; color: var(--risk-high); }
    .rec-body { font-size: 0.72rem; color: var(--foreground-muted); margin: 0.25rem 0 0.5rem; }
    .approve-btn { width: 100%; padding: 6px; background: #3b82f6; color: #fff; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
    .empty-note { font-size: 0.75rem; color: var(--foreground-muted); font-style: italic; }
  `]
})
export class OperatorDemandComponent {
  constructor(public eventService: EventService) {}

  getBadgeClass(status: string): string {
    if (status === 'HIGH' || status === 'EMERGENCY') return 'badge-high';
    if (status === 'MODERATE') return 'badge-medium';
    return 'badge-low';
  }
}
