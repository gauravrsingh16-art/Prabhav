import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { EventService } from '../../services/event.service';
import { AuthService } from '../../services/auth.service';
import { MegaEvent } from '../../models/pravaah.models';

@Component({
  selector: 'app-operator-shell',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="operator-theme">
      <!-- Fixed Dark Ambient Background -->
      <div class="ambient-bg" aria-hidden="true"></div>

      <!-- Mobile fallback notice matching reference site -->
      <div class="mobile-notice lg-hidden">
        <div class="notice-card animate-fade-up">
          <svg class="notice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="20" height="14" x="2" y="3" rx="2"/>
            <line x1="8" x2="16" y1="21" y2="21"/>
            <line x1="12" x2="12" y1="17" y2="21"/>
          </svg>
          <p class="brand-text">Pravaah</p>
          <h1 class="notice-title">Operator Console</h1>
          <p class="notice-highlight">Optimized for desktop command centers</p>
          <p class="notice-desc">
            The command center — real-time operational map, crowd intelligence, demand and capacity views, and intervention controls — needs a high-resolution workspace.
          </p>
          <p class="notice-action-text">For mobile operations, switch to the visitor experience or use a wider view.</p>
          <div class="mobile-links">
            <a routerLink="/visitor" class="mobile-link">Open Visitor Experience</a>
            <a routerLink="/" class="mobile-link-sub">Back to Pravaah</a>
          </div>
        </div>
      </div>

      <!-- Main Desktop Console Layout -->
      <div class="desktop-layout">
        <!-- Sidebar -->
        <aside class="operator-sidebar">
          <div class="sidebar-brand">
            <a routerLink="/" class="brand-link">
              <p class="brand-title">Pravaah</p>
              <p class="brand-caption">Destination intelligence</p>
            </a>
          </div>

          <!-- Navigation Links -->
          <nav class="sidebar-nav">
            <a 
              routerLink="/operator" 
              routerLinkActive="active" 
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-item">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="7" height="7" x="3" y="3" rx="1"/>
                <rect width="7" height="7" x="14" y="3" rx="1"/>
                <rect width="7" height="7" x="14" y="14" rx="1"/>
                <rect width="7" height="7" x="3" y="14" rx="1"/>
              </svg>
              Command Center
            </a>

            <a 
              routerLink="/operator/demand" 
              routerLinkActive="active" 
              class="nav-item">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m12 14 4-4"/>
                <path d="M3.34 19a10 10 0 1 1 17.32 0"/>
              </svg>
              Demand & Capacity
            </a>

            <a 
              routerLink="/operator/crowd" 
              routerLinkActive="active" 
              class="nav-item">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <path d="M16 3.128a4 4 0 0 1 0 7.744"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
              Crowd Intelligence
            </a>

            <a 
              routerLink="/operator/interventions" 
              routerLinkActive="active" 
              class="nav-item">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
                <path d="M12 9v4"/>
                <path d="M12 17h.01"/>
              </svg>
              Interventions
            </a>

            <a 
              routerLink="/operator/reports" 
              routerLinkActive="active" 
              class="nav-item">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              Reports & Distress
            </a>
          </nav>

          <!-- Interactive Demo Simulator Box -->
          <div class="demo-box-wrapper">
            <div class="demo-box">
              <div class="demo-header">
                <span class="demo-title">DEMO · {{ (eventService.demoState$ | async) }}</span>
                <span class="demo-badge">SIMULATED</span>
              </div>
              <div class="demo-actions">
                <button 
                  type="button" 
                  class="demo-btn"
                  [disabled]="(eventService.demoState$ | async) === 'spike'"
                  (click)="eventService.simulateDemandSpike()">
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15.914 4a1.5 1.5 0 0 0-2.474-1.561l-9 9A1.5 1.5 0 0 0 5.5 14h4.002a.5.5 0 0 1 .471.666L8.086 20a1.5 1.5 0 0 0 2.475 1.56l9-9A1.5 1.5 0 0 0 18.5 10h-3.997a.5.5 0 0 1-.472-.667z"/>
                  </svg>
                  Simulate demand spike
                </button>

                <button 
                  type="button" 
                  class="demo-btn"
                  [disabled]="(eventService.demoState$ | async) !== 'spike'"
                  (click)="eventService.approveResponse()">
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="m16 9-5.5 5.5L8 12"/>
                  </svg>
                  Approve response
                </button>

                <button 
                  type="button" 
                  class="demo-btn"
                  (click)="eventService.resetDemo()">
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                  </svg>
                  Reset demo
                </button>
              </div>
            </div>
          </div>
        </aside>

        <!-- Right Content Column -->
        <div class="content-col">
          <!-- Top Header -->
          <header class="operator-header">
            <div class="header-left">
              <h1 class="header-title">MEGA EVENT OPERATIONS COMMAND CENTER</h1>
              
              <!-- Event Dropdown Switcher (Step 6) -->
              <div class="event-switcher">
                <select 
                  [ngModel]="(eventService.activeEvent$ | async)?.id" 
                  (ngModelChange)="onEventChange($event)"
                  class="event-select">
                  <option *ngFor="let ev of (eventService.events$ | async)" [value]="ev.id">
                    {{ ev.name }} ({{ ev.city }}) {{ !ev.hasCameraCoverage ? '· [No-Cameras]' : '' }}
                  </option>
                </select>
                <span class="event-meta">
                  {{ (eventService.activeEvent$ | async)?.location }} · {{ (eventService.activeEvent$ | async)?.dateRange }}
                </span>
              </div>
            </div>

            <div class="header-right">
              <!-- Live Alerts Notification Bell with Counter -->
              <a routerLink="/operator" class="bell-btn" aria-label="Alerts">
                <svg class="bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.268 21a2 2 0 0 0 3.464 0"/>
                  <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>
                </svg>
                <span *ngIf="(eventService.alerts$ | async)?.length" class="alert-count-pill">
                  {{ (eventService.alerts$ | async)?.length }}
                </span>
              </a>

              <!-- OP User Badge -->
              <div class="user-chip" title="Logged in as Command Operator">
                <span>OP</span>
              </div>

              <!-- Visitor App Switcher -->
              <a routerLink="/visitor" class="switch-app-btn" title="Open Visitor Interface">
                Visitor View →
              </a>
            </div>
          </header>

          <!-- Main Scrollable Stage -->
          <main class="main-stage">
            <router-outlet></router-outlet>
          </main>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .operator-theme {
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: var(--background);
      color: var(--foreground);
    }

    .ambient-bg {
      position: fixed;
      inset: 0;
      background: var(--background);
      z-index: -10;
      pointer-events: none;
    }

    .lg-hidden {
      display: none;
    }

    @media (max-width: 1024px) {
      .lg-hidden {
        display: flex;
      }
      .desktop-layout {
        display: none !important;
      }
    }

    .mobile-notice {
      min-height: 100vh;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .notice-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.75rem;
      text-align: center;
      max-width: 360px;
    }

    .notice-icon {
      width: 36px;
      height: 36px;
      margin: 0 auto;
      color: var(--foreground-muted);
    }

    .brand-text {
      margin-top: 1rem;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--foreground);
    }

    .notice-title {
      font-size: 0.85rem;
      color: var(--foreground-muted);
      margin-top: 0.2rem;
    }

    .notice-highlight {
      margin-top: 1.25rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--foreground);
    }

    .notice-desc {
      margin-top: 0.5rem;
      font-size: 0.8rem;
      line-height: 1.5;
      color: var(--foreground-muted);
    }

    .notice-action-text {
      margin-top: 0.75rem;
      font-size: 0.8rem;
      color: var(--foreground);
    }

    .mobile-links {
      margin-top: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .mobile-link {
      padding: 8px 14px;
      background: #3b82f6;
      color: #fff;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .mobile-link-sub {
      font-size: 0.75rem;
      color: var(--foreground-muted);
      text-decoration: underline;
    }

    .desktop-layout {
      display: flex;
      height: 100vh;
      width: 100%;
      overflow: hidden;
    }

    .operator-sidebar {
      width: 240px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      background: var(--surface);
      border-right: 1px solid var(--border);
      padding: 1rem 0.75rem;
    }

    .sidebar-brand {
      margin-bottom: 1.5rem;
      padding: 0 0.5rem;
    }

    .brand-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--foreground);
    }

    .brand-caption {
      font-size: 0.7rem;
      color: var(--foreground-muted);
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--foreground-muted);
      transition: all 0.15s ease;
    }

    .nav-item:hover {
      background: var(--surface-muted);
      color: var(--foreground);
    }

    .nav-item.active {
      background: var(--surface-muted);
      color: var(--foreground);
      font-weight: 600;
    }

    .nav-icon {
      width: 15px;
      height: 15px;
    }

    .demo-box-wrapper {
      margin-top: 1rem;
    }

    .demo-box {
      border: 1px dashed var(--border);
      background: rgba(0, 0, 0, 0.2);
      border-radius: 0.5rem;
      padding: 0.75rem;
    }

    .demo-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .demo-title {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--foreground-muted);
    }

    .demo-badge {
      font-size: 0.6rem;
      padding: 1px 5px;
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border-radius: 4px;
      font-weight: 600;
    }

    .demo-actions {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .demo-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px;
      border-radius: 0.35rem;
      font-size: 0.73rem;
      color: var(--foreground-muted);
      background: transparent;
      text-align: left;
      transition: all 0.15s ease;
    }

    .demo-btn:hover:not(:disabled) {
      background: var(--surface-muted);
      color: var(--foreground);
    }

    .demo-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    .btn-icon {
      width: 13px;
      height: 13px;
    }

    .content-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    }

    .operator-header {
      height: 58px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      flex-shrink: 0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .header-title {
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--foreground);
    }

    .event-switcher {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .event-select {
      background: var(--surface-muted);
      border: 1px solid var(--border);
      border-radius: 0.4rem;
      padding: 4px 8px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--foreground);
      outline: none;
      cursor: pointer;
    }

    .event-select:focus {
      border-color: #3b82f6;
    }

    .event-meta {
      font-size: 0.75rem;
      color: var(--foreground-muted);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .bell-btn {
      position: relative;
      width: 34px;
      height: 34px;
      border: 1px solid var(--border);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--foreground-muted);
      transition: background 0.15s;
    }

    .bell-btn:hover {
      background: var(--surface-muted);
    }

    .bell-icon {
      width: 15px;
      height: 15px;
    }

    .alert-count-pill {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 16px;
      height: 16px;
      background: var(--risk-critical);
      color: #fff;
      font-size: 0.65rem;
      font-weight: 700;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-chip {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--surface-muted);
      color: var(--foreground-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid var(--border);
    }

    .switch-app-btn {
      font-size: 0.75rem;
      font-weight: 500;
      color: #60a5fa;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background 0.15s;
    }

    .switch-app-btn:hover {
      background: rgba(59, 130, 246, 0.1);
    }

    .main-stage {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 1.5rem;
    }
  `]
})
export class OperatorShellComponent {
  constructor(public eventService: EventService, private authService: AuthService, private router: Router) {}

  onEventChange(valOrEvent: any): void {
    const val = typeof valOrEvent === 'string' ? valOrEvent : valOrEvent?.target?.value;
    if (val) {
      this.eventService.selectEvent(val);
    }
  }
}
