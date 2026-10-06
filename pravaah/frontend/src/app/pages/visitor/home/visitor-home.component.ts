import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { EventService } from '../../../services/event.service';
import { MegaEvent } from '../../../models/pravaah.models';

@Component({
  selector: 'app-visitor-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="visitor-home animate-page-in">
      <!-- Top Visitor Bar -->
      <div class="top-bar">
        <p class="brand-tag">Pravaah</p>
        <div class="top-row">
          <div class="city-selector">
            <svg class="pin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span class="city-name">{{ (eventService.activeEvent$ | async)?.city || 'Prayagraj' }}</span>
          </div>

          <a routerLink="/operator" class="notif-btn" aria-label="Command Mode" title="Switch to Operator Console">
            <svg class="bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- Welcome Heading -->
      <div class="welcome-box">
        <h1 class="welcome-title">Where are you planning to go?</h1>
        <p class="welcome-sub">
          Pick the event you're attending and we'll plan the safest route and entry time, <strong>Arjun</strong>.
        </p>
      </div>

      <!-- Search Events Input -->
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.34-4.34"/>
        </svg>
        <input 
          type="search" 
          [(ngModel)]="searchQuery"
          placeholder="Search events, host cities or event types" 
          class="search-input" />
      </div>

      <!-- Suggested For You (Step 6) -->
      <div class="events-group">
        <div class="group-header">
          <h2 class="group-title">Suggested for you</h2>
          <span class="group-sub">High-demand events</span>
        </div>

        <div class="cards-stack">
          <div 
            *ngFor="let ev of filteredEvents" 
            class="event-card"
            (click)="selectAndNavigate(ev)">
            <div class="card-left-icon">
              <svg class="event-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 18v-7"/><path d="M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z"/>
                <path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M3 22h18"/><path d="M6 18v-7"/>
              </svg>
            </div>

            <div class="card-details">
              <div class="card-name-row">
                <h3 class="event-name">{{ ev.name }}</h3>
              </div>
              <p class="event-location">{{ ev.city }} · {{ ev.dateRange }}</p>
              <p class="event-category">{{ ev.category }}</p>

              <div class="card-badges">
                <span class="badge badge-high">Very high expected demand</span>
                <span *ngIf="ev.hasCameraCoverage" class="badge badge-low">Full plan available</span>
                <span *ngIf="!ev.hasCameraCoverage" class="badge badge-medium">No-Camera Mode</span>
              </div>
            </div>

            <svg class="chevron-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Trust Note Chip -->
      <div class="trust-note">
        <svg class="spark-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>
        </svg>
        <p>
          We weigh accommodation, transport, venue capacity and crowd movement together — not just distance or price.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .visitor-home {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding: 1.25rem 1.25rem 2rem;
    }

    .top-bar {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .brand-tag {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--foreground-muted);
      letter-spacing: 0.05em;
    }

    .top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .city-selector {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--foreground);
    }

    .pin-icon {
      width: 16px;
      height: 16px;
      color: var(--foreground-muted);
    }

    .notif-btn {
      width: 32px;
      height: 32px;
      border: 1px solid var(--border);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--foreground-muted);
    }

    .bell-icon {
      width: 14px;
      height: 14px;
    }

    .welcome-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--foreground);
      line-height: 1.3;
    }

    .welcome-sub {
      margin-top: 0.35rem;
      font-size: 0.85rem;
      line-height: 1.45;
      color: var(--foreground-muted);
    }

    .search-box {
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      color: var(--foreground-muted);
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      height: 46px;
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      background: var(--surface);
      padding: 0 1rem 0 2.5rem;
      font-size: 0.85rem;
      color: var(--foreground);
      outline: none;
    }

    .search-input:focus {
      border-color: #3b82f6;
    }

    .events-group {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .group-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
    }

    .group-title {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--foreground);
    }

    .group-sub {
      font-size: 0.72rem;
      color: var(--foreground-muted);
    }

    .cards-stack {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .event-card {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .event-card:hover {
      border-color: rgba(59, 130, 246, 0.4);
      transform: translateY(-1px);
    }

    .card-left-icon {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: var(--surface-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .event-icon {
      width: 18px;
      height: 18px;
      color: var(--foreground);
    }

    .card-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .event-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--foreground);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .event-location {
      font-size: 0.72rem;
      color: var(--foreground-muted);
      margin-top: 0.15rem;
    }

    .event-category {
      font-size: 0.72rem;
      color: var(--foreground-muted);
      opacity: 0.8;
      margin-top: 0.1rem;
    }

    .card-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-top: 0.5rem;
    }

    .chevron-right {
      width: 16px;
      height: 16px;
      color: var(--foreground-muted);
      align-self: center;
      flex-shrink: 0;
    }

    .trust-note {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      background: var(--surface-muted);
      border-radius: 0.75rem;
      padding: 0.75rem;
      font-size: 0.75rem;
      color: var(--foreground-muted);
      line-height: 1.45;
    }

    .spark-icon {
      width: 15px;
      height: 15px;
      color: var(--foreground-muted);
      margin-top: 2px;
      flex-shrink: 0;
    }
  `]
})
export class VisitorHomeComponent {
  searchQuery = '';

  constructor(public eventService: EventService, private router: Router) {}

  get filteredEvents(): MegaEvent[] {
    const list = this.eventService.eventsSubject?.value || [];
    if (!this.searchQuery.trim()) return list;
    const q = this.searchQuery.toLowerCase();
    return list.filter(e => 
      e.name.toLowerCase().includes(q) || 
      e.city.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    );
  }

  selectAndNavigate(event: MegaEvent): void {
    this.eventService.selectEvent(event.id);
    this.router.navigate(['/visitor/live']);
  }
}
