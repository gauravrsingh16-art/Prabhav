import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserGPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private locationSubject = new BehaviorSubject<UserGPSLocation | null>(null);
  public location$: Observable<UserGPSLocation | null> = this.locationSubject.asObservable();

  private statusSubject = new BehaviorSubject<'ACQUIRING' | 'AVAILABLE' | 'UNAVAILABLE' | 'DENIED'>('ACQUIRING');
  public status$: Observable<'ACQUIRING' | 'AVAILABLE' | 'UNAVAILABLE' | 'DENIED'> = this.statusSubject.asObservable();

  private watchId: number | null = null;

  constructor() {
    this.startTracking();
  }

  public startTracking(): void {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      this.statusSubject.next('UNAVAILABLE');
      return;
    }

    try {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const loc: UserGPSLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
            timestamp: pos.timestamp
          };
          this.locationSubject.next(loc);
          this.statusSubject.next('AVAILABLE');
        },
        (err) => {
          console.warn('GPS location tracking error:', err.message);
          if (err.code === err.PERMISSION_DENIED) {
            this.statusSubject.next('DENIED');
          } else {
            this.statusSubject.next('UNAVAILABLE');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000
        }
      );
    } catch (e) {
      this.statusSubject.next('UNAVAILABLE');
    }
  }

  public stopTracking(): void {
    if (this.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  public get currentLocation(): UserGPSLocation | null {
    return this.locationSubject.value;
  }
}
