import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventService } from '../../services/event.service';
import { OfflineService } from '../../services/offline.service';

@Component({
  selector: 'app-visitor-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="visitor-wrapper" [class.is-wide]="isWideMode">
      <!-- Desktop Frame Switcher (Only visible on wide desktop viewports) -->
      <div class="view-mode-bar" *ngIf="isDesktop">
        <button type="button" class="btn-toggle-view" (click)="toggleViewMode()">
          {{ isWideMode ? '📱 Switch to Phone Frame View' : '🖥️ Switch to Full Desktop View' }}
        </button>
      </div>

      <!-- Outer Phone Bezel (Desktop) / Native viewport (Mobile) -->
      <div class="device-bezel">
        <!-- Phone Top Notch Indicator -->
        <div class="phone-notch" aria-hidden="true"></div>

        <!-- Phone Screen Frame -->
        <div class="phone-screen">
          <div class="screen-layout">
            <!-- Offline Warning Banner (Step 19) -->
            <div *ngIf="offlineService.isOffline$ | async" class="offline-banner">
              <span class="offline-dot"></span>
              <span>OFFLINE MODE · Last synchronized: {{ (offlineService.lastSync$ | async) }}</span>
            </div>

            <!-- Scrollable Content View -->
            <main class="visitor-main app-scroll">
              <router-outlet></router-outlet>
            </main>

            <!-- Bottom Navigation Bar Matching Reference -->
            <nav class="bottom-nav">
              <a 
                routerLink="/visitor" 
                routerLinkActive="active" 
                [routerLinkActiveOptions]="{ exact: true }"
                class="bottom-nav-item">
                <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
                  <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
                <span>Home</span>
              </a>

              <a 
                routerLink="/visitor/plan" 
                routerLinkActive="active" 
                class="bottom-nav-item">
                <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M8 2v3"/><path d="M16 2v3"/>
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18"/><path d="M8 13h.01"/><path d="M12 13h.01"/><path d="M16 13h.01"/>
                </svg>
                <span>Plan</span>
              </a>

              <a 
                routerLink="/visitor/live" 
                routerLinkActive="active" 
                class="bottom-nav-item live-item">
                <span *ngIf="(eventService.alerts$ | async)?.length" class="live-dot-pulse"></span>
                <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M16.247 7.761a6 6 0 0 1 0 8.478"/>
                  <path d="M19.075 4.933a10 10 0 0 1 0 14.134"/>
                  <path d="M4.925 19.067a10 10 0 0 1 0-14.134"/>
                  <path d="M7.753 16.239a6 6 0 0 1 0-8.478"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
                <span>Live</span>
              </a>

              <a 
                routerLink="/visitor/profile" 
                routerLinkActive="active" 
                class="bottom-nav-item">
                <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>Profile</span>
              </a>
            </nav>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .visitor-wrapper {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      background: var(--background);
    }

    @media (min-width: 768px) {
      .visitor-wrapper {
        align-items: center;
        background: #111418;
        padding: 2rem;
      }
    }

    .device-bezel {
      position: relative;
      width: 100%;
    }

    @media (min-width: 768px) {
      .device-bezel {
        width: auto;
        border-radius: 3rem;
        border: 1px solid #262b31;
        background: #0d0d0f;
        padding: 10px;
        box-shadow: 0 24px 60px -20px rgba(0, 0, 0, 0.65);
      }
    }

    .phone-notch {
      display: none;
    }

    @media (min-width: 768px) {
      .phone-notch {
        display: block;
        pointer-events: none;
        position: absolute;
        left: 50%;
        top: 5px;
        z-index: 50;
        height: 3px;
        width: 56px;
        transform: translateX(-50%);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.2);
      }
    }

    .phone-screen {
      position: relative;
      height: 100vh;
      width: 100%;
      overflow: hidden;
      background: var(--background);
    }

    @media (min-width: 768px) {
      .phone-screen {
        height: min(844px, calc(100vh - 4rem));
        width: 390px;
        border-radius: 2.5rem;
      }
    }

    .screen-layout {
      display: flex;
      height: 100%;
      width: 100%;
      flex-direction: column;
      background: var(--background);
    }

    .offline-banner {
      background: var(--risk-critical);
      color: #fff;
      font-size: 0.68rem;
      font-weight: 600;
      padding: 5px 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      z-index: 40;
    }

    .offline-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #fff;
      animation: pulse-subtle 1s infinite;
    }

    .visitor-main {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
    }

    .bottom-nav {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-around;
      border-top: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      padding: 0.5rem 0.5rem 0.6rem;
      z-index: 30;
    }

    .bottom-nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      padding: 4px 12px;
      font-size: 0.72rem;
      font-weight: 500;
      color: var(--foreground-muted);
      border-radius: 8px;
      position: relative;
      transition: color 0.15s;
    }

    .bottom-nav-item.active {
      color: var(--foreground);
      font-weight: 700;
    }

    .nav-icon {
      width: 19px;
      height: 19px;
    }

    .live-dot-pulse {
      position: absolute;
      top: 2px;
      right: 18px;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--risk-critical);
      box-shadow: 0 0 6px var(--risk-critical);
    }

    .view-mode-bar {
      position: fixed;
      top: 14px;
      right: 20px;
      z-index: 9999;
    }

    .btn-toggle-view {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(0, 198, 255, 0.4);
      color: #00C6FF;
      font-size: 0.76rem;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 999px;
      cursor: pointer;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 14px rgba(0,0,0,0.5);
      transition: all 0.15s ease;
    }

    .btn-toggle-view:hover {
      background: rgba(0, 198, 255, 0.2);
      color: #fff;
    }

    .visitor-wrapper.is-wide {
      padding: 0 !important;
      align-items: stretch !important;
    }

    .visitor-wrapper.is-wide .device-bezel {
      width: 100% !important;
      max-width: 100% !important;
      border: none !important;
      border-radius: 0 !important;
      padding: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
    }

    .visitor-wrapper.is-wide .phone-screen {
      width: 100% !important;
      height: 100vh !important;
      border-radius: 0 !important;
    }

    .visitor-wrapper.is-wide .phone-notch {
      display: none !important;
    }
  `]
})
export class VisitorShellComponent {
  isWideMode = false;
  isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 992 : false;

  constructor(public eventService: EventService, public offlineService: OfflineService) {}

  toggleViewMode(): void {
    this.isWideMode = !this.isWideMode;
  }
}
