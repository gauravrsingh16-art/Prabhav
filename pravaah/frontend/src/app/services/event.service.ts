import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import {
  MegaEvent,
  EventLocation,
  EventVideo,
  Zone,
  Gate,
  CameraFeed,
  TransportPoint,
  EmergencyPoint,
  AlertItem,
  Intervention,
  CrowdObservation,
  VisitorReport,
  EmergencyReport
} from '../models/pravaah.models';
import { SocketService } from './socket.service';
import { OfflineService } from './offline.service';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = 'http://localhost:5000/api';

  // State Subjects
  public eventsSubject = new BehaviorSubject<MegaEvent[]>([]);
  public events$ = this.eventsSubject.asObservable();

  public activeEventSubject = new BehaviorSubject<MegaEvent | null>({
    id: 'maha-kumbh',
    name: 'Maha Kumbh Mela',
    category: 'Religious Gathering',
    city: 'Prayagraj',
    state: 'Uttar Pradesh',
    location: 'Prayagraj, Uttar Pradesh',
    dateRange: '13 Jan – 26 Feb',
    expectedVisitors: 40000000,
    status: 'normal',
    hasCameraCoverage: true,
    description: 'The world\'s largest peaceful congregation at the sacred Triveni Sangam.',
    schedule: []
  });
  public activeEvent$ = this.activeEventSubject.asObservable();

  public activeLocationSubject = new BehaviorSubject<EventLocation | null>(null);
  public activeLocation$ = this.activeLocationSubject.asObservable();

  public activeVideoSubject = new BehaviorSubject<EventVideo | null>(null);
  public activeVideo$ = this.activeVideoSubject.asObservable();

  public zonesSubject = new BehaviorSubject<Zone[]>([]);
  public zones$ = this.zonesSubject.asObservable();

  public gatesSubject = new BehaviorSubject<Gate[]>([]);
  public gates$ = this.gatesSubject.asObservable();

  public camerasSubject = new BehaviorSubject<CameraFeed[]>([]);
  public cameras$ = this.camerasSubject.asObservable();

  public transportSubject = new BehaviorSubject<TransportPoint[]>([]);
  public transport$ = this.transportSubject.asObservable();

  public emergencySubject = new BehaviorSubject<EmergencyPoint[]>([]);
  public emergency$ = this.emergencySubject.asObservable();

  public alertsSubject = new BehaviorSubject<AlertItem[]>([]);
  public alerts$ = this.alertsSubject.asObservable();

  public interventionsSubject = new BehaviorSubject<Intervention[]>([]);
  public interventions$ = this.interventionsSubject.asObservable();

  private reportsSubject = new BehaviorSubject<VisitorReport[]>([]);
  public reports$ = this.reportsSubject.asObservable();

  // Metrics State
  public overallPressure$ = new BehaviorSubject<number>(49);
  public visitorDemand$ = new BehaviorSubject<string>('70.0K');
  public transportUtilization$ = new BehaviorSubject<number>(54);
  public venueOccupancy$ = new BehaviorSubject<number>(62);
  public criticalAlerts$ = new BehaviorSubject<number>(0);

  // Demo Pipeline & State
  public demoState$ = new BehaviorSubject<'normal' | 'spike' | 'intervened'>('normal');
  public currentStep$ = new BehaviorSubject<'observed' | 'forecast' | 'recommended' | 'action' | 'outcome'>('observed');
  public isDemoData$ = new BehaviorSubject<boolean>(true);

  // Safe Route Subject
  public activeSafeRoute$ = new BehaviorSubject<[number, number][] | null>(null);

  constructor(
    private http: HttpClient,
    private socketService: SocketService,
    private offlineService: OfflineService
  ) {
    this.initSocketSubscriptions();
    this.loadEvents();
  }

  private initSocketSubscriptions(): void {
    this.socketService.alertNew$.subscribe((newAlert) => {
      const cur = this.alertsSubject.value;
      this.alertsSubject.next([newAlert, ...cur.filter(a => a.alertId !== newAlert.alertId)]);
      if (newAlert.severity === 'CRITICAL' || newAlert.severity === 'HIGH') {
        this.criticalAlerts$.next(this.criticalAlerts$.value + 1);
      }
    });

    this.socketService.alertResolved$.subscribe((resolved) => {
      const updated = this.alertsSubject.value.map(a => a.alertId === resolved.alertId ? { ...a, status: 'RESOLVED' as const } : a);
      this.alertsSubject.next(updated);
    });

    this.socketService.gateUpdate$.subscribe((data) => {
      if (data && data.gate) {
        const updated = this.gatesSubject.value.map(g => g.gateId === data.gate.gateId ? data.gate : g);
        this.gatesSubject.next(updated);
      }
    });

    this.socketService.zoneUpdate$.subscribe((data) => {
      if (data && data.zone) {
        const updated = this.zonesSubject.value.map(z => z.zoneId === data.zone.zoneId ? data.zone : z);
        this.zonesSubject.next(updated);
      }
    });

    this.socketService.interventionApproved$.subscribe((intervention) => {
      const cur = this.interventionsSubject.value;
      const updated = cur.map(i => i.interventionId === intervention.interventionId ? intervention : i);
      if (!cur.some(i => i.interventionId === intervention.interventionId)) {
        updated.unshift(intervention);
      }
      this.interventionsSubject.next(updated);
    });
  }

  public loadEvents(): void {
    this.http.get<any>(`${this.apiUrl}/events`).subscribe({
      next: (res) => {
        if (res && res.events) {
          const allowedIds = ['maha-kumbh', 'stadium-event', 'mumbai-ganpati', 'jantar-mantar'];
          const filtered = res.events.filter((e: any) => allowedIds.includes(e.id));
          const finalEvents = filtered.length ? filtered : res.events;
          this.eventsSubject.next(finalEvents);
          // Set default to Maha Kumbh
          const defaultEvent = finalEvents.find((e: any) => e.id === 'maha-kumbh') || finalEvents[0];
          this.selectEvent(defaultEvent.id);
        }
      },
      error: () => {
        // Fallback default events
        this.eventsSubject.next([
          {
            id: 'maha-kumbh',
            name: 'Maha Kumbh Mela',
            category: 'Religious Gathering',
            city: 'Prayagraj',
            state: 'Uttar Pradesh',
            location: 'Prayagraj, Uttar Pradesh',
            dateRange: '13 Jan – 26 Feb',
            expectedVisitors: 40000000,
            status: 'normal',
            hasCameraCoverage: true,
            description: 'The world\'s largest peaceful congregation at the sacred Triveni Sangam.',
            schedule: [
              { id: 'sc-1', time: '05:00 AM', title: 'Morning Snan (Holy Bath)', venueId: 'main-venue', expectedImpact: 'low' },
              { id: 'sc-2', time: '11:30 AM', title: 'Akharas Royal Procession', venueId: 'main-venue', expectedImpact: 'high' },
              { id: 'sc-3', time: '06:00 PM', title: 'Main Ghat Maha Aarti', venueId: 'main-venue', expectedImpact: 'high' }
            ]
          }
        ]);
        this.selectEvent('maha-kumbh');
      }
    });
  }

  public selectEvent(eventId: string): void {
    const event = this.eventsSubject.value.find(e => e.id === eventId);
    if (event) {
      this.activeEventSubject.next(event);
      this.socketService.joinEvent(eventId);
      this.loadEventDetails(eventId);
    }
  }

  public loadEventDetails(eventId: string): void {
    // 1. Location
    this.http.get<any>(`${this.apiUrl}/events/${eventId}/location`).subscribe(res => {
      if (res && res.location) this.activeLocationSubject.next(res.location);
    });

    // 2. Video
    this.http.get<any>(`${this.apiUrl}/events/${eventId}/video`).subscribe(res => {
      if (res && res.video) this.activeVideoSubject.next(res.video);
    });

    // 3. Gates
    this.http.get<any>(`${this.apiUrl}/events/${eventId}/gates`).subscribe(res => {
      if (res && res.gates) this.gatesSubject.next(res.gates);
    });

    // 4. Zones
    this.http.get<any>(`${this.apiUrl}/events/${eventId}/zones`).subscribe(res => {
      if (res && res.zones) this.zonesSubject.next(res.zones);
    });

    // 5. Cameras
    this.http.get<any>(`${this.apiUrl}/events/${eventId}/cameras`).subscribe(res => {
      if (res && res.cameras) this.camerasSubject.next(res.cameras);
    });

    // 6. Transport
    this.http.get<any>(`${this.apiUrl}/events/${eventId}/transport`).subscribe(res => {
      if (res && res.transport) this.transportSubject.next(res.transport);
    });

    // 7. Emergency Points
    this.http.get<any>(`${this.apiUrl}/events/${eventId}/emergency-points`).subscribe(res => {
      if (res && res.emergencyPoints) this.emergencySubject.next(res.emergencyPoints);
    });

    // 8. Alerts
    this.http.get<any>(`${this.apiUrl}/events/${eventId}/alerts`).subscribe(res => {
      if (res && res.alerts) this.alertsSubject.next(res.alerts);
    });

    // 9. Interventions
    this.http.get<any>(`${this.apiUrl}/interventions?eventId=${eventId}`).subscribe(res => {
      if (res && res.interventions) this.interventionsSubject.next(res.interventions);
    });
  }

  // Demo Controls
  public simulateDemandSpike(): void {
    this.demoState$.next('spike');
    this.currentStep$.next('recommended');
    this.overallPressure$.next(78);
    this.visitorDemand$.next('112.4K');
    this.transportUtilization$.next(82);
    this.venueOccupancy$.next(89);
    this.criticalAlerts$.next(1);

    // Make Gate 2 congested and emit alert
    const gates = this.gatesSubject.value.map(g => {
      if (g.gateId === 'gt-kumbh-2') {
        return { ...g, status: 'CONGESTED' as const, queueTimeMinutes: 28, flowRatePerMin: 420 };
      }
      return g;
    });
    this.gatesSubject.next(gates);

    const spikeAlert: AlertItem = {
      alertId: `alt-spike-${Date.now()}`,
      eventId: this.activeEventSubject.value?.id || 'maha-kumbh',
      title: 'High Crowd at Gate 2',
      message: 'Gate 2 queue length has exceeded 28 minutes. Ingress rate 420/min.',
      recommendation: 'USE GATE 3',
      targetGateId: 'gt-kumbh-2',
      severity: 'HIGH',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    this.alertsSubject.next([spikeAlert, ...this.alertsSubject.value]);
  }

  public approveResponse(): void {
    this.demoState$.next('intervened');
    this.currentStep$.next('outcome');
    this.overallPressure$.next(52);
    this.transportUtilization$.next(58);
    this.venueOccupancy$.next(64);
    this.criticalAlerts$.next(0);

    // Relieve Gate 2
    const gates = this.gatesSubject.value.map(g => {
      if (g.gateId === 'gt-kumbh-2') {
        return { ...g, status: 'OPEN' as const, queueTimeMinutes: 7, flowRatePerMin: 180 };
      }
      return g;
    });
    this.gatesSubject.next(gates);

    // Add executed intervention
    const approvedIntervention: Intervention = {
      interventionId: `int-exec-${Date.now()}`,
      eventId: this.activeEventSubject.value?.id || 'maha-kumbh',
      title: 'Redirected visitors to Gate 3',
      actionType: 'REDIRECT',
      targetEntity: 'Gate 2 ➔ Gate 3',
      description: 'Incoming flow diverted via North Causeway signage and mobile app advisory.',
      beforeState: 'HIGH (28 min queue, 420/min)',
      afterState: 'MODERATE (7 min queue, 180/min)',
      status: 'COMPLETED',
      measuredOutcome: 'Gate 2 congestion reduced by 71%. Ingress normalized within 12 minutes.',
      createdAt: new Date().toISOString()
    };
    this.interventionsSubject.next([approvedIntervention, ...this.interventionsSubject.value]);
  }

  public resetDemo(): void {
    this.demoState$.next('normal');
    this.currentStep$.next('observed');
    this.overallPressure$.next(49);
    this.visitorDemand$.next('70.0K');
    this.transportUtilization$.next(54);
    this.venueOccupancy$.next(62);
    this.criticalAlerts$.next(0);
    this.activeSafeRoute$.next(null);

    if (this.activeEventSubject.value) {
      this.loadEventDetails(this.activeEventSubject.value.id);
    }
  }

  // Safe Route Computation
  public generateSafeRoute(): [number, number][] {
    const loc = this.activeLocationSubject.value;
    const centerLat = loc ? loc.latitude : 25.4294;
    const centerLng = loc ? loc.longitude : 81.8841;

    // Route avoiding Gate 2 (Sangam Direct) and passing through Gate 3 (North Causeway)
    const route: [number, number][] = [
      [centerLat + 0.008, centerLng - 0.009],
      [centerLat + 0.007, centerLng - 0.004],
      [centerLat + 0.0064, centerLng + 0.0005], // Gate 3 Approach
      [centerLat + 0.003, centerLng + 0.002],
      [centerLat, centerLng] // Destination (Sangam)
    ];

    this.activeSafeRoute$.next(route);
    return route;
  }
}
