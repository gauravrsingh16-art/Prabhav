import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { OfflineService } from '../../../services/offline.service';

@Component({
  selector: 'app-visitor-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="visitor-profile-container animate-page-in">
      <div class="profile-header">
        <h1 class="profile-title">Profile & Settings</h1>
        <p class="profile-sub">Telemetry preferences and offline emergency toolkit</p>
      </div>

      <!-- User Card -->
      <div class="user-card">
        <div class="avatar-circle">
          <span>AS</span>
        </div>
        <div class="user-details">
          <h2 class="user-name">{{ (authService.currentUser$ | async)?.fullName || 'Arjun Sharma' }}</h2>
          <p class="user-role">Role: <strong>VISITOR</strong> · Verified Public Pass</p>
          <p class="user-email">arjun&#64;pravaah.app</p>
        </div>
      </div>

      <!-- Offline Synchronization Manager (Step 19) -->
      <div class="offline-mgmt-card">
        <div class="card-head">
          <h3 class="card-title">Offline Intelligence Cache</h3>
          <span class="badge" [class.badge-low]="!(offlineService.isOffline$ | async)" [class.badge-critical]="(offlineService.isOffline$ | async)">
            {{ (offlineService.isOffline$ | async) ? 'OFFLINE' : 'ONLINE' }}
          </span>
        </div>
        <p class="card-desc">
          When network congestion strikes during mega events, PRAVAAH continues rendering cached venue boundaries, emergency stations, and predefined safe corridors.
        </p>

        <div class="sync-status-row">
          <span>Last Synchronized:</span>
          <strong>{{ (offlineService.lastSync$ | async) }}</strong>
        </div>

        <button type="button" class="btn-force-sync" (click)="offlineService.triggerSync()">
          Force Cache Refresh Now
        </button>
      </div>

      <!-- Emergency Hotline Card -->
      <div class="emergency-contacts-card">
        <h3 class="card-title">Dedicated Event Emergency Helplines</h3>
        <div class="contact-list">
          <div class="contact-row">
            <span>National Emergency</span>
            <strong>112</strong>
          </div>
          <div class="contact-row">
            <span>Ambulance & Medical Post</span>
            <strong>108</strong>
          </div>
          <div class="contact-row">
            <span>Mela Lost & Found Control</span>
            <strong>+91 532 2451000</strong>
          </div>
        </div>
      </div>

      <!-- Role Switcher & Operator Access -->
      <div class="role-switch-box">
        <a routerLink="/operator" class="btn-goto-op">
          Switch to Operator Command Center →
        </a>
        <a routerLink="/login" class="btn-logout" (click)="authService.logout()">
          Log Out / Switch Account
        </a>
      </div>
    </div>
  `,
  styles: [`
    .visitor-profile-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding: 1.25rem 1.25rem 2rem;
    }

    .profile-title { font-size: 1.25rem; font-weight: 700; color: var(--foreground); }
    .profile-sub { font-size: 0.8rem; color: var(--foreground-muted); margin-top: 0.15rem; }

    .user-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1rem;
    }

    .avatar-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #3b82f6;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .user-name { font-size: 1rem; font-weight: 700; color: var(--foreground); }
    .user-role { font-size: 0.75rem; color: var(--foreground-muted); margin-top: 0.15rem; }
    .user-email { font-size: 0.75rem; color: var(--foreground-muted); }

    .offline-mgmt-card, .emergency-contacts-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0.85rem;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .card-head { display: flex; justify-content: space-between; align-items: center; }
    .card-title { font-size: 0.85rem; font-weight: 600; color: var(--foreground); }
    .card-desc { font-size: 0.75rem; color: var(--foreground-muted); line-height: 1.45; }

    .sync-status-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      padding: 6px 10px;
      background: var(--surface-muted);
      border-radius: 6px;
      margin-top: 0.25rem;
    }

    .btn-force-sync {
      padding: 8px;
      background: var(--surface-muted);
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--foreground);
      margin-top: 0.25rem;
    }

    .contact-list { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.25rem; }
    .contact-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.78rem;
      padding-bottom: 0.35rem;
      border-bottom: 1px solid var(--border);
    }

    .role-switch-box {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .btn-goto-op {
      padding: 10px;
      background: #1e293b;
      color: #60a5fa;
      text-align: center;
      border-radius: 0.65rem;
      font-size: 0.82rem;
      font-weight: 600;
      border: 1px solid #334155;
    }

    .btn-logout {
      padding: 8px;
      color: var(--foreground-muted);
      text-align: center;
      font-size: 0.78rem;
      text-decoration: underline;
    }
  `]
})
export class VisitorProfileComponent {
  constructor(public authService: AuthService, public offlineService: OfflineService) {}
}
