import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { EventService } from '../../../services/event.service';
import { GeolocationService } from '../../../services/geolocation.service';
import { MegaEvent, EventLocation, Zone, Gate, CameraFeed, TransportPoint, EmergencyPoint, AlertItem } from '../../../models/pravaah.models';

@Component({
  selector: 'app-operator-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <!-- 1. Top 5 Metric Cards -->
      <div class="metrics-grid">
        <div class="metric-card">
          <p class="metric-label">Overall Pressure</p>
          <p class="metric-val" [ngClass]="getPressureClass(eventService.overallPressure$.value)">
            {{ (eventService.overallPressure$ | async) }}%
          </p>
        </div>

        <div class="metric-card">
          <p class="metric-label">Visitor Demand</p>
          <p class="metric-val text-foreground">
            {{ (eventService.visitorDemand$ | async) }}
          </p>
        </div>

        <div class="metric-card">
          <p class="metric-label">Transport Utilization</p>
          <p class="metric-val text-risk-medium">
            {{ (eventService.transportUtilization$ | async) }}%
          </p>
        </div>

        <div class="metric-card">
          <p class="metric-label">Venue Occupancy</p>
          <p class="metric-val text-risk-medium">
            {{ (eventService.venueOccupancy$ | async) }}%
          </p>
        </div>

        <div class="metric-card">
          <p class="metric-label">Critical Alerts</p>
          <p class="metric-val" [class.text-risk-low]="(eventService.criticalAlerts$ | async) === 0" [class.text-risk-critical]="(eventService.criticalAlerts$ | async)! > 0">
            {{ (eventService.criticalAlerts$ | async) }}
          </p>
          <p class="metric-sub" *ngIf="(eventService.criticalAlerts$ | async) === 0">All clear</p>
          <p class="metric-sub text-risk-critical" *ngIf="(eventService.criticalAlerts$ | async)! > 0">Attention Required</p>
        </div>
      </div>

      <!-- 2. Decision Pipeline Stepper -->
      <div class="pipeline-bar">
        <div class="pipeline-step" [class.active]="(eventService.currentStep$ | async) === 'observed'">
          <div class="step-content">
            <p class="step-name">Observed</p>
            <p class="step-desc">Site-camera feeds</p>
          </div>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
        </div>

        <div class="pipeline-step" [class.active]="(eventService.currentStep$ | async) === 'forecast'">
          <div class="step-content">
            <p class="step-name">Forecast</p>
            <p class="step-desc">Projected pressure</p>
          </div>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
        </div>

        <div class="pipeline-step" [class.active]="(eventService.currentStep$ | async) === 'recommended'">
          <div class="step-content">
            <p class="step-name">Recommended</p>
            <p class="step-desc">Suggested response</p>
          </div>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
        </div>

        <div class="pipeline-step" [class.active]="(eventService.currentStep$ | async) === 'action'">
          <div class="step-content">
            <p class="step-name">Action</p>
            <p class="step-desc">Organiser approves</p>
          </div>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
        </div>

        <div class="pipeline-step" [class.active]="(eventService.currentStep$ | async) === 'outcome'">
          <div class="step-content">
            <p class="step-name">Outcome</p>
            <p class="step-desc">Measured change</p>
          </div>
        </div>
      </div>

      <!-- 3. Two-Column Operational Layout -->
      <div class="main-content-grid">
        <!-- Left Section: Interactive Real Leaflet Map & Accommodation -->
        <div class="left-col">
          <!-- Real Interactive Leaflet Map Card -->
          <div class="map-card">
            <!-- Layer Selector Header -->
            <div class="layer-header">
              <span class="layer-title">Layers</span>

              <button 
                type="button" 
                class="layer-toggle"
                [class.active]="layers.zones"
                (click)="toggleLayer('zones')">
                <svg class="layer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
                </svg>
                Zones
              </button>

              <button 
                type="button" 
                class="layer-toggle"
                [class.active]="layers.gates"
                (click)="toggleLayer('gates')">
                <svg class="layer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 20H2"/><path d="M11 4.562v16.157a1 1 0 0 0 1.242.97L19 20V5.562a2 2 0 0 0-1.515-1.94l-4-1A2 2 0 0 0 11 4.561z"/><path d="M11 4H8a2 2 0 0 0-2 2v14"/><path d="M14 12h.01"/><path d="M22 20h-3"/>
                </svg>
                Venue & gates
              </button>

              <button 
                type="button" 
                class="layer-toggle"
                [class.active]="layers.transport"
                (click)="toggleLayer('transport')">
                <svg class="layer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
                </svg>
                Transport
              </button>

              <button 
                type="button" 
                class="layer-toggle"
                [class.active]="layers.cameras"
                (click)="toggleLayer('cameras')">
                <svg class="layer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/>
                </svg>
                Cameras
              </button>

              <button 
                type="button" 
                class="layer-toggle"
                [class.active]="layers.emergency"
                (click)="toggleLayer('emergency')">
                <svg class="layer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2v20M2 12h20"/>
                </svg>
                Emergency
              </button>

              <!-- Live GPS Status -->
              <span class="gps-status-pill" [class.available]="(geoService.status$ | async) === 'AVAILABLE'">
                <span class="dot"></span>
                <span>GPS: {{ (geoService.status$ | async) === 'AVAILABLE' ? 'TRACKING' : 'DENIED/UNAVAIL' }}</span>
              </span>
            </div>

            <!-- Leaflet Map Canvas -->
            <div #mapContainer class="map-viewport"></div>

            <!-- Map Bottom Legend -->
            <div class="map-legend">
              <span class="legend-title">Crowd pressure:</span>
              <span class="legend-item"><span class="legend-dot bg-low"></span> Low</span>
              <span class="legend-item"><span class="legend-dot bg-med"></span> Moderate</span>
              <span class="legend-item"><span class="legend-dot bg-high"></span> High</span>
              <span class="legend-item"><span class="legend-dot ring-gate"></span> Gate</span>
              <span class="legend-item"><span class="legend-dot ring-cam"></span> Camera</span>
              <span class="legend-note ml-auto">Real interactive Leaflet + OpenStreetMap engine</span>
            </div>
          </div>

          <!-- Accommodation Pressure Bars -->
          <div class="card-panel">
            <h2 class="panel-heading">Accommodation Pressure</h2>
            <div class="pressure-list">
              <div class="pressure-row" *ngFor="let zn of (eventService.zones$ | async)">
                <div class="row-header">
                  <span class="zone-name">{{ zn.name }}</span>
                  <span class="zone-pct font-semibold">{{ zn.accommodationPressure || zn.pressurePercent }}%</span>
                </div>
                <div class="progress-bar-bg">
                  <div 
                    class="progress-bar-fill" 
                    [style.width.%]="zn.accommodationPressure || zn.pressurePercent"
                    [ngClass]="getPressureBgClass(zn.accommodationPressure || zn.pressurePercent)">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Section: Alerts, Forecast, Intervention, Schedule, Video -->
        <div class="right-col">
          <!-- 1. Live Alerts Card -->
          <div class="card-panel">
            <div class="panel-head-flex">
              <h2 class="panel-heading">Live Alerts ({{ (eventService.alerts$ | async)?.length || 0 }})</h2>
              <a routerLink="/operator/crowd" class="sublink">View all</a>
            </div>

            <div class="alerts-list">
              <div 
                *ngFor="let alt of (eventService.alerts$ | async)" 
                class="alert-entry"
                [class.alert-crit]="alt.severity === 'HIGH' || alt.severity === 'CRITICAL'">
                <div class="alert-content">
                  <div class="alert-top">
                    <p class="alert-title">{{ alt.title }}</p>
                    <span class="alert-time">Just now</span>
                  </div>
                  <p class="alert-msg">{{ alt.message }}</p>
                  <div class="alert-rec" *ngIf="alt.recommendation">
                    <strong>Recommended:</strong> {{ alt.recommendation }}
                  </div>
                </div>
              </div>

              <div *ngIf="!(eventService.alerts$ | async)?.length" class="empty-notice">
                All zones within normal operating parameters.
              </div>
            </div>
          </div>

          <!-- 2. Crowd Forecast Card (Step 14) -->
          <div class="card-panel">
            <h2 class="panel-heading">Forecast (next 20 min)</h2>
            <div class="forecast-box">
              <svg class="forecast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>
              </svg>
              <div class="forecast-details">
                <p class="forecast-meta">Central Zone crowd pressure, projected</p>
                <div class="forecast-flow">
                  <span class="flow-val">{{ (eventService.demoState$ | async) === 'spike' ? '78%' : '62%' }}</span>
                  <span class="flow-lbl">now</span>
                  <span class="flow-arrow">→</span>
                  <span class="flow-val text-risk-high">{{ (eventService.demoState$ | async) === 'spike' ? '89%' : '74%' }}</span>
                  <span class="flow-lbl">in 20 min</span>
                  <span class="badge badge-high"><span class="dot"></span>High</span>
                </div>
                <p class="forecast-note">Calculated with historical ingress model · DEMO PREDICTION</p>
              </div>
            </div>
          </div>

          <!-- 3. Recommended Intervention Card (Step 23 & 24) -->
          <div class="card-panel">
            <h2 class="panel-heading">Recommended Intervention</h2>
            <div *ngIf="(eventService.demoState$ | async) === 'spike'" class="active-intervention-box">
              <p class="rec-title">Redirect arrivals to Gate 3</p>
              <p class="rec-desc">Gate 2 wait time is 28 min. Divert incoming cohort to Gate 3 (wait time 4 min).</p>
              <button 
                type="button" 
                class="approve-btn"
                (click)="eventService.approveResponse()">
                Approve & Execute Intervention
              </button>
            </div>
            <div *ngIf="(eventService.demoState$ | async) === 'intervened'" class="outcome-box">
              <p class="outcome-title">Outcome Measured (OBSERVE ➔ ACT ➔ MEASURE)</p>
              <div class="outcome-diff">
                <div class="diff-col">
                  <span>BEFORE:</span>
                  <strong class="text-risk-high">Gate 2: HIGH (28m)</strong>
                </div>
                <span class="arrow">➔</span>
                <div class="diff-col">
                  <span>AFTER:</span>
                  <strong class="text-risk-low">Gate 2: MODERATE (7m)</strong>
                </div>
              </div>
              <p class="outcome-summary">
                Intervention: Redirected visitors to Gate 3. Ingress velocity stabilized.
              </p>
            </div>
            <div *ngIf="(eventService.demoState$ | async) === 'normal'" class="empty-notice">
              No intervention recommended — all zones are within normal operating parameters.
            </div>
          </div>

          <!-- 4. Event Schedule Card -->
          <div class="card-panel">
            <h2 class="panel-heading">Event Schedule</h2>
            <div class="schedule-list">
              <div *ngFor="let sc of (eventService.activeEvent$ | async)?.schedule" class="schedule-item">
                <div class="schedule-icon-wrap">
                  <svg class="schedule-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 14v2.2l1.6 1"/><path d="M16 2v3"/><path d="M21 7.338V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2.338"/><path d="M3 9h5.859"/><path d="M8 2v3"/><circle cx="16" cy="16" r="6"/>
                  </svg>
                </div>
                <div class="schedule-info">
                  <div class="schedule-top">
                    <span class="schedule-title">{{ sc.title }}</span>
                    <span class="schedule-time">{{ sc.time }}</span>
                  </div>
                  <div class="schedule-bottom">
                    <span class="badge" [class.badge-low]="sc.expectedImpact === 'low'" [class.badge-high]="sc.expectedImpact === 'high'">
                      {{ sc.expectedImpact }} impact
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 5. Event Video (Step 7: Distinct from live cameras!) -->
          <div class="card-panel event-video-panel">
            <div class="panel-head-flex">
              <div>
                <h2 class="panel-heading">Event Video</h2>
                <span class="video-label-chip">RECORDED EVENT VIDEO</span>
              </div>
              <span class="video-sub">Prerecorded Venue Overview</span>
            </div>
            <div class="video-player-container">
              <video 
                #eventVideoPlayer
                [src]="(eventService.activeVideo$ | async)?.videoUrl" 
                class="video-element"
                controls
                playsinline>
              </video>
            </div>
            <p class="video-description">
              {{ (eventService.activeVideo$ | async)?.description }}
            </p>
          </div>
        </div>
      </div>

      <!-- 4. Live Camera Feeds Section (Step 7: Separate from Event Video) -->
      <div class="cameras-section" *ngIf="(eventService.activeEvent$ | async)?.hasCameraCoverage">
        <div class="panel-head-flex mb-3">
          <h2 class="panel-heading">Live Camera Feeds</h2>
          <a routerLink="/operator/crowd" class="sublink">View All Cameras & Video Analysis →</a>
        </div>
        <div class="cameras-grid">
          <div *ngFor="let cam of (eventService.cameras$ | async)" class="camera-card">
            <div class="camera-view">
              <video [src]="cam.streamUrl" autoplay loop muted playsinline class="cam-stream"></video>
              <div class="cam-overlay-top">
                <span class="cam-id">{{ cam.cameraId }}</span>
                <span class="cam-time">09:24:15</span>
              </div>
              <div class="cam-overlay-bottom">
                <span>Flow {{ cam.lastFlowPerMin }}/min</span>
                <span>{{ cam.lastPeopleCount | number }} people</span>
                <span>{{ cam.lastDensityPercent }}% density</span>
                <span class="cam-status-pill text-risk-low">{{ cam.status }}</span>
              </div>
            </div>
            <div class="cam-meta">
              <span class="cam-name">{{ cam.name }}</span>
              <span class="badge badge-low"><span class="dot"></span>Low</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Notice for Jantar Mantar Mode (Step 20) -->
      <div *ngIf="!(eventService.activeEvent$ | async)?.hasCameraCoverage" class="no-camera-alert">
        <svg class="no-cam-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>
        </svg>
        <div>
          <strong>JANTAR MANTAR MODE — NO LIVE CROWD DATA (CAMERAS UNAVAILABLE)</strong>
          <p>Restricted airspace without CCTV/drone access. Operating on manual observer reports & aggregated visitor telemetry.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    @media (min-width: 1024px) {
      .metrics-grid {
        grid-template-columns: repeat(5, 1fr);
      }
    }

    .metric-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 0.85rem 1rem;
    }

    .metric-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--foreground-muted);
    }

    .metric-val {
      margin-top: 0.25rem;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .metric-sub {
      margin-top: 0.15rem;
      font-size: 0.72rem;
      color: var(--foreground-muted);
    }

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

    .pipeline-step {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.6rem;
      border-radius: 0.5rem;
      flex-shrink: 0;
    }

    .pipeline-step.active {
      background: var(--surface-muted);
    }

    .step-content {
      display: flex;
      flex-direction: column;
    }

    .step-name {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--foreground);
    }

    .pipeline-step:not(.active) .step-name {
      color: var(--foreground-muted);
    }

    .step-desc {
      font-size: 0.65rem;
      color: var(--foreground-muted);
      opacity: 0.7;
    }

    .chevron {
      width: 12px;
      height: 12px;
      color: var(--foreground-muted);
      opacity: 0.5;
    }

    .main-content-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    @media (min-width: 1280px) {
      .main-content-grid {
        grid-template-columns: 1fr 360px;
      }
    }

    .left-col {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .right-col {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .map-card {
      border: 1px solid var(--border);
      background: var(--surface);
      border-radius: 0.75rem;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .layer-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 0.75rem;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
      flex-wrap: wrap;
    }

    .layer-title {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--foreground-muted);
      margin-right: 0.25rem;
    }

    .layer-toggle {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 3px 9px;
      font-size: 0.72rem;
      font-weight: 500;
      color: var(--foreground-muted);
      background: var(--surface);
      transition: all 0.15s;
    }

    .layer-toggle.active {
      border-color: rgba(59, 130, 246, 0.6);
      background: var(--surface-muted);
      color: var(--foreground);
      font-weight: 600;
    }

    .layer-icon {
      width: 12px;
      height: 12px;
    }

    .gps-status-pill {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.7rem;
      color: var(--foreground-muted);
      padding: 2px 7px;
      background: var(--surface-muted);
      border-radius: 999px;
      border: 1px solid var(--border);
    }

    .gps-status-pill.available .dot {
      background: var(--risk-low);
    }

    .map-viewport {
      height: 380px;
      width: 100%;
      background: var(--surface-muted);
    }

    .map-legend {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      border-top: 1px solid var(--border);
      padding: 0.5rem 0.75rem;
      font-size: 0.7rem;
      color: var(--foreground-muted);
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .bg-low { background: var(--risk-low); }
    .bg-med { background: var(--risk-medium); }
    .bg-high { background: var(--risk-high); }
    .ring-gate { border: 1px solid currentColor; width: 7px; height: 7px; }
    .ring-cam { border: 1px solid #3b82f6; width: 7px; height: 7px; }

    .legend-note {
      font-size: 0.68rem;
      opacity: 0.75;
    }

    .card-panel {
      border: 1px solid var(--border);
      background: var(--surface);
      border-radius: 0.75rem;
      padding: 1rem;
    }

    .panel-heading {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 0.75rem;
    }

    .panel-head-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .sublink {
      font-size: 0.72rem;
      color: var(--foreground-muted);
      text-decoration: underline;
    }

    .pressure-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .row-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      margin-bottom: 0.35rem;
    }

    .progress-bar-bg {
      height: 7px;
      background: var(--surface-muted);
      border-radius: 999px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.3s ease;
    }

    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .alert-entry {
      border-left: 2px solid var(--risk-low);
      padding: 0.5rem 0 0.5rem 0.65rem;
    }

    .alert-entry.alert-crit {
      border-left-color: var(--risk-high);
    }

    .alert-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .alert-title {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--foreground);
    }

    .alert-time {
      font-size: 0.68rem;
      color: var(--foreground-muted);
    }

    .alert-msg {
      font-size: 0.73rem;
      color: var(--foreground-muted);
      margin-top: 0.15rem;
      line-height: 1.35;
    }

    .alert-rec {
      margin-top: 0.35rem;
      font-size: 0.72rem;
      padding: 3px 6px;
      background: var(--surface-muted);
      border-radius: 4px;
      color: #60a5fa;
    }

    .forecast-box {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
    }

    .forecast-icon {
      width: 18px;
      height: 18px;
      color: var(--foreground-muted);
      margin-top: 2px;
    }

    .forecast-meta {
      font-size: 0.75rem;
      color: var(--foreground-muted);
    }

    .forecast-flow {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-top: 0.25rem;
    }

    .flow-val {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--foreground);
    }

    .flow-lbl {
      font-size: 0.7rem;
      color: var(--foreground-muted);
    }

    .flow-arrow {
      color: var(--foreground-muted);
      font-size: 0.9rem;
    }

    .forecast-note {
      margin-top: 0.35rem;
      font-size: 0.65rem;
      color: var(--foreground-muted);
    }

    .active-intervention-box {
      background: var(--risk-high-bg);
      border: 1px solid var(--risk-high);
      border-radius: 0.5rem;
      padding: 0.75rem;
    }

    .rec-title {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--risk-high);
    }

    .rec-desc {
      font-size: 0.72rem;
      color: var(--foreground-muted);
      margin-top: 0.25rem;
    }

    .approve-btn {
      margin-top: 0.6rem;
      padding: 6px 12px;
      background: #3b82f6;
      color: #fff;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      width: 100%;
    }

    .outcome-box {
      background: var(--risk-low-bg);
      border: 1px solid var(--risk-low);
      border-radius: 0.5rem;
      padding: 0.75rem;
    }

    .outcome-title {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--risk-low);
    }

    .outcome-diff {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0.35rem 0;
      font-size: 0.75rem;
    }

    .outcome-summary {
      font-size: 0.7rem;
      color: var(--foreground-muted);
    }

    .empty-notice {
      font-size: 0.75rem;
      color: var(--foreground-muted);
      font-style: italic;
    }

    .schedule-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .schedule-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .schedule-icon-wrap {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--surface-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .schedule-icon {
      width: 14px;
      height: 14px;
      color: var(--foreground-muted);
    }

    .schedule-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .schedule-top {
      display: flex;
      justify-content: space-between;
      font-size: 0.78rem;
      font-weight: 500;
    }

    .schedule-time {
      font-size: 0.72rem;
      color: var(--foreground-muted);
    }

    .schedule-bottom {
      margin-top: 0.15rem;
    }

    .event-video-panel {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .video-label-chip {
      font-size: 0.62rem;
      padding: 1px 6px;
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid #3b82f6;
      border-radius: 4px;
      color: #60a5fa;
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    .video-sub {
      font-size: 0.7rem;
      color: var(--foreground-muted);
    }

    .video-player-container {
      position: relative;
      width: 100%;
      height: 170px;
      background: #000;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .video-element {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .video-description {
      font-size: 0.72rem;
      color: var(--foreground-muted);
      line-height: 1.35;
    }

    .cameras-section {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1rem;
    }

    .cameras-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    @media (min-width: 1024px) {
      .cameras-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .camera-card {
      background: var(--surface-muted);
      border: 1px solid var(--border);
      border-radius: 0.65rem;
      overflow: hidden;
    }

    .camera-view {
      position: relative;
      height: 130px;
      background: #000;
    }

    .cam-stream {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .cam-overlay-top {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      padding: 4px 6px;
      background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
      font-size: 0.65rem;
      color: #fff;
    }

    .cam-overlay-bottom {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 6px;
      background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
      font-size: 0.65rem;
      color: rgba(255,255,255,0.85);
    }

    .cam-meta {
      padding: 0.5rem 0.6rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .cam-name {
      font-size: 0.75rem;
      font-weight: 500;
    }

    .no-camera-alert {
      background: rgba(234, 179, 8, 0.1);
      border: 1px solid var(--risk-medium);
      border-radius: 0.75rem;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      color: var(--risk-medium);
      font-size: 0.8rem;
    }

    .no-cam-icon {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }
  `]
})
export class OperatorDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private map: L.Map | null = null;
  private layerGroupZones = L.layerGroup();
  private layerGroupGates = L.layerGroup();
  private layerGroupTransport = L.layerGroup();
  private layerGroupCameras = L.layerGroup();
  private layerGroupEmergency = L.layerGroup();
  private userLocationLayer = L.layerGroup();

  public layers = {
    zones: true,
    gates: true,
    transport: true,
    cameras: true,
    emergency: true
  };

  private subs = new Subscription();

  constructor(
    public eventService: EventService,
    public geoService: GeolocationService
  ) {}

  ngOnInit(): void {
    // Listen for active event changes to recenter map
    this.subs.add(
      this.eventService.activeLocation$.subscribe(loc => {
        if (loc && this.map) {
          this.map.setView([loc.latitude, loc.longitude], loc.defaultZoom || 15);
        }
      })
    );

    // Redraw map data on updates
    this.subs.add(
      this.eventService.zones$.subscribe(() => this.renderZones())
    );

    this.subs.add(
      this.eventService.gates$.subscribe(() => this.renderGates())
    );

    this.subs.add(
      this.eventService.cameras$.subscribe(() => this.renderCameras())
    );

    this.subs.add(
      this.eventService.transport$.subscribe(() => this.renderTransport())
    );

    this.subs.add(
      this.eventService.emergency$.subscribe(() => this.renderEmergency())
    );

    // Watch real user GPS location
    this.subs.add(
      this.geoService.location$.subscribe(loc => {
        if (loc && this.map) {
          this.renderUserGPS(loc);
        }
      })
    );
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap(): void {
    if (!this.mapContainer || typeof window === 'undefined') return;

    const loc = this.eventService.activeLocationSubject?.value || { latitude: 25.4294, longitude: 81.8841, defaultZoom: 14 };

    this.map = L.map(this.mapContainer.nativeElement, {
      zoomControl: true,
      attributionControl: true
    }).setView([loc.latitude, loc.longitude], loc.defaultZoom || 14);

    // Real OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · PRAVAAH'
    }).addTo(this.map);

    // Add layer groups to map
    this.layerGroupZones.addTo(this.map);
    this.layerGroupGates.addTo(this.map);
    this.layerGroupTransport.addTo(this.map);
    this.layerGroupCameras.addTo(this.map);
    this.layerGroupEmergency.addTo(this.map);
    this.userLocationLayer.addTo(this.map);

    // Initial render
    this.renderZones();
    this.renderGates();
    this.renderCameras();
    this.renderTransport();
    this.renderEmergency();

    // Check GPS
    const curGps = this.geoService.currentLocation;
    if (curGps) {
      this.renderUserGPS(curGps);
    }
  }

  public toggleLayer(key: 'zones' | 'gates' | 'transport' | 'cameras' | 'emergency'): void {
    this.layers[key] = !this.layers[key];
    if (!this.map) return;

    switch (key) {
      case 'zones':
        this.layers.zones ? this.map.addLayer(this.layerGroupZones) : this.map.removeLayer(this.layerGroupZones);
        break;
      case 'gates':
        this.layers.gates ? this.map.addLayer(this.layerGroupGates) : this.map.removeLayer(this.layerGroupGates);
        break;
      case 'transport':
        this.layers.transport ? this.map.addLayer(this.layerGroupTransport) : this.map.removeLayer(this.layerGroupTransport);
        break;
      case 'cameras':
        this.layers.cameras ? this.map.addLayer(this.layerGroupCameras) : this.map.removeLayer(this.layerGroupCameras);
        break;
      case 'emergency':
        this.layers.emergency ? this.map.addLayer(this.layerGroupEmergency) : this.map.removeLayer(this.layerGroupEmergency);
        break;
    }
  }

  private renderZones(): void {
    if (!this.map) return;
    this.layerGroupZones.clearLayers();

    const zones = this.eventService.zonesSubject?.value || [];
    zones.forEach(zone => {
      if (zone.polygonGeoJSON && zone.polygonGeoJSON.length > 2) {
        const color = zone.status === 'HIGH' ? '#ea580c' : zone.status === 'MODERATE' ? '#ca8a04' : '#16a34a';
        
        const polygon = L.polygon(zone.polygonGeoJSON as L.LatLngExpression[], {
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.18
        });

        polygon.bindTooltip(`<b>${zone.name}</b><br>Pressure: ${zone.pressurePercent}% (${zone.status})`);
        this.layerGroupZones.addLayer(polygon);

        // Center chip
        const chipIcon = L.divIcon({
          className: 'meho-map-label',
          html: `<span><div class="meho-zone-chip"><b>${zone.name}</b><em>${zone.pressurePercent}%</em></div></span>`
        });
        const centerMarker = L.marker([zone.centerLat, zone.centerLng], { icon: chipIcon, interactive: false });
        this.layerGroupZones.addLayer(centerMarker);
      }
    });
  }

  private renderGates(): void {
    if (!this.map) return;
    this.layerGroupGates.clearLayers();

    const gates = this.eventService.gatesSubject?.value || [];
    gates.forEach(gate => {
      const isCongested = gate.status === 'CONGESTED';
      const color = isCongested ? '#ef4444' : '#22c55e';

      const circle = L.circleMarker([gate.latitude, gate.longitude], {
        radius: 7,
        fillColor: color,
        color: '#ffffff',
        weight: 2,
        fillOpacity: 0.95
      });

      circle.bindTooltip(`<b>${gate.name}</b><br>Status: ${gate.status}<br>Queue: ${gate.queueTimeMinutes} min<br>Flow: ${gate.flowRatePerMin}/min`);
      this.layerGroupGates.addLayer(circle);

      const label = L.divIcon({
        className: 'meho-map-label meho-map-label--below',
        html: `<span><div class="meho-point-label">${gate.name}</div></span>`
      });
      this.layerGroupGates.addLayer(L.marker([gate.latitude, gate.longitude], { icon: label, interactive: false }));
    });
  }

  private renderCameras(): void {
    if (!this.map) return;
    this.layerGroupCameras.clearLayers();

    const cameras = this.eventService.camerasSubject?.value || [];
    cameras.forEach(cam => {
      const camMarker = L.circleMarker([cam.latitude, cam.longitude], {
        radius: 5,
        fillColor: '#3b82f6',
        color: '#ffffff',
        weight: 1.5,
        fillOpacity: 0.9
      });

      camMarker.bindTooltip(`<b>${cam.name}</b><br>Density: ${cam.lastDensityPercent}% · Flow: ${cam.lastFlowPerMin}/min`);
      this.layerGroupCameras.addLayer(camMarker);
    });
  }

  private renderTransport(): void {
    if (!this.map) return;
    this.layerGroupTransport.clearLayers();

    const transport = this.eventService.transportSubject?.value || [];
    transport.forEach(t => {
      const marker = L.circleMarker([t.latitude, t.longitude], {
        radius: 6,
        fillColor: '#8b5cf6',
        color: '#ffffff',
        weight: 1.5,
        fillOpacity: 0.9
      });
      marker.bindTooltip(`<b>${t.name}</b><br>Type: ${t.type}<br>Utilization: ${t.utilizationPercent}%`);
      this.layerGroupTransport.addLayer(marker);
    });
  }

  private renderEmergency(): void {
    if (!this.map) return;
    this.layerGroupEmergency.clearLayers();

    const emergency = this.eventService.emergencySubject?.value || [];
    emergency.forEach(em => {
      const marker = L.circleMarker([em.latitude, em.longitude], {
        radius: 6,
        fillColor: '#dc2626',
        color: '#ffffff',
        weight: 1.5,
        fillOpacity: 0.95
      });
      marker.bindTooltip(`<b>${em.name}</b><br>Type: ${em.type}<br>Contact: ${em.contactNumber || '112'}`);
      this.layerGroupEmergency.addLayer(marker);
    });
  }

  private renderUserGPS(loc: { latitude: number; longitude: number; accuracy: number }): void {
    if (!this.map) return;
    this.userLocationLayer.clearLayers();

    // Accuracy Circle
    const accCircle = L.circle([loc.latitude, loc.longitude], {
      radius: Math.max(loc.accuracy || 10, 5),
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.12,
      weight: 1
    });
    this.userLocationLayer.addLayer(accCircle);

    // Live GPS Pin
    const pin = L.circleMarker([loc.latitude, loc.longitude], {
      radius: 6,
      fillColor: '#3b82f6',
      color: '#ffffff',
      weight: 2,
      fillOpacity: 1
    });
    pin.bindTooltip('<b>Your Live Location</b><br>Accuracy: ±' + Math.round(loc.accuracy || 10) + 'm');
    this.userLocationLayer.addLayer(pin);
  }

  public getPressureClass(val: number): string {
    if (val > 75) return 'text-risk-high';
    if (val > 45) return 'text-risk-medium';
    return 'text-risk-low';
  }

  public getPressureBgClass(val: number): string {
    if (val > 75) return 'bg-risk-high';
    if (val > 45) return 'bg-risk-medium';
    return 'bg-risk-low';
  }
}
