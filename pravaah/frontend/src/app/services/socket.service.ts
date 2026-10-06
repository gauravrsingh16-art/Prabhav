import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;
  private serverUrl = 'http://localhost:5000';

  public crowdUpdate$ = new Subject<any>();
  public alertNew$ = new Subject<any>();
  public alertResolved$ = new Subject<any>();
  public gateUpdate$ = new Subject<any>();
  public gateAnalysisUpdated$ = new Subject<any>();
  public zoneUpdate$ = new Subject<any>();
  public userLocation$ = new Subject<any>();
  public emergencySos$ = new Subject<any>();
  public emergencyStuck$ = new Subject<any>();
  public interventionApproved$ = new Subject<any>();
  public offlineSync$ = new Subject<any>();
  public reconnected$ = new Subject<void>();

  public isConnected = false;

  constructor() {
    this.connect();
  }

  private connect(): void {
    try {
      this.socket = io(this.serverUrl, {
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 10,
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('⚡ [PRAVAAH Socket.IO] Connected to real-time orchestrator server');
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        console.warn('🔌 [PRAVAAH Socket.IO] Disconnected from server');
      });

      this.socket.io.on('reconnect', () => {
        console.log('🔄 [PRAVAAH Socket.IO] Reconnected to server, refreshing state...');
        this.reconnected$.next();
      });

      this.socket.on('crowd:update', (data) => this.crowdUpdate$.next(data));
      this.socket.on('alert:new', (data) => this.alertNew$.next(data));
      this.socket.on('alert:resolved', (data) => this.alertResolved$.next(data));
      this.socket.on('gate:update', (data) => {
        this.gateUpdate$.next(data);
        this.gateAnalysisUpdated$.next(data);
      });
      this.socket.on('gate:analysis-updated', (data) => {
        this.gateAnalysisUpdated$.next(data);
        this.gateUpdate$.next(data);
      });
      this.socket.on('zone:update', (data) => this.zoneUpdate$.next(data));
      this.socket.on('user:location', (data) => this.userLocation$.next(data));
      this.socket.on('emergency:sos', (data) => this.emergencySos$.next(data));
      this.socket.on('emergency:stuck', (data) => this.emergencyStuck$.next(data));
      this.socket.on('intervention:approved', (data) => this.interventionApproved$.next(data));
      this.socket.on('offline:sync', (data) => this.offlineSync$.next(data));
    } catch (e) {
      console.warn('Socket.IO connection could not be established immediately, offline fallback active.', e);
    }
  }

  public joinEvent(eventId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join:event', eventId);
    }
  }

  public sendUserLocation(data: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('user:location', data);
    }
  }

  public sendEmergencySOS(data: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('emergency:sos', data);
    }
  }

  public sendEmergencyStuck(data: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('emergency:stuck', data);
    }
  }

  public sendAlert(data: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('alert:new', data);
    }
    // Deliver locally immediately for instantaneous UI updates
    this.alertNew$.next(data);
  }

  public sendGateUpdate(data: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('gate:update', data);
    }
    this.gateUpdate$.next(data);
  }
}
