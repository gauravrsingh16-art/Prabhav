import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/pravaah.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-wrapper operator-theme">
      <div class="login-card animate-fade-up">
        <div class="logo-box">
          <p class="brand-name">Pravaah</p>
          <h1 class="login-heading">Operational Access</h1>
          <p class="login-sub">Select your role and authenticate with SQL Server 2022</p>
        </div>

        <!-- Role Selector Tabs -->
        <div class="role-selector">
          <button 
            type="button" 
            [class.active]="selectedRole === 'OPERATOR'"
            (click)="setRole('OPERATOR')">
            <svg class="role-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="20" height="14" x="2" y="3" rx="2"/>
              <line x1="8" x2="16" y1="21" y2="21"/>
              <line x1="12" x2="12" y1="17" y2="21"/>
            </svg>
            Operator / Control
          </button>
          <button 
            type="button" 
            [class.active]="selectedRole === 'VISITOR'"
            (click)="setRole('VISITOR')">
            <svg class="role-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Visitor / User
          </button>
        </div>

        <form (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label>Username</label>
            <input 
              type="text" 
              name="username" 
              [(ngModel)]="username" 
              placeholder="e.g. operator or visitor"
              required />
          </div>

          <div class="form-group">
            <label>Password</label>
            <input 
              type="password" 
              name="password" 
              [(ngModel)]="password" 
              placeholder="••••••••••••"
              required />
          </div>

          <div *ngIf="errorMessage" class="error-banner">
            {{ errorMessage }}
          </div>

          <button type="submit" class="submit-btn" [disabled]="loading">
            <span *ngIf="!loading">
              Authenticate as {{ selectedRole === 'OPERATOR' ? 'Command Operator' : 'Event Visitor' }}
            </span>
            <span *ngIf="loading">Connecting to Node.js API...</span>
          </button>
        </form>

        <!-- Quick Demo One-Click Autologin -->
        <div class="quick-credentials">
          <p class="quick-label">Instant Demo Shortcuts:</p>
          <div class="quick-buttons">
            <button type="button" class="quick-btn" (click)="quickLogin('operator')">
              Demo Operator (Command Center)
            </button>
            <button type="button" class="quick-btn" (click)="quickLogin('visitor')">
              Demo Visitor (Arjun Sharma)
            </button>
          </div>
        </div>

        <div class="back-home">
          <a routerLink="/" class="back-link">← Back to Overview</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--background);
      color: var(--foreground);
      padding: 1.5rem;
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 1.25rem;
      padding: 2.25rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }

    .logo-box {
      text-align: center;
      margin-bottom: 1.75rem;
    }

    .brand-name {
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #3b82f6;
    }

    .login-heading {
      margin-top: 0.25rem;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--foreground);
    }

    .login-sub {
      margin-top: 0.35rem;
      font-size: 0.82rem;
      color: var(--foreground-muted);
    }

    .role-selector {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      background: var(--surface-muted);
      padding: 4px;
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .role-selector button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 12px;
      font-size: 0.8rem;
      font-weight: 500;
      border-radius: 0.5rem;
      color: var(--foreground-muted);
      transition: all 0.15s ease;
    }

    .role-selector button.active {
      background: var(--surface);
      color: var(--foreground);
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .role-icon {
      width: 14px;
      height: 14px;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .form-group label {
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--foreground-muted);
    }

    .form-group input {
      height: 44px;
      background: var(--surface-muted);
      border: 1px solid var(--border);
      border-radius: 0.65rem;
      padding: 0 1rem;
      font-size: 0.9rem;
      color: var(--foreground);
      outline: none;
      transition: border-color 0.15s;
    }

    .form-group input:focus {
      border-color: #3b82f6;
    }

    .error-banner {
      padding: 8px 12px;
      background: var(--risk-critical-bg);
      border: 1px solid var(--risk-critical);
      border-radius: 6px;
      color: var(--risk-critical);
      font-size: 0.8rem;
    }

    .submit-btn {
      height: 46px;
      background: #3b82f6;
      color: #ffffff;
      font-size: 0.9rem;
      font-weight: 600;
      border-radius: 0.65rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.15s;
      margin-top: 0.5rem;
    }

    .submit-btn:hover {
      opacity: 0.92;
    }

    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .quick-credentials {
      margin-top: 1.75rem;
      border-top: 1px solid var(--border);
      padding-top: 1.25rem;
    }

    .quick-label {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--foreground-muted);
      margin-bottom: 0.5rem;
    }

    .quick-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .quick-btn {
      padding: 7px 10px;
      background: var(--surface-muted);
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 0.75rem;
      color: var(--foreground-muted);
      text-align: left;
      transition: all 0.15s;
    }

    .quick-btn:hover {
      background: rgba(59, 130, 246, 0.1);
      border-color: #3b82f6;
      color: var(--foreground);
    }

    .back-home {
      margin-top: 1.25rem;
      text-align: center;
    }

    .back-link {
      font-size: 0.78rem;
      color: var(--foreground-muted);
      text-decoration: underline;
    }
  `]
})
export class LoginComponent {
  selectedRole: UserRole = 'OPERATOR';
  username = 'operator';
  password = 'Operator@123';
  loading = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  setRole(role: UserRole): void {
    this.selectedRole = role;
    if (role === 'OPERATOR') {
      this.username = 'operator';
      this.password = 'Operator@123';
    } else {
      this.username = 'visitor';
      this.password = 'Visitor@123';
    }
  }

  quickLogin(roleType: 'operator' | 'visitor'): void {
    if (roleType === 'operator') {
      this.setRole('OPERATOR');
    } else {
      this.setRole('VISITOR');
    }
    this.onSubmit();
  }

  onSubmit(): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.username, this.password, this.selectedRole).subscribe({
      next: (res) => {
        this.loading = false;
        if (this.selectedRole === 'OPERATOR') {
          this.router.navigate(['/operator']);
        } else {
          this.router.navigate(['/visitor']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Authentication error. Please retry.';
      }
    });
  }
}
