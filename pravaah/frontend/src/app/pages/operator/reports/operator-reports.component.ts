import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { SocketService } from '../../../services/socket.service';
import { EventService } from '../../../services/event.service';
import { VisitorReport, EmergencyReport } from '../../../models/pravaah.models';

@Component({
  selector: 'app-operator-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reports-container">
      <div class="header-section">
        <h1 class="page-title">Live Field Reports & Emergency SOS Feed</h1>
        <p class="page-subtitle">Real-time distress signals (SOS, I'm Stuck) and crowd condition reports from visitors</p>
      </div>

      <div class="reports-grid">
        <!-- Left: SOS & Stuck Emergencies -->
        <div class="col-card">
          <div class="col-head">
            <h2 class="col-title text-risk-critical">Emergency SOS & Distress Queue ({{ emergencies.length }})</h2>
            <span class="live-pulse-badge">REAL-TIME SOCKET.IO</span>
          </div>

          <div class="items-list">
            <div *ngFor="let em of emergencies" class="emergency-item">
              <div class="em-top">
                <span class="em-type badge badge-critical">{{ em.emergencyType }}</span>
                <span class="em-time">{{ em.createdAt | date:'HH:mm:ss' }}</span>
              </div>
              <p class="em-user">User: <strong>{{ em.userName || em.userId }}</strong></p>
              <p class="em-coords">Coordinates: {{ em.latitude | number:'1.4-4' }}, {{ em.longitude | number:'1.4-4' }}</p>
              <p class="em-notes">{{ em.notes }}</p>
              <div class="em-actions">
                <button type="button" class="btn-dispatch" (click)="dispatchRescue(em)">
                  Dispatch Nearest Emergency Post
                </button>
                <span *ngIf="em.status === 'DISPATCHED'" class="badge badge-low">DISPATCHED</span>
              </div>
            </div>

            <div *ngIf="!emergencies.length" class="empty-box">
              No active distress signals. Normal field operations.
            </div>
          </div>
        </div>

        <!-- Right: Visitor Crowd Reports -->
        <div class="col-card">
          <div class="col-head">
            <h2 class="col-title">Visitor Crowd Reports ({{ reports.length }})</h2>
            <span class="subtext">Crowdsourced Intelligence</span>
          </div>

          <div class="items-list">
            <div *ngFor="let rep of reports" class="report-item">
              <div class="rep-top">
                <span class="rep-cat badge badge-medium">{{ rep.category }}</span>
                <span class="rep-time">{{ rep.createdAt | date:'shortTime' }}</span>
              </div>
              <p class="rep-desc">"{{ rep.description }}"</p>
              <div class="rep-footer">
                <span>By: {{ rep.userName || rep.userId }}</span>
                <span class="text-muted">Loc: {{ rep.latitude | number:'1.3-3' }}, {{ rep.longitude | number:'1.3-3' }}</span>
              </div>
            </div>

            <div *ngIf="!reports.length" class="empty-box">
              No visitor reports submitted yet for this event.
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .header-section { display: flex; flex-direction: column; gap: 0.2rem; }
    .page-title { font-size: 1.15rem; font-weight: 600; color: var(--foreground); }
    .page-subtitle { font-size: 0.78rem; color: var(--foreground-muted); }

    .reports-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
    @media (min-width: 1024px) {
      .reports-grid { grid-template-columns: 1fr 1fr; }
    }

    .col-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1.25rem;
    }

    .col-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .col-title { font-size: 0.88rem; font-weight: 600; }
    .live-pulse-badge { font-size: 0.65rem; font-weight: 700; color: var(--risk-critical); letter-spacing: 0.05em; }
    .subtext { font-size: 0.7rem; color: var(--foreground-muted); }

    .items-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .emergency-item {
      background: rgba(239, 68, 68, 0.06);
      border: 1px solid var(--risk-critical);
      border-radius: 0.65rem;
      padding: 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .em-top { display: flex; justify-content: space-between; align-items: center; }
    .em-time { font-size: 0.68rem; color: var(--foreground-muted); }
    .em-user { font-size: 0.8rem; }
    .em-coords { font-size: 0.72rem; color: var(--foreground-muted); font-family: var(--font-mono); }
    .em-notes { font-size: 0.75rem; color: var(--foreground); margin-top: 0.2rem; }
    .em-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 0.5rem; }
    .btn-dispatch {
      padding: 5px 12px;
      background: var(--risk-critical);
      color: #fff;
      font-size: 0.72rem;
      font-weight: 600;
      border-radius: 4px;
    }

    .report-item {
      background: var(--surface-muted);
      border: 1px solid var(--border);
      border-radius: 0.65rem;
      padding: 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .rep-top { display: flex; justify-content: space-between; align-items: center; }
    .rep-desc { font-size: 0.8rem; line-height: 1.4; color: var(--foreground); }
    .rep-footer { display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--foreground-muted); margin-top: 0.25rem; }

    .empty-box { font-size: 0.78rem; color: var(--foreground-muted); font-style: italic; padding: 1rem 0; }
  `]
})
export class OperatorReportsComponent implements OnInit, OnDestroy {
  emergencies: EmergencyReport[] = [];
  reports: VisitorReport[] = [];
  private subs = new Subscription();

  constructor(
    private http: HttpClient,
    private socketService: SocketService,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    this.fetchReports();

    // Real-time SOS alerts via Socket.IO
    this.subs.add(
      this.socketService.emergencySos$.subscribe((data) => {
        this.emergencies.unshift(data);
      })
    );

    this.subs.add(
      this.socketService.emergencyStuck$.subscribe((data) => {
        this.emergencies.unshift(data);
      })
    );

    this.subs.add(
      this.socketService.crowdUpdate$.subscribe((data) => {
        if (data && data.report) {
          this.reports.unshift(data.report);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  fetchReports(): void {
    const eventId = this.eventService.activeEventSubject?.value?.id || 'maha-kumbh';
    this.http.get<any>(`http://localhost:5000/api/emergency?eventId=${eventId}`).subscribe(res => {
      if (res && res.emergencies) this.emergencies = res.emergencies;
    });

    this.http.get<any>(`http://localhost:5000/api/crowd/reports?eventId=${eventId}`).subscribe(res => {
      if (res && res.reports) this.reports = res.reports;
    });
  }

  dispatchRescue(em: EmergencyReport): void {
    em.status = 'DISPATCHED';
  }
}
