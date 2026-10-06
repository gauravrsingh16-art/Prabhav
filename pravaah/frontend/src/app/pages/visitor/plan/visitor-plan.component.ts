import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventService } from '../../../services/event.service';

@Component({
  selector: 'app-visitor-plan',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="visitor-plan-container animate-page-in">
      <div class="plan-header">
        <h1 class="plan-title">Optimized Itinerary</h1>
        <p class="plan-sub">Balanced for low queue times and safe movement</p>
      </div>

      <!-- Event Focus Card -->
      <div class="focus-event-card">
        <p class="focus-event-name">{{ (eventService.activeEvent$ | async)?.name }}</p>
        <p class="focus-event-meta">{{ (eventService.activeEvent$ | async)?.location }}</p>
        <div class="status-row">
          <span class="badge badge-low">All transit lines operational</span>
          <span class="est-wait">Optimal arrival: 05:30 AM</span>
        </div>
      </div>

      <!-- Step by step journey segments -->
      <div class="timeline-steps">
        <!-- Step 1: Transit -->
        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-info">
            <span class="step-tag">TRANSIT INBOUND</span>
            <h3 class="step-heading">Shuttle S3 — North Line</h3>
            <p class="step-notes">Low crowding (52% capacity). Board at North Interchange, departs every 4 minutes.</p>
          </div>
        </div>

        <!-- Step 2: Gate Ingress -->
        <div class="step-card active-step">
          <div class="step-number">2</div>
          <div class="step-info">
            <span class="step-tag tag-rec">RECOMMENDED ENTRY</span>
            <h3 class="step-heading">Gate 3 (North Causeway)</h3>
            <p class="step-notes">4 min queue time. Avoids congested Gate 2 (Sangam Direct) where wait times exceed 25 min.</p>
          </div>
        </div>

        <!-- Step 3: Ceremony Schedule -->
        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-info">
            <span class="step-tag">EVENT SCHEDULE</span>
            <h3 class="step-heading">Morning Snan (Holy Bath)</h3>
            <p class="step-notes">Scheduled for 05:00 AM. Low impact predicted along the North corridor.</p>
          </div>
        </div>

        <!-- Step 4: Safe Egress -->
        <div class="step-card">
          <div class="step-number">4</div>
          <div class="step-info">
            <span class="step-tag">PLANNED EGRESS</span>
            <h3 class="step-heading">East Pontoon Dispersal</h3>
            <p class="step-notes">Gradual exit route with designated medical posts and water stations.</p>
          </div>
        </div>
      </div>

      <div class="action-wrap">
        <a routerLink="/visitor/live" class="start-journey-btn">
          Start Live Guided Journey →
        </a>
      </div>
    </div>
  `,
  styles: [`
    .visitor-plan-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding: 1.25rem 1.25rem 2rem;
    }

    .plan-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--foreground);
    }
    .plan-sub {
      font-size: 0.8rem;
      color: var(--foreground-muted);
      margin-top: 0.15rem;
    }

    .focus-event-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .focus-event-name { font-size: 0.95rem; font-weight: 700; color: var(--foreground); }
    .focus-event-meta { font-size: 0.75rem; color: var(--foreground-muted); }
    .status-row { display: flex; align-items: center; justify-content: space-between; margin-top: 0.5rem; flex-wrap: wrap; gap: 0.5rem; }
    .est-wait { font-size: 0.72rem; color: var(--foreground-muted); font-weight: 500; }

    .timeline-steps {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .step-card {
      display: flex;
      gap: 0.85rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0.85rem;
      padding: 0.85rem;
    }

    .step-card.active-step {
      border-color: rgba(34, 197, 94, 0.5);
      background: rgba(34, 197, 94, 0.04);
    }

    .step-number {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--surface-muted);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .step-info {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .step-tag { font-size: 0.65rem; font-weight: 700; color: var(--foreground-muted); letter-spacing: 0.05em; }
    .tag-rec { color: var(--risk-low); }
    .step-heading { font-size: 0.85rem; font-weight: 600; color: var(--foreground); }
    .step-notes { font-size: 0.73rem; color: var(--foreground-muted); line-height: 1.4; }

    .action-wrap {
      margin-top: 0.5rem;
    }

    .start-journey-btn {
      display: block;
      width: 100%;
      padding: 12px;
      text-align: center;
      background: #3b82f6;
      color: #fff;
      font-size: 0.85rem;
      font-weight: 700;
      border-radius: 0.75rem;
    }
  `]
})
export class VisitorPlanComponent {
  constructor(public eventService: EventService) {}
}
