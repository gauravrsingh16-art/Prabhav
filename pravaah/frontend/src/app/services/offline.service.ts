import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface QueuedAction {
  id: string;
  type: 'VISITOR_REPORT' | 'SOS' | 'STUCK_REQUEST' | 'INTERVENTION';
  payload: any;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private isOfflineSubject = new BehaviorSubject<boolean>(!navigator.onLine);
  public isOffline$: Observable<boolean> = this.isOfflineSubject.asObservable();

  private lastSyncSubject = new BehaviorSubject<string>(
    localStorage.getItem('pravaah_last_sync') || new Date().toLocaleTimeString()
  );
  public lastSync$: Observable<string> = this.lastSyncSubject.asObservable();

  private queue: QueuedAction[] = [];
  private apiUrl = 'http://localhost:5000/api/offline';

  constructor(private http: HttpClient) {
    this.loadQueue();
    this.setupListeners();
  }

  public get isOffline(): boolean {
    return this.isOfflineSubject.value;
  }

  public get lastSync(): string {
    return this.lastSyncSubject.value;
  }

  private setupListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOfflineSubject.next(false);
        this.triggerSync();
      });

      window.addEventListener('offline', () => {
        this.isOfflineSubject.next(true);
      });
    }
  }

  public recordSync(): void {
    const time = new Date().toLocaleTimeString();
    this.lastSyncSubject.next(time);
    localStorage.setItem('pravaah_last_sync', time);
  }

  public cacheEventData(eventId: string, data: any): void {
    try {
      localStorage.setItem(`pravaah_cache_${eventId}`, JSON.stringify(data));
      this.recordSync();
    } catch (e) {
      console.warn('Failed to cache event data offline:', e);
    }
  }

  public getCachedEventData(eventId: string): any | null {
    try {
      const raw = localStorage.getItem(`pravaah_cache_${eventId}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  public queueAction(type: QueuedAction['type'], payload: any): void {
    const item: QueuedAction = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      payload,
      timestamp: new Date().toISOString()
    };
    this.queue.push(item);
    this.saveQueue();
    console.log(`[OfflineQueue] Queued action: ${type}`, item);

    // If online, attempt immediate sync
    if (!this.isOffline) {
      this.triggerSync();
    }
  }

  public triggerSync(): void {
    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    console.log(`[OfflineQueue] Synchronizing ${batch.length} items to backend...`);

    this.http.post<any>(`${this.apiUrl}/sync`, { queue: batch }).subscribe({
      next: (res) => {
        console.log('✅ [OfflineQueue] Sync completed successfully:', res);
        this.queue = [];
        this.saveQueue();
        this.recordSync();
      },
      error: (err) => {
        console.warn('⚠️ [OfflineQueue] Sync failed, will retry next connection event:', err.message);
      }
    });
  }

  private saveQueue(): void {
    localStorage.setItem('pravaah_offline_queue', JSON.stringify(this.queue));
  }

  private loadQueue(): void {
    const raw = localStorage.getItem('pravaah_offline_queue');
    if (raw) {
      try {
        this.queue = JSON.parse(raw);
      } catch (e) {
        this.queue = [];
      }
    }
  }
}
