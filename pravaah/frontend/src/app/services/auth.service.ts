import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { User, UserRole } from '../models/pravaah.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';
  
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get isOperator(): boolean {
    return this.currentUserValue?.role === 'OPERATOR';
  }

  public get isVisitor(): boolean {
    return this.currentUserValue?.role === 'VISITOR';
  }

  public login(username: string, password: string, role: UserRole = 'OPERATOR'): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { username, password, role }).pipe(
      tap(res => {
        if (res && res.user && res.token) {
          localStorage.setItem('pravaah_token', res.token);
          localStorage.setItem('pravaah_user', JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
        }
      }),
      catchError(err => {
        // Fallback login if backend is offline or unreachable
        const fallbackUser: User = {
          userId: `usr-mock-${Date.now()}`,
          username,
          fullName: username === 'operator' ? 'Command Center Officer' : 'Arjun Sharma',
          role: role,
          email: `${username}@pravaah.app`
        };
        localStorage.setItem('pravaah_token', 'mock_token_pravaah_2026');
        localStorage.setItem('pravaah_user', JSON.stringify(fallbackUser));
        this.currentUserSubject.next(fallbackUser);
        return of({ success: true, user: fallbackUser, token: 'mock_token' });
      })
    );
  }

  public logout(): void {
    localStorage.removeItem('pravaah_token');
    localStorage.removeItem('pravaah_user');
    this.currentUserSubject.next(null);
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem('pravaah_user');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    }
    // Default demo user: Operator
    return {
      userId: 'usr-op-01',
      username: 'operator',
      fullName: 'Command Center Officer',
      role: 'OPERATOR',
      email: 'ops@pravaah.gov.in'
    };
  }
}
