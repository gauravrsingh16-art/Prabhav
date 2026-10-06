import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { EventService } from '../../../services/event.service';
import { GeolocationService } from '../../../services/geolocation.service';
import { OfflineService } from '../../../services/offline.service';
import { SocketService } from '../../../services/socket.service';

export interface GateCrowdState {
  gateId: string;
  name: string;
  subname: string;
  lat: number;
  lng: number;

  appliedVideoName: string;
  appliedVideoUrl: string;
  appliedFileSize: string;
  crowdLevel: string;
  flow: string;
  status: string;
  density: string;
  color: string;
  recommendation: string;
  recommendationSub: string;
  alertMessage: string;
  analysisTimestamp: string;
  isAppliedToMap: boolean;

  defaultVideoName: string;
  defaultVideoFilename: string;
  videoSrc: string;
  fileSize: string;
  hasActiveVideo: boolean;
}

export interface RealtimeCrowdAlert {
  alertId: string;
  gateId: string;
  gateName: string;
  crowdLevel: string;
  density: string;
  title: string;
  message: string;
  recommendation: string;
  color: string;
  timestamp: string;
}

@Component({
  selector: 'app-visitor-live',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="visitor-live-container animate-page-in">
      
      <!-- Top Live Navigation & Event Bar -->
      <div class="live-header">
        <div class="lh-left">
          <a routerLink="/visitor" class="back-circle" aria-label="Back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </a>
          <div class="header-titles">
            <div class="event-selector-wrap">
              <select 
                class="event-selector-select" 
                [ngModel]="currentEventId" 
                (ngModelChange)="onEventChange($event)">
                <option value="maha-kumbh">Maha Kumbh Mela (Prayagraj)</option>
                <option value="mumbai-ganpati">Mumbai Ganpati Visarjan (Mumbai)</option>
              </select>
            </div>
            <h1 class="screen-title">Live Crowd & Safety Map</h1>
          </div>
        </div>

        <div class="lh-right">
          <span class="live-sync-pill" title="Connected to SQL Server & Socket.IO">
            <span class="sync-dot"></span> LIVE SYNC
          </span>
          <a routerLink="/operator/crowd" class="btn-goto-operator" title="Switch to Operator Console">
            Operator View →
          </a>
        </div>
      </div>

      <!-- Real-Time Floating Crowd Alert Toast (Panel 4 & 8) -->
      <div *ngIf="activeRealtimeAlert" class="realtime-alert-toast animate-slide-down" [style.border-color]="activeRealtimeAlert.color">
        <div class="rat-head">
          <div class="rat-bell-wrap" [style.background]="activeRealtimeAlert.color + '25'" [style.color]="activeRealtimeAlert.color">
            <svg viewBox="0 0 24 24" fill="currentColor" class="rat-bell-icon">
              <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
          </div>
          <div class="rat-meta">
            <span class="rat-tag" [style.color]="activeRealtimeAlert.color">CROWD ALERT</span>
            <span class="rat-time">just now</span>
          </div>
          <button type="button" class="rat-close" (click)="dismissAlert()">✕</button>
        </div>
        <strong class="rat-title">{{ activeRealtimeAlert.gateName }}</strong>
        <p class="rat-msg">{{ activeRealtimeAlert.message }}</p>
        <div class="rat-actions">
          <button type="button" class="btn-rat-view" (click)="viewAlertGateOnMap(activeRealtimeAlert.gateId)">
            View on Map
          </button>
          <button type="button" class="btn-rat-route" (click)="findSafeRouteForGateId(activeRealtimeAlert.gateId)">
            Find Safe Route
          </button>
        </div>
      </div>

      <!-- Safe Route Banner If Active -->
      <div *ngIf="safeRouteActive" class="safe-route-status animate-fade-up">
        <span class="safe-dot"></span>
        <span>{{ safeRouteBannerText }}</span>
        <button type="button" class="close-route" (click)="clearSafeRoute()">✕</button>
      </div>

      <!-- Interactive Leaflet Map Canvas -->
      <div class="live-map-wrapper">
        <div #visitorMapContainer class="visitor-map-canvas"></div>

        <!-- Floating Map Overlay Controls -->
        <div class="map-floating-overlay">
          <span class="geo-indicator" [class.active]="(geoService.status$ | async) === 'AVAILABLE'">
            <span class="dot"></span>
            {{ (geoService.status$ | async) === 'AVAILABLE' ? 'Live GPS Active' : 'Location Approx' }}
          </span>

          <div class="map-ctrl-row">
            <button type="button" class="ctrl-btn" (click)="toggleTileLayer()" [title]="currentTileType === 'satellite' ? 'Street View' : 'Satellite View'">
              {{ currentTileType === 'satellite' ? '🗺️ Street' : '🛰️ Sat' }}
            </button>
            <button type="button" class="recenter-btn" (click)="recenterMap()" title="Recenter Event Map">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="3 11 22 2 13 21 11 13 3 11"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Crowd Density Zone Legend (Bottom Right) -->
        <div class="zone-legend-box">
          <span class="zlb-title">Crowd Density</span>
          <div class="zlb-items">
            <span class="zlb-chip"><span class="zlb-dot bg-green"></span> Low</span>
            <span class="zlb-chip"><span class="zlb-dot bg-yellow"></span> Moderate</span>
            <span class="zlb-chip"><span class="zlb-dot bg-orange"></span> High</span>
            <span class="zlb-chip"><span class="zlb-dot bg-red"></span> Very High</span>
          </div>
        </div>
      </div>

      <!-- =========================================================================
           CLICKABLE ZONE / GATE DETAILS CARD (PANEL 2, 4, 6 IN MOCKUP)
           ========================================================================= -->
      <div *ngIf="selectedGate" class="zone-detail-card animate-fade-up" [style.border-color]="selectedGate.color">
        <div class="zdc-header">
          <div class="zdc-title-wrap">
            <span class="zdc-status-dot" [style.background]="selectedGate.color" [style.box-shadow]="'0 0 10px ' + selectedGate.color"></span>
            <strong class="zdc-name">{{ selectedGate.name }} – {{ selectedGate.subname }}</strong>
          </div>
          <button type="button" class="zdc-close" (click)="closeGateDetails()" title="Close details">✕</button>
        </div>

        <!-- Metrics Row -->
        <div class="zdc-metrics-row">
          <div class="zdc-badge" [style.background]="selectedGate.color + '22'" [style.border-color]="selectedGate.color" [style.color]="selectedGate.color">
            {{ getCrowdLevelBadgeText(selectedGate.crowdLevel) }}
          </div>

          <div class="zdc-stat-chip">
            <span class="zsc-lbl">Crowd Density</span>
            <strong class="zsc-val" [style.color]="selectedGate.color">{{ selectedGate.density }}</strong>
          </div>

          <div class="zdc-stat-chip">
            <span class="zsc-lbl">Last Updated</span>
            <strong class="zsc-val">{{ formatAnalysisTime(selectedGate.analysisTimestamp) }}</strong>
          </div>

          <div class="zdc-stat-chip">
            <span class="zsc-lbl">Flow</span>
            <strong class="zsc-val text-cyan">{{ selectedGate.flow }}</strong>
          </div>
        </div>

        <div class="zdc-status-text" *ngIf="selectedGate.status">
          <strong>Status:</strong> {{ selectedGate.status }} &bull; {{ selectedGate.recommendation }}
        </div>

        <!-- Video Thumbnail Preview Box with Play Overlay -->
        <div class="zdc-video-box" (click)="openVideoViewer(selectedGate)" title="Click to view complete video footage">
          <video [src]="selectedGate.appliedVideoUrl || selectedGate.videoSrc" muted preload="metadata" class="zdc-video-preview"></video>
          <div class="zdc-play-btn">▶</div>
          <div class="zdc-video-name-tag">{{ selectedGate.appliedVideoName || selectedGate.defaultVideoFilename }}</div>
        </div>

        <!-- Action Buttons Row -->
        <div class="zdc-actions-row">
          <button type="button" class="btn-zdc-video" (click)="openVideoViewer(selectedGate)">
            <svg viewBox="0 0 24 24" fill="currentColor" class="btn-svg">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            <span>View Crowd Video</span>
          </button>

          <button type="button" class="btn-zdc-route" (click)="findSafeRoute(selectedGate)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-svg">
              <circle cx="12" cy="12" r="10"/><polygon points="12 8 8 12 12 16 12 8"/>
            </svg>
            <span>Find Safe Route</span>
          </button>
        </div>
      </div>

      <!-- Quick Gate Selector Chips -->
      <div class="gate-selector-bar">
        <span class="gsb-title">All Gates:</span>
        <div class="gsb-list">
          <button 
            type="button" 
            *ngFor="let g of gatesState; let idx = index" 
            class="gsb-chip"
            [class.active]="selectedGate?.gateId === g.gateId"
            [style.border-color]="g.color"
            (click)="selectGate(idx)">
            <span class="gsb-dot" [style.background]="g.color"></span>
            <span>{{ g.name }}</span>
            <span class="gsb-lvl" [style.color]="g.color">{{ g.density }}</span>
          </button>
        </div>
      </div>

      <!-- Four Primary Action Buttons (Safe Route, I'm Stuck, Report, SOS) -->
      <div class="actions-quad-grid">
        <button type="button" class="quad-btn safe-btn" (click)="onFindSafeRoute()">
          <svg class="quad-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
          <span>FIND SAFE ROUTE</span>
        </button>

        <button type="button" class="quad-btn stuck-btn" (click)="openStuckModal()">
          <svg class="quad-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
          </svg>
          <span>I'M STUCK</span>
        </button>

        <button type="button" class="quad-btn report-btn" (click)="openReportModal()">
          <svg class="quad-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>REPORT CROWD</span>
        </button>

        <button type="button" class="quad-btn sos-btn" (click)="triggerSOS()">
          <svg class="quad-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>
          </svg>
          <span>SOS EMERGENCY</span>
        </button>
      </div>

      <!-- =========================================================================
           LARGE PRAVAAH VIDEO VIEWER MODAL (PANEL 7 IN MOCKUP)
           ========================================================================= -->
      <div *ngIf="isVideoModalOpen && modalGate" class="pravaah-video-modal-backdrop" (click)="onBackdropClick($event)">
        <div class="pravaah-video-modal-dialog" (click)="$event.stopPropagation()">
          
          <!-- Modal Top Header -->
          <div class="pvm-header">
            <div class="pvm-title-wrap">
              <span class="pvm-gate-dot" [style.background]="modalGate.color" [style.box-shadow]="'0 0 10px ' + modalGate.color"></span>
              <h2 class="pvm-title">{{ modalGate.name }} – {{ modalGate.subname }}</h2>
            </div>
            <button type="button" class="pvm-close-btn" (click)="closeVideoViewer()" aria-label="Close viewer" title="Close (ESC)">
              ✕
            </button>
          </div>

          <!-- Modal Metrics Subheader Row -->
          <div class="pvm-metrics-bar">
            <div class="pvm-badge" [style.background]="modalGate.color + '22'" [style.border-color]="modalGate.color" [style.color]="modalGate.color">
              {{ getCrowdLevelBadgeText(modalGate.crowdLevel) }}
            </div>

            <div class="pvm-metric-card">
              <span class="pvm-mc-label">Crowd Density</span>
              <strong class="pvm-mc-val" [style.color]="modalGate.color">{{ modalGate.density }}</strong>
            </div>

            <div class="pvm-metric-card">
              <span class="pvm-mc-label">Flow</span>
              <strong class="pvm-mc-val text-cyan">{{ modalGate.flow }}</strong>
            </div>

            <div class="pvm-metric-card">
              <span class="pvm-mc-label">Last Analysis</span>
              <strong class="pvm-mc-val">{{ formatAnalysisTime(modalGate.analysisTimestamp) }}</strong>
            </div>
          </div>

          <!-- Modal Video Screen -->
          <div class="pvm-video-screen">
            <div *ngIf="!modalVideoSrc" class="pvm-state-box">
              <h3 class="pvm-state-title">VIDEO NOT AVAILABLE</h3>
              <p class="pvm-state-sub">No applied crowd video is available for this gate.</p>
            </div>

            <div *ngIf="modalVideoSrc && modalVideoError" class="pvm-state-box">
              <h3 class="pvm-state-title">VIDEO UNAVAILABLE</h3>
              <p class="pvm-state-sub">Unable to load the saved crowd video.</p>
              <button type="button" class="btn-pvm-retry" (click)="retryLoadModalVideo()">↺ Retry Loading Video</button>
            </div>

            <video 
              *ngIf="modalVideoSrc && !modalVideoError"
              #largeVideoPlayerRef
              [src]="modalVideoSrc" 
              controls 
              autoplay 
              playsinline 
              (loadedmetadata)="onModalVideoLoadedMetadata($event)"
              (error)="onModalVideoError($event)"
              class="pvm-video-el">
            </video>
          </div>

          <!-- Modal Footer Bar -->
          <div class="pvm-footer">
            <div class="pvm-footer-left">
              <div class="pvm-meta-pill" [title]="modalVideoFilename">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pvm-meta-icon">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span class="pvm-filename">{{ modalVideoFilename }}</span>
              </div>
              <div class="pvm-meta-pill">
                <span>Duration: {{ modalVideoDuration || '02:15' }}</span>
              </div>
              <div class="pvm-meta-pill">
                <span>Updated: {{ formatAnalysisTime(modalGate.analysisTimestamp) }}</span>
              </div>
            </div>

            <div class="pvm-footer-right" *ngIf="modalVideoSrc && !modalVideoError">
              <a [href]="modalVideoSrc" [download]="modalVideoFilename" target="_blank" class="btn-pvm-download">
                Download Video
              </a>
            </div>
          </div>

        </div>
      </div>

      <!-- I'M STUCK MODAL -->
      <div *ngIf="showStuckModal" class="modal-backdrop">
        <div class="modal-card animate-fade-up">
          <div class="modal-head">
            <h2 class="modal-title">Assistance Request (I'm Stuck)</h2>
            <button type="button" class="modal-close" (click)="showStuckModal = false">✕</button>
          </div>
          <p class="modal-desc">Select how we can assist you right now. Your live GPS location will be transmitted to emergency operators.</p>

          <div class="stuck-options">
            <button type="button" class="option-row" (click)="submitStuckOption('MEDICAL_ASSISTANCE')">
              <span class="opt-icon">🚑</span>
              <div class="opt-text">
                <strong>Medical Emergency</strong>
                <span>Paramedic support dispatched to your coordinates</span>
              </div>
            </button>
            <button type="button" class="option-row" (click)="submitStuckOption('CROWD_EVACUATION')">
              <span class="opt-icon">🚶</span>
              <div class="opt-text">
                <strong>Crowd Crush / Gridlock</strong>
                <span>Request crowd marshal escort & diversion lane</span>
              </div>
            </button>
            <button type="button" class="option-row" (click)="submitStuckOption('LOST_PERSON')">
              <span class="opt-icon">🔍</span>
              <div class="opt-text">
                <strong>Separated Family / Child</strong>
                <span>Broadcast to central lost & found command station</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- REPORT CROWD MODAL -->
      <div *ngIf="showReportModal" class="modal-backdrop">
        <div class="modal-card animate-fade-up">
          <div class="modal-head">
            <h2 class="modal-title">Report Crowd Conditions</h2>
            <button type="button" class="modal-close" (click)="showReportModal = false">✕</button>
          </div>
          <p class="modal-desc">Your verified observation directly feeds the command center crowd intelligence algorithm.</p>
          <div class="report-form">
            <div class="form-group">
              <label>Observed Condition</label>
              <select [(ngModel)]="reportCategory" class="form-select">
                <option value="Heavy Crowd">Heavy Crowd Surge</option>
                <option value="Blocked Gate">Blocked Ingress Gate</option>
                <option value="Moving Smoothly">Moving Smoothly</option>
              </select>
            </div>
            <div class="form-group">
              <label>Details</label>
              <textarea [(ngModel)]="reportDescription" rows="2" class="form-textarea" placeholder="e.g. Ingress barricade bottleneck near Gate 1"></textarea>
            </div>
            <button type="button" class="btn-submit-report" (click)="submitVisitorReport()">Submit Report to Command Center</button>
          </div>
        </div>
      </div>

      <!-- Success Notification Toast -->
      <div *ngIf="successMessage" class="toast-notice animate-fade-up">
        {{ successMessage }}
      </div>

    </div>
  `,
  styles: [`
    .visitor-live-container {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      padding: 0.85rem;
      color: var(--foreground, #fff);
      font-family: 'Space Grotesk', -apple-system, sans-serif;
    }

    /* Live Header */
    .live-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .lh-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .back-circle {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .back-circle svg { width: 18px; height: 18px; }

    .header-titles {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .event-selector-select {
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(0, 198, 255, 0.4);
      color: #00C6FF;
      font-size: 0.74rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      outline: none;
      cursor: pointer;
    }

    .screen-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: #fff;
      margin: 0;
    }

    .lh-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .live-sync-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(0, 214, 163, 0.12);
      border: 1px solid #00D6A3;
      color: #00D6A3;
      font-size: 0.65rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 999px;
      letter-spacing: 0.04em;
    }

    .sync-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #00D6A3;
      animation: pulse-sync 1.5s infinite;
    }

    @keyframes pulse-sync {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.8); }
    }

    .btn-goto-operator {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      text-decoration: none;
    }
    .btn-goto-operator:hover {
      background: rgba(255, 255, 255, 0.16);
      color: #fff;
    }

    /* Real-Time Floating Crowd Alert Toast (Panel 4 & 8) */
    .realtime-alert-toast {
      background: rgba(15, 23, 42, 0.96);
      border: 1.5px solid #FF3B5C;
      border-radius: 12px;
      padding: 12px 14px;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.7), 0 0 15px rgba(255, 59, 92, 0.25);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .rat-head {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .rat-bell-wrap {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .rat-bell-icon { width: 14px; height: 14px; }

    .rat-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
    }

    .rat-tag {
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.04em;
    }

    .rat-time {
      font-size: 0.65rem;
      color: #94a3b8;
    }

    .rat-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1rem;
      cursor: pointer;
      line-height: 1;
    }

    .rat-title {
      font-size: 0.85rem;
      font-weight: 800;
      color: #fff;
    }

    .rat-msg {
      font-size: 0.75rem;
      color: #cbd5e1;
      margin: 0;
      line-height: 1.35;
    }

    .rat-actions {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }

    .btn-rat-view {
      flex: 1;
      padding: 6px 12px;
      background: #0284c7;
      color: #fff;
      font-size: 0.74rem;
      font-weight: 700;
      border-radius: 6px;
      border: none;
      cursor: pointer;
    }

    .btn-rat-route {
      flex: 1;
      padding: 6px 12px;
      background: rgba(0, 214, 163, 0.15);
      border: 1px solid #00D6A3;
      color: #00D6A3;
      font-size: 0.74rem;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
    }

    /* Safe Route Status Banner */
    .safe-route-status {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(0, 214, 163, 0.12);
      border: 1px solid #00D6A3;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 0.75rem;
      color: #00D6A3;
      font-weight: 600;
    }
    .safe-dot { width: 8px; height: 8px; border-radius: 50%; background: #00D6A3; }
    .close-route { margin-left: auto; background: transparent; border: none; color: #00D6A3; cursor: pointer; font-size: 1rem; }

    /* Interactive Leaflet Map Canvas */
    .live-map-wrapper {
      position: relative;
      width: 100%;
      height: 440px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(0, 198, 255, 0.3);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
      background: #050c18;
    }
    .visitor-map-canvas { width: 100%; height: 100%; }

    .map-floating-overlay {
      position: absolute;
      top: 10px;
      inset-inline: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      pointer-events: none;
      z-index: 400;
    }
    .geo-indicator {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.68rem;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 4px 10px;
      border-radius: 999px;
      color: #cbd5e1;
      backdrop-filter: blur(6px);
    }
    .geo-indicator.active .dot { background: #00D6A3; }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; }

    .map-ctrl-row {
      pointer-events: auto;
      display: flex;
      gap: 6px;
    }

    .ctrl-btn {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fff;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      backdrop-filter: blur(6px);
    }

    .recenter-btn {
      width: 32px;
      height: 32px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      cursor: pointer;
      backdrop-filter: blur(6px);
    }
    .recenter-btn svg { width: 14px; height: 14px; }

    /* Zone Legend Box */
    .zone-legend-box {
      position: absolute;
      bottom: 12px;
      right: 12px;
      background: rgba(8, 16, 32, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 6px 10px;
      z-index: 400;
      display: flex;
      flex-direction: column;
      gap: 4px;
      backdrop-filter: blur(6px);
    }

    .zlb-title {
      font-size: 0.65rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .zlb-items {
      display: flex;
      gap: 8px;
    }

    .zlb-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.68rem;
      color: #fff;
      font-weight: 600;
    }

    .zlb-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .bg-green { background: #00D6A3; }
    .bg-yellow { background: #FFB020; }
    .bg-orange { background: #f97316; }
    .bg-red { background: #FF3B5C; }

    /* Clickable Zone / Gate Details Card */
    .zone-detail-card {
      background: #091322;
      border: 1.5px solid rgba(0, 198, 255, 0.4);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.8);
    }

    .zdc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .zdc-title-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .zdc-status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .zdc-name {
      font-size: 1rem;
      font-weight: 800;
      color: #fff;
    }

    .zdc-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.2rem;
      cursor: pointer;
    }

    .zdc-metrics-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .zdc-badge {
      font-size: 0.75rem;
      font-weight: 800;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1.5px solid currentColor;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .zdc-stat-chip {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      padding: 4px 10px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .zsc-lbl {
      font-size: 0.6rem;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
    }

    .zsc-val {
      font-size: 0.85rem;
      font-weight: 800;
      color: #fff;
    }

    .text-cyan { color: #38bdf8 !important; }

    .zdc-status-text {
      font-size: 0.74rem;
      color: #cbd5e1;
      line-height: 1.35;
    }

    /* Video Preview Card Inside Details */
    .zdc-video-box {
      position: relative;
      height: 160px;
      border-radius: 8px;
      overflow: hidden;
      background: #000;
      cursor: pointer;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .zdc-video-preview {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .zdc-play-btn {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.65);
      border: 2px solid #fff;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      box-shadow: 0 4px 16px rgba(0,0,0,0.8);
      transition: transform 0.15s ease;
    }
    .zdc-video-box:hover .zdc-play-btn {
      transform: translate(-50%, -50%) scale(1.1);
      background: #0284c7;
      border-color: #0284c7;
    }

    .zdc-video-name-tag {
      position: absolute;
      bottom: 8px;
      left: 8px;
      background: rgba(0, 0, 0, 0.75);
      color: #fff;
      font-size: 0.68rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 4px;
      max-width: 80%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .zdc-actions-row {
      display: flex;
      gap: 10px;
    }

    .btn-zdc-video {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: #0284c7;
      color: #fff;
      font-weight: 700;
      font-size: 0.78rem;
      padding: 8px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .btn-zdc-video:hover { background: #0369a1; }

    .btn-zdc-route {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: rgba(0, 214, 163, 0.15);
      border: 1px solid #00D6A3;
      color: #00D6A3;
      font-weight: 700;
      font-size: 0.78rem;
      padding: 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-zdc-route:hover {
      background: #00D6A3;
      color: #050c18;
    }

    .btn-svg { width: 14px; height: 14px; }

    /* Quick Gate Selector Bar */
    .gate-selector-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow-x: auto;
      padding: 4px 0;
    }

    .gsb-title {
      font-size: 0.7rem;
      font-weight: 700;
      color: #94a3b8;
      white-space: nowrap;
    }

    .gsb-list {
      display: flex;
      gap: 6px;
    }

    .gsb-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 4px 8px;
      color: #fff;
      font-size: 0.7rem;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
    }
    .gsb-chip.active {
      background: rgba(0, 198, 255, 0.18);
    }
    .gsb-dot { width: 6px; height: 6px; border-radius: 50%; }
    .gsb-lvl { font-size: 0.65rem; }

    /* Four Primary Action Buttons */
    .actions-quad-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.65rem;
    }
    .quad-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 0.85rem 0.5rem;
      border-radius: 0.75rem;
      border: 1px solid var(--border, rgba(255,255,255,0.1));
      background: rgba(15, 23, 42, 0.8);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      cursor: pointer;
    }
    .quad-icon { width: 20px; height: 20px; }
    .safe-btn { background: #16a34a; border-color: #16a34a; color: #fff; }
    .stuck-btn { border-color: #FFB020; color: #FFB020; }
    .report-btn { border-color: #3b82f6; color: #3b82f6; }
    .sos-btn { background: #FF3B5C; border-color: #FF3B5C; color: #fff; }

    /* LARGE VIDEO VIEWER MODAL (PANEL 7) */
    .pravaah-video-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(3, 7, 18, 0.88);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      animation: pvm-fade-in 0.2s ease-out;
    }

    @keyframes pvm-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .pravaah-video-modal-dialog {
      background: #080f1e;
      border: 1px solid rgba(0, 198, 255, 0.4);
      border-radius: 14px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 198, 255, 0.15);
      width: 90vw;
      max-width: 1100px;
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: 'Space Grotesk', -apple-system, sans-serif;
    }

    .pvm-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.4rem 0.5rem;
    }
    .pvm-title-wrap { display: flex; align-items: center; gap: 10px; }
    .pvm-gate-dot { width: 13px; height: 13px; border-radius: 50%; }
    .pvm-title { font-size: 1.2rem; font-weight: 800; color: #fff; margin: 0; }
    .pvm-close-btn { background: transparent; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; }
    .pvm-close-btn:hover { color: #fff; }

    .pvm-metrics-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 1.4rem 0.8rem;
      flex-wrap: wrap;
    }
    .pvm-badge {
      font-size: 0.8rem;
      font-weight: 800;
      padding: 6px 14px;
      border-radius: 6px;
      border: 1.5px solid currentColor;
      text-transform: uppercase;
    }
    .pvm-metric-card {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      padding: 5px 12px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .pvm-mc-label { font-size: 0.62rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
    .pvm-mc-val { font-size: 0.95rem; font-weight: 800; color: #fff; }

    .pvm-video-screen {
      position: relative;
      background: #000;
      width: 100%;
      height: 54vh;
      max-height: 56vh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .pvm-video-el { width: 100%; height: 100%; object-fit: contain; background: #000; outline: none; }
    .pvm-state-box { text-align: center; padding: 2rem; }
    .pvm-state-title { font-size: 1.1rem; font-weight: 800; color: #fff; margin: 0 0 6px; }
    .pvm-state-sub { font-size: 0.85rem; color: #94a3b8; margin: 0; }
    .btn-pvm-retry {
      margin-top: 10px;
      background: rgba(0, 198, 255, 0.15);
      border: 1px solid #00C6FF;
      color: #00C6FF;
      font-weight: 700;
      font-size: 0.78rem;
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
    }

    .pvm-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.4rem;
      background: rgba(4, 9, 20, 0.95);
      gap: 1rem;
      flex-wrap: wrap;
    }
    .pvm-footer-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .pvm-meta-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.74rem;
      color: #cbd5e1;
      background: rgba(255, 255, 255, 0.04);
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .pvm-meta-icon { width: 14px; height: 14px; color: #00C6FF; }
    .pvm-filename { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
    .btn-pvm-download {
      background: #0284c7;
      color: #fff;
      font-weight: 700;
      font-size: 0.76rem;
      padding: 6px 12px;
      border-radius: 6px;
      text-decoration: none;
    }

    /* Modals (Stuck, Report) */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .modal-card {
      width: 100%;
      max-width: 380px;
      background: #091322;
      border-radius: 1rem;
      border: 1px solid rgba(0, 198, 255, 0.4);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      box-shadow: 0 15px 40px rgba(0,0,0,0.8);
    }
    .modal-head { display: flex; justify-content: space-between; align-items: center; }
    .modal-title { font-size: 0.95rem; font-weight: 700; color: #fff; margin: 0; }
    .modal-close { font-size: 1rem; color: #94a3b8; background: transparent; border: none; cursor: pointer; }
    .modal-desc { font-size: 0.74rem; color: #94a3b8; margin: 0; line-height: 1.4; }

    .stuck-options { display: flex; flex-direction: column; gap: 0.5rem; }
    .option-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 0.65rem;
      text-align: left;
      cursor: pointer;
    }
    .opt-icon { font-size: 1.2rem; }
    .opt-text { display: flex; flex-direction: column; gap: 2px; }
    .opt-text strong { font-size: 0.78rem; color: #fff; }
    .opt-text span { font-size: 0.68rem; color: #94a3b8; }

    .report-form { display: flex; flex-direction: column; gap: 0.75rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-group label { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; color: #94a3b8; }
    .form-select, .form-textarea {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 0.5rem;
      padding: 0.5rem;
      font-size: 0.8rem;
      color: #fff;
      outline: none;
    }
    .btn-submit-report {
      padding: 8px;
      background: #0284c7;
      color: #fff;
      font-size: 0.78rem;
      font-weight: 700;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
    }

    .toast-notice {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #0284c7;
      color: #fff;
      padding: 8px 18px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      z-index: 1200;
    }

    /* LEAFLET OVERLAYS (MATCHING OPERATOR MAP) */
    ::ng-deep .zone-pulsing-red {
      animation: pulse-red-zone 2s infinite ease-in-out;
    }

    @keyframes pulse-red-zone {
      0%, 100% { fill-opacity: 0.35; stroke-opacity: 0.85; stroke-width: 2px; }
      50% { fill-opacity: 0.60; stroke-opacity: 1; stroke-width: 3.5px; }
    }

    ::ng-deep .screenshot-zone-label {
      font-family: 'Space Grotesk', -apple-system, sans-serif;
      font-size: 0.75rem;
      font-weight: 800;
      text-align: center;
      color: #ffffff;
      text-shadow: 0 0 6px rgba(0,0,0,0.95), 0 2px 4px rgba(0,0,0,0.95);
      pointer-events: none;
      white-space: nowrap;
      line-height: 1.2;
    }

    ::ng-deep .screenshot-gate-pin {
      display: inline-flex;
      align-items: center;
      background: rgba(6, 16, 32, 0.95);
      border: 1px solid rgba(0, 198, 255, 0.45);
      border-radius: 999px;
      padding: 2px 8px 2px 2px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.75);
      cursor: pointer;
      pointer-events: auto;
      white-space: nowrap;
    }

    ::ng-deep .sgp-circle {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      margin-right: 5px;
      flex-shrink: 0;
    }
    ::ng-deep .sgp-circle svg { width: 12px; height: 12px; }
    ::ng-deep .sgp-circle.bg-red { background: #FF3B5C; }
    ::ng-deep .sgp-circle.bg-orange { background: #f97316; }
    ::ng-deep .sgp-circle.bg-yellow { background: #FFB020; color: #111; }
    ::ng-deep .sgp-circle.bg-green { background: #00D6A3; color: #111; }

    ::ng-deep .sgp-text-col {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
    }
    ::ng-deep .sgp-gate-name {
      font-size: 0.72rem;
      font-weight: 800;
      color: #fff;
    }
    ::ng-deep .sgp-level-text {
      font-size: 0.62rem;
      font-weight: 800;
      letter-spacing: 0.03em;
    }
  `]
})
export class VisitorLiveComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('visitorMapContainer') mapContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('largeVideoPlayerRef') largeVideoPlayerRef!: ElementRef<HTMLVideoElement>;

  private map: L.Map | null = null;
  private baseTileLayer: L.TileLayer | null = null;
  private safeRoutePolyline: L.Polyline | null = null;
  private userMarker: L.CircleMarker | null = null;
  private subs = new Subscription();

  // Leaflet Layer Groups (Matching Operator Map)
  private layerGroupZones = L.layerGroup();
  private layerGroupGates = L.layerGroup();
  private layerGroupSafeRoute = L.layerGroup();

  currentTileType: 'satellite' | 'street' = 'street';
  safeRouteActive = false;
  safeRouteBannerText = '';

  showStuckModal = false;
  showReportModal = false;
  reportCategory = 'Heavy Crowd';
  reportDescription = '';
  successMessage = '';

  // Real-Time Floating Alert State
  activeRealtimeAlert: RealtimeCrowdAlert | null = null;

  // Selected Gate Detail Card (Shown when zone or gate is clicked)
  selectedGate: GateCrowdState | null = null;

  // Large Video Viewer Modal State
  isVideoModalOpen = false;
  modalGate: GateCrowdState | null = null;
  modalVideoSrc = '';
  modalVideoFilename = '';
  modalVideoDuration = '';
  modalVideoError = false;

  // -------------------------------------------------------------
  // MUMBAI GANPATI VISARJAN GATES (5 GATES)
  // -------------------------------------------------------------
  readonly mumbaiGates: GateCrowdState[] = [
    {
      gateId: 'gt-mumbai-1',
      name: 'Gate 1',
      subname: 'Lalbaug Entry',
      lat: 18.9915,
      lng: 72.8375,
      appliedVideoName: 'Gate1_2.03.00 PM.mp4',
      appliedVideoUrl: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 10.19.31 PM.mp4'),
      appliedFileSize: '24.8 MB',
      crowdLevel: 'LOW / LESS CROWD',
      flow: 'LIGHT CROWD MOVEMENT',
      status: 'NORMAL',
      density: '15%',
      color: '#00D6A3',
      recommendation: 'NO INTERVENTION REQUIRED',
      recommendationSub: 'Observed density is well within safe gate capacity.',
      alertMessage: 'Lalbaug Entry ingress is clear. Normal queuing.',
      analysisTimestamp: new Date().toISOString(),
      isAppliedToMap: true,
      defaultVideoName: '2:03 PM',
      defaultVideoFilename: 'Gate1_2.03.00 PM.mp4',
      videoSrc: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 10.19.31 PM.mp4'),
      fileSize: '24.8 MB',
      hasActiveVideo: true
    },
    {
      gateId: 'gt-mumbai-2',
      name: 'Gate 2',
      subname: 'Main Road',
      lat: 19.0040,
      lng: 72.8420,
      appliedVideoName: 'Gate2_1.45.00 PM.mp4',
      appliedVideoUrl: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 4.12.37 PM.mp4'),
      appliedFileSize: '31.2 MB',
      crowdLevel: 'VERY HIGH',
      flow: 'HEAVY CROWD MOVEMENT',
      status: 'CRITICAL CROWD PRESSURE',
      density: '89%',
      color: '#FF3B5C',
      recommendation: 'DIVERT TOWARD PAREL APPROACH',
      recommendationSub: 'Critical procession density along Main Road.',
      alertMessage: 'Extreme crowd surge on Main Road. Diverting visitors to Parel Approach.',
      analysisTimestamp: new Date().toISOString(),
      isAppliedToMap: true,
      defaultVideoName: '1:45 PM',
      defaultVideoFilename: 'Gate2_1.45.00 PM.mp4',
      videoSrc: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 4.12.37 PM.mp4'),
      fileSize: '31.2 MB',
      hasActiveVideo: true
    },
    {
      gateId: 'gt-mumbai-3',
      name: 'Gate 3',
      subname: 'Ganesh Gully',
      lat: 18.9960,
      lng: 72.8470,
      appliedVideoName: 'Gate3_1.52.00 PM.mp4',
      appliedVideoUrl: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 4.12.38 PM.mp4'),
      appliedFileSize: '29.6 MB',
      crowdLevel: 'MODERATE',
      flow: 'STEADY INFLOW',
      status: 'CONTROLLED',
      density: '39%',
      color: '#FFB020',
      recommendation: 'MONITOR FLOW & BUFFER ARRIVALS',
      recommendationSub: 'Concourse flow within manageable thresholds.',
      alertMessage: 'Moderate crowd volume along Ganesh Gully approach.',
      analysisTimestamp: new Date().toISOString(),
      isAppliedToMap: true,
      defaultVideoName: '1:52 PM',
      defaultVideoFilename: 'Gate3_1.52.00 PM.mp4',
      videoSrc: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 4.12.38 PM.mp4'),
      fileSize: '29.6 MB',
      hasActiveVideo: true
    },
    {
      gateId: 'gt-mumbai-4',
      name: 'Gate 4',
      subname: 'Parel Approach',
      lat: 18.9880,
      lng: 72.8440,
      appliedVideoName: 'Gate4_2.01.00 PM.mp4',
      appliedVideoUrl: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 4.12.21 PM.mp4'),
      appliedFileSize: '27.4 MB',
      crowdLevel: 'HIGH',
      flow: 'ACTIVE CROWD MOVEMENT',
      status: 'ELEVATED CROWD PRESSURE',
      density: '69%',
      color: '#f97316',
      recommendation: 'MONITOR FLOW & BUFFER ARRIVALS',
      recommendationSub: 'Elevated crowd transit from Parel railway station.',
      alertMessage: 'Parel approach operating under elevated load.',
      analysisTimestamp: new Date().toISOString(),
      isAppliedToMap: true,
      defaultVideoName: '2:01 PM',
      defaultVideoFilename: 'Gate4_2.01.00 PM.mp4',
      videoSrc: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 4.12.21 PM.mp4'),
      fileSize: '27.4 MB',
      hasActiveVideo: true
    },
    {
      gateId: 'gt-mumbai-5',
      name: 'Gate 5',
      subname: 'Chintamani Gate',
      lat: 18.9910,
      lng: 72.8445,
      appliedVideoName: 'Gate5_1.58.00 PM.mp4',
      appliedVideoUrl: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 4.12.34 PM.mp4'),
      appliedFileSize: '28.4 MB',
      crowdLevel: 'HIGH',
      flow: 'ACTIVE CROWD MOVEMENT',
      status: 'ELEVATED CROWD PRESSURE',
      density: '56%',
      color: '#f97316',
      recommendation: 'REGULATE CHINTAMANI INGRESS',
      recommendationSub: 'Active procession ingress toward Chintamani darshan line.',
      alertMessage: 'Chintamani Gate has high crowd movement.',
      analysisTimestamp: new Date().toISOString(),
      isAppliedToMap: true,
      defaultVideoName: '1:58 PM',
      defaultVideoFilename: 'Gate5_1.58.00 PM.mp4',
      videoSrc: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 4.12.34 PM.mp4'),
      fileSize: '28.4 MB',
      hasActiveVideo: true
    }
  ];

  // -------------------------------------------------------------
  // MAHA KUMBH MELA GATES (4 GATES)
  // -------------------------------------------------------------
  readonly kumbhGates: GateCrowdState[] = [
    {
      gateId: 'gt-kumbh-1',
      name: 'Gate 1',
      subname: 'Fort Rampart',
      lat: 25.4280,
      lng: 81.8740,
      appliedVideoName: 'Gate1_10.19.31 PM.mp4',
      appliedVideoUrl: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 10.19.31 PM.mp4'),
      appliedFileSize: '24.8 MB',
      crowdLevel: 'LOW / LESS CROWD',
      flow: 'LIGHT CROWD MOVEMENT',
      status: 'NORMAL',
      density: '15%',
      color: '#00D6A3',
      recommendation: 'NO INTERVENTION REQUIRED',
      recommendationSub: 'Current crowd is within safe limits.',
      alertMessage: 'Crowd at Gate 1 is normal. No diversion required.',
      analysisTimestamp: new Date().toISOString(),
      isAppliedToMap: true,
      defaultVideoName: '10.19.31 PM',
      defaultVideoFilename: 'Gate1_10.19.31 PM.mp4',
      videoSrc: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 10.19.31 PM.mp4'),
      fileSize: '24.8 MB',
      hasActiveVideo: true
    },
    {
      gateId: 'gt-kumbh-2',
      name: 'Gate 2',
      subname: 'Sangam Direct',
      lat: 25.4385,
      lng: 81.8840,
      appliedVideoName: 'Gate2_4.12.37 PM.mp4',
      appliedVideoUrl: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 4.12.37 PM.mp4'),
      appliedFileSize: '31.2 MB',
      crowdLevel: 'VERY HIGH',
      flow: 'HEAVY CROWD MOVEMENT',
      status: 'CRITICAL CROWD PRESSURE',
      density: '89%',
      color: '#FF3B5C',
      recommendation: 'CONSIDER DIVERTING VISITORS TOWARD A LOWER-DENSITY GATE',
      recommendationSub: 'Critical crowd pressure detected at Sangam Direct approach.',
      alertMessage: 'High crowd pressure detected at Gate 2. Please use Gate 4 for safer movement.',
      analysisTimestamp: new Date().toISOString(),
      isAppliedToMap: true,
      defaultVideoName: '4.12.37 PM',
      defaultVideoFilename: 'Gate2_4.12.37 PM.mp4',
      videoSrc: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 4.12.37 PM.mp4'),
      fileSize: '31.2 MB',
      hasActiveVideo: true
    },
    {
      gateId: 'gt-kumbh-3',
      name: 'Gate 3',
      subname: 'Sangam Approach',
      lat: 25.4340,
      lng: 81.8980,
      appliedVideoName: 'Gate3_4.12.34 PM.mp4',
      appliedVideoUrl: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 4.12.34 PM.mp4'),
      appliedFileSize: '29.6 MB',
      crowdLevel: 'HIGH',
      flow: 'ACTIVE CROWD MOVEMENT',
      status: 'ELEVATED CROWD PRESSURE',
      density: '56%',
      color: '#f97316',
      recommendation: 'CONSIDER DIVERTING VISITORS TOWARD A LOWER-DENSITY GATE',
      recommendationSub: 'Elevated bottleneck crowd pressure detected at North Causeway.',
      alertMessage: 'Elevated crowd detected at Gate 3. Diverting visitors toward Gate 4 / Arail Side.',
      analysisTimestamp: new Date().toISOString(),
      isAppliedToMap: true,
      defaultVideoName: '4.12.34 PM',
      defaultVideoFilename: 'Gate3_4.12.34 PM.mp4',
      videoSrc: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 4.12.34 PM.mp4'),
      fileSize: '29.6 MB',
      hasActiveVideo: true
    },
    {
      gateId: 'gt-kumbh-4',
      name: 'Gate 4',
      subname: 'Arail Side',
      lat: 25.4245,
      lng: 81.8920,
      appliedVideoName: 'Gate4_4.12.38 PM.mp4',
      appliedVideoUrl: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 4.12.38 PM.mp4'),
      appliedFileSize: '27.4 MB',
      crowdLevel: 'MODERATE',
      flow: 'STEADY INFLOW',
      status: 'CONTROLLED',
      density: '39%',
      color: '#FFB020',
      recommendation: 'MONITOR CROWD DISTRIBUTION',
      recommendationSub: 'Concourse flow along Pontoon Bridge East is controlled.',
      alertMessage: 'Moderate crowd movement at Gate 4. Follow designated walking corridors.',
      analysisTimestamp: new Date().toISOString(),
      isAppliedToMap: true,
      defaultVideoName: '4.12.38 PM',
      defaultVideoFilename: 'Gate4_4.12.38 PM.mp4',
      videoSrc: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 4.12.38 PM.mp4'),
      fileSize: '27.4 MB',
      hasActiveVideo: true
    }
  ];

  get currentEventId(): string {
    const ev = this.eventService.activeEventSubject?.value;
    return ev?.id || 'maha-kumbh';
  }

  get isMumbaiActive(): boolean {
    return this.currentEventId === 'mumbai-ganpati';
  }

  get gatesState(): GateCrowdState[] {
    return this.isMumbaiActive ? this.mumbaiGates : this.kumbhGates;
  }

  constructor(
    public eventService: EventService,
    public geoService: GeolocationService,
    public offlineService: OfflineService,
    private socketService: SocketService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 1. Join current event room in Socket.IO
    this.socketService.joinEvent(this.currentEventId);

    // 2. Load latest applied gate states from SQL Server
    this.loadPersistedGateStates();

    // 3. Listen for real-time gate updates broadcast by Operator
    this.subs.add(
      this.socketService.gateAnalysisUpdated$.subscribe((update: any) => {
        this.handleRealtimeGateUpdate(update);
      })
    );

    // Also listen to gateUpdate$ in case server emits on gate:update
    this.subs.add(
      this.socketService.gateUpdate$.subscribe((update: any) => {
        this.handleRealtimeGateUpdate(update);
      })
    );

    // 4. Listen for real-time alerts
    this.subs.add(
      this.socketService.alertNew$.subscribe((alert: any) => {
        if (alert && (!alert.eventId || alert.eventId === this.currentEventId)) {
          this.activeRealtimeAlert = {
            alertId: alert.alertId || `alt-${Date.now()}`,
            gateId: alert.gateId || '',
            gateName: alert.gateName || alert.title || 'Crowd Alert',
            crowdLevel: alert.severity || 'HIGH',
            density: alert.density || '85%',
            title: alert.title || 'Crowd Alert',
            message: alert.message || 'Elevated crowd pressure detected.',
            recommendation: alert.recommendation || 'Please use alternate route.',
            color: alert.color || '#FF3B5C',
            timestamp: new Date().toISOString()
          };
          this.cdr.detectChanges();
        }
      })
    );

    // 5. Automatic reconnection recovery (Requirement 17)
    this.subs.add(
      this.socketService.reconnected$.subscribe(() => {
        console.log('[VisitorLive] Reconnected: Reloading latest active gate states from SQL Server...');
        this.socketService.joinEvent(this.currentEventId);
        this.loadPersistedGateStates();
      })
    );

    // 6. Geolocation updates
    this.subs.add(
      this.geoService.location$.subscribe(loc => {
        if (loc && this.map) {
          this.updateUserMarker(loc);
        }
      })
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 100);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.map) {
      try { this.map.remove(); } catch {}
      this.map = null;
    }
  }

  /* =========================================================================
     SQL SERVER PERSISTENCE & REAL-TIME STATE SYNC
     ========================================================================= */
  loadPersistedGateStates(): void {
    const eventId = this.currentEventId;
    this.http.get<any>(`http://localhost:5000/api/events/${eventId}/gates/status`).subscribe({
      next: (res) => {
        if (res && res.success && Array.isArray(res.states)) {
          res.states.forEach((persisted: any) => {
            const match = this.gatesState.find(g => g.gateId === persisted.gateId);
            if (match) {
              match.appliedVideoName = persisted.videoName || match.appliedVideoName;
              match.appliedVideoUrl = persisted.videoUrl || match.appliedVideoUrl;
              match.crowdLevel = persisted.crowdLevel || match.crowdLevel;
              match.density = persisted.crowdDensity || match.density;
              match.flow = persisted.crowdFlow || match.flow;
              match.status = persisted.status || match.status;
              match.color = persisted.color || match.color;
              match.recommendation = persisted.recommendation || match.recommendation;
              match.recommendationSub = persisted.recommendationSub || match.recommendationSub;
              match.alertMessage = persisted.alertMessage || match.alertMessage;
              match.analysisTimestamp = persisted.analysisTimestamp || match.analysisTimestamp;
              match.isAppliedToMap = true;
            }
          });

          if (this.map) {
            this.renderCrowdDensityZones();
            this.renderGateMarkers();
          }
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.warn(`Could not load persisted gate states for ${eventId}:`, err.message);
      }
    });
  }

  private handleRealtimeGateUpdate(update: any): void {
    if (!update || !update.gateId) return;

    // Requirement 14: EVENT ISOLATION (Maha Kumbh vs Mumbai Ganpati)
    if (update.eventId && update.eventId !== this.currentEventId) {
      console.log(`[VisitorLive] Ignored update from non-active event: ${update.eventId}`);
      return;
    }

    // Requirement 15: GATE ISOLATION (Find the exact gate)
    const gate = this.gatesState.find(g => g.gateId === update.gateId);
    if (!gate) return;

    console.log(`⚡ [VisitorLive] Received REAL-TIME update for ${gate.name} (${gate.gateId}): ${update.crowdLevel} (${update.crowdDensity || update.density})`);

    // Update active gate state in-place without page refresh!
    gate.crowdLevel = update.crowdLevel || gate.crowdLevel;
    gate.density = update.crowdDensity || update.density || gate.density;
    gate.flow = update.crowdFlow || update.flow || gate.flow;
    gate.status = update.status || gate.status;
    gate.color = update.color || gate.color;
    if (update.videoUrl) gate.appliedVideoUrl = update.videoUrl;
    if (update.videoName) gate.appliedVideoName = update.videoName;
    if (update.recommendation) gate.recommendation = update.recommendation;
    if (update.alertMessage) gate.alertMessage = update.alertMessage;
    gate.analysisTimestamp = update.updatedAt || update.analysisTimestamp || new Date().toISOString();
    gate.isAppliedToMap = true;

    // Immediately re-render Leaflet Map Zones and Markers (NO REFRESH)
    if (this.map) {
      this.renderCrowdDensityZones();
      this.renderGateMarkers();
    }

    // Update currently opened gate details card if this gate is viewed
    if (this.selectedGate && this.selectedGate.gateId === gate.gateId) {
      this.selectedGate = { ...gate };
    }

    // Requirement 6: USER ALERT (Trigger real-time alert toast if HIGH or VERY HIGH)
    const upperLevel = (gate.crowdLevel || '').toUpperCase();
    if (upperLevel.includes('HIGH')) {
      this.activeRealtimeAlert = {
        alertId: `alt-${Date.now()}`,
        gateId: gate.gateId,
        gateName: `${gate.name} — ${gate.subname}`,
        crowdLevel: gate.crowdLevel,
        density: gate.density,
        title: `CROWD ALERT — ${gate.name}`,
        message: `${gate.name} has become ${gate.crowdLevel}. Crowd Density: ${gate.density}. Please avoid this area and use the recommended safe route.`,
        recommendation: gate.recommendation || 'Please avoid this area and use the recommended safe route.',
        color: gate.color,
        timestamp: new Date().toISOString()
      };
    }

    this.cdr.detectChanges();
  }

  onEventChange(newEventId: string): void {
    if (newEventId === this.currentEventId) return;
    this.eventService.selectEvent(newEventId);
    this.selectedGate = null;
    this.activeRealtimeAlert = null;
    this.clearSafeRoute();

    this.socketService.joinEvent(newEventId);
    this.loadPersistedGateStates();

    setTimeout(() => {
      this.recenterMap();
      this.renderCrowdDensityZones();
      this.renderGateMarkers();
      this.cdr.detectChanges();
    }, 120);
  }

  dismissAlert(): void {
    this.activeRealtimeAlert = null;
  }

  viewAlertGateOnMap(gateId: string): void {
    const idx = this.gatesState.findIndex(g => g.gateId === gateId);
    if (idx >= 0) {
      this.selectGate(idx);
      this.dismissAlert();
    }
  }

  findSafeRouteForGateId(gateId: string): void {
    const gate = this.gatesState.find(g => g.gateId === gateId);
    if (gate) {
      this.findSafeRoute(gate);
      this.dismissAlert();
    }
  }

  /* =========================================================================
     MAP RENDERING (MATCHING OPERATOR LEAFLET MAP)
     ========================================================================= */
  private initMap(): void {
    if (!this.mapContainer || typeof window === 'undefined') return;
    const container = this.mapContainer.nativeElement;
    if (!container || !document.body.contains(container)) return;

    if (this.map) {
      try { this.map.remove(); } catch {}
      this.map = null;
    }

    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    const centerLat = this.isMumbaiActive ? 18.9925 : 25.4310;
    const centerLng = this.isMumbaiActive ? 72.8420 : 81.8870;

    this.map = L.map(container, {
      zoomControl: true,
      attributionControl: true
    }).setView([centerLat, centerLng], 14);

    this.setTileLayer('street');

    this.layerGroupZones.addTo(this.map);
    this.layerGroupGates.addTo(this.map);
    this.layerGroupSafeRoute.addTo(this.map);

    this.renderCrowdDensityZones();
    this.renderGateMarkers();

    const gps = this.geoService.currentLocation;
    if (gps) {
      this.updateUserMarker(gps);
    }

    setTimeout(() => this.map?.invalidateSize(), 150);
  }

  setTileLayer(type: 'satellite' | 'street'): void {
    if (!this.map) return;
    if (this.baseTileLayer) {
      this.map.removeLayer(this.baseTileLayer);
    }
    this.currentTileType = type;

    if (type === 'satellite') {
      this.baseTileLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, attribution: 'Tiles &copy; Esri' }
      ).addTo(this.map);
    } else {
      this.baseTileLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }
      ).addTo(this.map);
    }
  }

  toggleTileLayer(): void {
    this.setTileLayer(this.currentTileType === 'satellite' ? 'street' : 'satellite');
  }

  recenterMap(): void {
    if (!this.map) return;
    const centerLat = this.isMumbaiActive ? 18.9925 : 25.4310;
    const centerLng = this.isMumbaiActive ? 72.8420 : 81.8870;
    this.map.setView([centerLat, centerLng], 14, { animate: true });
  }

  renderCrowdDensityZones(): void {
    if (!this.map) return;
    this.layerGroupZones.clearLayers();

    if (this.isMumbaiActive) {
      // 1. Mumbai Gate 1 (Lalbaug Entry)
      const g1 = this.gatesState[0];
      const p1: L.LatLngExpression[] = [
        [18.9970, 72.8330], [18.9940, 72.8410], [18.9870, 72.8420], [18.9850, 72.8330], [18.9910, 72.8300]
      ];
      const z1 = L.polygon(p1, {
        className: (g1.crowdLevel || '').includes('VERY') ? 'zone-pulsing-red' : '',
        color: g1.color,
        fillColor: g1.color,
        weight: 2,
        fillOpacity: 0.32
      }).addTo(this.layerGroupZones);
      z1.on('click', () => this.selectGate(0));

      // 2. Mumbai Gate 2 (Main Road)
      const g2 = this.gatesState[1];
      const p2: L.LatLngExpression[] = [
        [19.0110, 72.8390], [19.0130, 72.8480], [19.0040, 72.8550], [18.9980, 72.8450], [19.0020, 72.8370]
      ];
      const z2 = L.polygon(p2, {
        className: (g2.crowdLevel || '').includes('VERY') ? 'zone-pulsing-red' : '',
        color: g2.color,
        fillColor: g2.color,
        weight: 2.5,
        fillOpacity: 0.35
      }).addTo(this.layerGroupZones);
      z2.on('click', () => this.selectGate(1));

      // 3. Mumbai Gate 3 (Ganesh Gully)
      const g3 = this.gatesState[2];
      const p3: L.LatLngExpression[] = [
        [19.0050, 72.8480], [19.0020, 72.8600], [18.9930, 72.8590], [18.9910, 72.8480], [18.9980, 72.8440]
      ];
      const z3 = L.polygon(p3, {
        className: (g3.crowdLevel || '').includes('VERY') ? 'zone-pulsing-red' : '',
        color: g3.color,
        fillColor: g3.color,
        weight: 2.5,
        fillOpacity: 0.35
      }).addTo(this.layerGroupZones);
      z3.on('click', () => this.selectGate(2));

      // 4. Mumbai Gate 4 (Parel Approach)
      const g4 = this.gatesState[3];
      const p4: L.LatLngExpression[] = [
        [18.9920, 72.8400], [18.9940, 72.8480], [18.9840, 72.8520], [18.9820, 72.8410], [18.9870, 72.8380]
      ];
      const z4 = L.polygon(p4, {
        className: (g4.crowdLevel || '').includes('VERY') ? 'zone-pulsing-red' : '',
        color: g4.color,
        fillColor: g4.color,
        weight: 2,
        fillOpacity: 0.32
      }).addTo(this.layerGroupZones);
      z4.on('click', () => this.selectGate(3));

      // 5. Mumbai Gate 5 (Chintamani Gate)
      if (this.gatesState[4]) {
        const g5 = this.gatesState[4];
        const p5: L.LatLngExpression[] = [
          [18.9955, 72.8415], [18.9965, 72.8490], [18.9880, 72.8505], [18.9865, 72.8430], [18.9910, 72.8395]
        ];
        const z5 = L.polygon(p5, {
          className: (g5.crowdLevel || '').includes('VERY') ? 'zone-pulsing-red' : '',
          color: g5.color,
          fillColor: g5.color,
          weight: 2.5,
          fillOpacity: 0.35
        }).addTo(this.layerGroupZones);
        z5.on('click', () => this.selectGate(4));
      }
      return;
    }

    // Maha Kumbh Zones: Zone A, B, C, D
    const g1 = this.gatesState[0];
    const p1: L.LatLngExpression[] = [
      [25.4380, 81.8620], [25.4410, 81.8720], [25.4310, 81.8820], [25.4240, 81.8760], [25.4280, 81.8610]
    ];
    const z1 = L.polygon(p1, {
      className: (g1.crowdLevel || '').includes('VERY') ? 'zone-pulsing-red' : '',
      color: g1.color,
      fillColor: g1.color,
      weight: 2,
      fillOpacity: 0.32
    }).addTo(this.layerGroupZones);
    z1.on('click', () => this.selectGate(0));

    const g2 = this.gatesState[1];
    const p2: L.LatLngExpression[] = [
      [25.4490, 81.8760], [25.4520, 81.8920], [25.4410, 81.8990], [25.4330, 81.8860], [25.4380, 81.8730]
    ];
    const z2 = L.polygon(p2, {
      className: (g2.crowdLevel || '').includes('VERY') ? 'zone-pulsing-red' : '',
      color: g2.color,
      fillColor: g2.color,
      weight: 2.5,
      fillOpacity: 0.35
    }).addTo(this.layerGroupZones);
    z2.on('click', () => this.selectGate(1));

    const g3 = this.gatesState[2];
    const p3: L.LatLngExpression[] = [
      [25.4430, 81.8990], [25.4460, 81.9160], [25.4350, 81.9220], [25.4280, 81.9060], [25.4320, 81.8970]
    ];
    const z3 = L.polygon(p3, {
      className: (g3.crowdLevel || '').includes('VERY') ? 'zone-pulsing-red' : '',
      color: g3.color,
      fillColor: g3.color,
      weight: 2.5,
      fillOpacity: 0.35
    }).addTo(this.layerGroupZones);
    z3.on('click', () => this.selectGate(2));

    const g4 = this.gatesState[3];
    const p4: L.LatLngExpression[] = [
      [25.4290, 81.8980], [25.4320, 81.9260], [25.4180, 81.9320], [25.4140, 81.9030], [25.4210, 81.8940]
    ];
    const z4 = L.polygon(p4, {
      className: (g4.crowdLevel || '').includes('VERY') ? 'zone-pulsing-red' : '',
      color: g4.color,
      fillColor: g4.color,
      weight: 2,
      fillOpacity: 0.32
    }).addTo(this.layerGroupZones);
    z4.on('click', () => this.selectGate(3));
  }

  renderGateMarkers(): void {
    if (!this.map) return;
    this.layerGroupGates.clearLayers();

    this.gatesState.forEach((g, idx) => {
      const pinClass = g.color === '#FF3B5C' ? 'bg-red' : (g.color === '#f97316' ? 'bg-orange' : (g.color === '#FFB020' ? 'bg-yellow' : 'bg-green'));

      const markerHtml = `
        <div class="screenshot-gate-pin">
          <div class="sgp-circle ${pinClass}">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
          </div>
          <div class="sgp-text-col">
            <span class="sgp-gate-name">${g.name}</span>
            <span class="sgp-level-text" style="color:${g.color};">${g.crowdLevel}</span>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'pravaah-user-gate-pin',
        html: markerHtml,
        iconSize: [120, 32],
        iconAnchor: [12, 16]
      });

      const marker = L.marker([g.lat, g.lng], { icon }).addTo(this.layerGroupGates);
      marker.on('click', () => {
        this.selectGate(idx);
      });
    });
  }

  selectGate(idx: number): void {
    const gate = this.gatesState[idx];
    if (!gate) return;
    this.selectedGate = { ...gate };

    if (this.map) {
      this.map.panTo([gate.lat, gate.lng], { animate: true, duration: 0.5 });
    }
    this.cdr.detectChanges();
  }

  closeGateDetails(): void {
    this.selectedGate = null;
  }

  /* =========================================================================
     SAFE ROUTE NAVIGATION
     ========================================================================= */
  onFindSafeRoute(): void {
    const target = this.selectedGate || this.gatesState.find(g => (g.crowdLevel || '').includes('HIGH')) || this.gatesState[0];
    this.findSafeRoute(target);
  }

  findSafeRoute(gate: GateCrowdState): void {
    if (!this.map) return;
    this.safeRouteActive = true;
    this.layerGroupSafeRoute.clearLayers();

    if (this.isMumbaiActive) {
      const isGate2 = gate.gateId === 'gt-mumbai-2';
      const origin = isGate2 ? 'GATE 2 (MAIN ROAD)' : gate.name.toUpperCase();
      const dest = isGate2 ? 'GATE 1 (LALBAUG ENTRY)' : 'GATE 4 (PAREL APPROACH)';
      this.safeRouteBannerText = `SAFE DETOUR ACTIVE: Bypassing congested ${origin} via ${dest} · 8 MIN`;

      const safePoints = (isGate2 ? [
        [19.0040, 72.8420],
        [19.0010, 72.8395],
        [18.9960, 72.8370],
        [18.9915, 72.8375]
      ] : [
        [18.9960, 72.8470],
        [18.9920, 72.8465],
        [18.9880, 72.8440]
      ]) as L.LatLngExpression[];

      this.drawSafeRouteGlow(safePoints);
      this.showToast(`Safe route generated! Routing away from ${gate.name}.`);
      return;
    }

    // Maha Kumbh Safe Route
    const isGate2 = gate.gateId === 'gt-kumbh-2';
    const origin = isGate2 ? 'GATE 2 (SANGAM DIRECT)' : gate.name.toUpperCase();
    const dest = isGate2 ? 'GATE 1 (FORT RAMPART)' : 'GATE 4 (ARAIL SIDE)';
    this.safeRouteBannerText = `SAFE DETOUR ACTIVE: Bypassing congested ${origin} via ${dest} · 12 MIN`;

    const safePoints = (isGate2 ? [
      [25.4385, 81.8840],
      [25.4360, 81.8790],
      [25.4320, 81.8750],
      [25.4280, 81.8740]
    ] : [
      [25.4340, 81.8980],
      [25.4310, 81.8950],
      [25.4265, 81.8905],
      [25.4245, 81.8920]
    ]) as L.LatLngExpression[];

    this.drawSafeRouteGlow(safePoints);
    this.showToast(`Safe route generated! Routing away from ${gate.name}.`);
  }

  private drawSafeRouteGlow(points: L.LatLngExpression[]): void {
    // Outer glow
    L.polyline(points, {
      color: '#00D6A3',
      weight: 8,
      opacity: 0.35
    }).addTo(this.layerGroupSafeRoute);

    // Inner glowing dashed line
    const line = L.polyline(points, {
      color: '#00D6A3',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.95
    }).addTo(this.layerGroupSafeRoute);

    this.map?.fitBounds(line.getBounds(), { padding: [40, 40] });
    this.cdr.detectChanges();
  }

  clearSafeRoute(): void {
    this.safeRouteActive = false;
    this.layerGroupSafeRoute.clearLayers();
    this.cdr.detectChanges();
  }

  /* =========================================================================
     LARGE VIDEO VIEWER MODAL (PANEL 7)
     ========================================================================= */
  openVideoViewer(gate: GateCrowdState): void {
    if (!gate) return;
    this.modalGate = gate;
    this.modalVideoError = false;
    this.modalVideoDuration = '';

    // Requirement 9 & 10: Use the exact active applied video
    let targetSrc = gate.appliedVideoUrl || gate.videoSrc || '';
    const targetName = gate.appliedVideoName || gate.defaultVideoFilename || gate.defaultVideoName || 'Recorded Crowd Video';

    this.modalVideoSrc = targetSrc;
    this.modalVideoFilename = targetName;
    this.isVideoModalOpen = true;
    this.cdr.detectChanges();
  }

  closeVideoViewer(): void {
    this.isVideoModalOpen = false;
    if (this.largeVideoPlayerRef?.nativeElement) {
      try {
        this.largeVideoPlayerRef.nativeElement.pause();
        this.largeVideoPlayerRef.nativeElement.currentTime = 0;
      } catch {}
    }
    this.cdr.detectChanges();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('pravaah-video-modal-backdrop')) {
      this.closeVideoViewer();
    }
  }

  @HostListener('document:keydown.escape')
  handleKeyboardEscape(): void {
    if (this.isVideoModalOpen) {
      this.closeVideoViewer();
    }
  }

  onModalVideoLoadedMetadata(event: Event): void {
    const vid = event.target as HTMLVideoElement;
    if (vid && vid.duration) {
      const mins = Math.floor(vid.duration / 60);
      const secs = Math.floor(vid.duration % 60);
      this.modalVideoDuration = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    this.modalVideoError = false;
  }

  onModalVideoError(event: any): void {
    if (this.modalVideoSrc && this.modalVideoSrc.startsWith('http://localhost:5000/uploads/demo-videos/')) {
      const rel = this.modalVideoSrc.replace('http://localhost:5000/uploads/', '/assets/');
      this.modalVideoSrc = rel;
      return;
    }
    if (this.modalVideoSrc && this.modalVideoSrc.startsWith('/assets/demo-videos/')) {
      const api = this.modalVideoSrc.replace('/assets/', 'http://localhost:5000/uploads/');
      this.modalVideoSrc = api;
      return;
    }
    this.modalVideoError = true;
    this.cdr.detectChanges();
  }

  retryLoadModalVideo(): void {
    this.modalVideoError = false;
    if (this.largeVideoPlayerRef?.nativeElement) {
      this.largeVideoPlayerRef.nativeElement.load();
    }
  }

  formatAnalysisTime(ts: string): string {
    if (!ts) return '11:05 PM • 12 Jan';
    try {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        return `${time} • ${date}`;
      }
    } catch {}
    return '11:05 PM';
  }

  getCrowdLevelBadgeText(level: string): string {
    if (!level) return 'MODERATE CROWD';
    const up = level.toUpperCase();
    if (up.includes('VERY HIGH')) return 'VERY HIGH CROWD';
    if (up.includes('HIGH') && !up.includes('VERY')) return 'HIGH CROWD';
    if (up.includes('MODERATE')) return 'MODERATE CROWD';
    if (up.includes('LOW')) return 'LOW CROWD';
    return `${up} CROWD`;
  }

  /* =========================================================================
     EMERGENCY ASSISTANCE & GPS
     ========================================================================= */
  private updateUserMarker(loc: { latitude: number; longitude: number }): void {
    if (!this.map) return;
    if (!this.userMarker) {
      this.userMarker = L.circleMarker([loc.latitude, loc.longitude], {
        radius: 7,
        fillColor: '#3b82f6',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1
      }).addTo(this.map);
      this.userMarker.bindTooltip('<b>You are here</b>');
    } else {
      this.userMarker.setLatLng([loc.latitude, loc.longitude]);
    }
  }

  openStuckModal(): void { this.showStuckModal = true; }
  openReportModal(): void { this.showReportModal = true; }

  submitStuckOption(type: any): void {
    const gps = this.geoService.currentLocation;
    const payload = {
      eventId: this.currentEventId,
      userId: 'usr-vis-01',
      userName: 'Arjun Sharma',
      emergencyType: type,
      latitude: gps ? gps.latitude : 25.4294,
      longitude: gps ? gps.longitude : 81.8841,
      accuracy: gps ? gps.accuracy : 10
    };

    if (this.offlineService.isOffline) {
      this.offlineService.queueAction('STUCK_REQUEST', payload);
      this.showToast('Offline Mode: Distress signal queued for transmission.');
    } else {
      this.http.post('http://localhost:5000/api/emergency/stuck', payload).subscribe();
      this.socketService.sendEmergencyStuck(payload);
      this.showToast(`Request dispatched to command center.`);
    }
    this.showStuckModal = false;
  }

  triggerSOS(): void {
    const gps = this.geoService.currentLocation;
    const payload = {
      eventId: this.currentEventId,
      userId: 'usr-vis-01',
      userName: 'Arjun Sharma',
      latitude: gps ? gps.latitude : 25.4294,
      longitude: gps ? gps.longitude : 81.8841,
      accuracy: gps ? gps.accuracy : 5,
      notes: 'URGENT SOS TRIGGERED BY ARJUN SHARMA'
    };

    if (this.offlineService.isOffline) {
      this.offlineService.queueAction('SOS', payload);
      this.showToast('Offline Mode: Emergency SOS queued locally.');
    } else {
      this.http.post('http://localhost:5000/api/emergency/sos', payload).subscribe();
      this.socketService.sendEmergencySOS(payload);
      this.showToast('🚨 SOS Transmitted! Responders notified with your live coordinates.');
    }
  }

  submitVisitorReport(): void {
    if (!this.reportDescription.trim()) return;
    const gps = this.geoService.currentLocation;
    const payload = {
      eventId: this.currentEventId,
      userId: 'usr-vis-01',
      userName: 'Arjun Sharma',
      category: this.reportCategory,
      description: this.reportDescription,
      latitude: gps ? gps.latitude : 25.4294,
      longitude: gps ? gps.longitude : 81.8841
    };

    if (this.offlineService.isOffline) {
      this.offlineService.queueAction('VISITOR_REPORT', payload);
      this.showToast('Offline Mode: Report stored locally. Syncing on reconnect.');
    } else {
      this.http.post('http://localhost:5000/api/crowd/report', payload).subscribe();
      this.showToast('Report submitted! Thank you for assisting event orchestration.');
    }
    this.reportDescription = '';
    this.showReportModal = false;
  }

  private showToast(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => { this.successMessage = ''; }, 4500);
  }
}
