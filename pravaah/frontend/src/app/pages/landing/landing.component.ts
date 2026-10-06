import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { EventService } from '../../services/event.service';
import { MegaEvent, Zone, Gate, TransportPoint, EmergencyPoint, CameraFeed } from '../../models/pravaah.models';

interface EventGeoConfig {
  lat: number;
  lng: number;
  zoom: number;
  densityText: string;
  densityPercent: number;
  incidents: string;
  safeRouteInfo: string;
  heatZones: Array<{ lat: number; lng: number; radius: number; color: string; name: string; desc: string }>;
  gates: Array<{ lat: number; lng: number; name: string; status: string; statusClass: string; color: string; iconSvg: string; queue: string; flow: string }>;
  route: Array<[number, number]>;
  cameras: Array<{ lat: number; lng: number; name: string; density: number }>;
  transport: Array<{ lat: number; lng: number; name: string; type: string; occ: number }>;
  emergency: Array<{ lat: number; lng: number; name: string; type: string }>;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingPageComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('bgVideo') bgVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('circularLeafletMap') circularMapRef!: ElementRef<HTMLDivElement>;

  // Allowed 4 events strictly matching the specification
  private readonly ALLOWED_EVENT_IDS = [
    'jantar-mantar',
    'maha-kumbh',
    'stadium-event',
    'mumbai-ganpati'
  ];

  // Specific geographic configurations for each approved event
  private readonly eventGeoConfigs: Record<string, EventGeoConfig> = {
    'maha-kumbh': {
      lat: 25.4310,
      lng: 81.8870,
      zoom: 13,
      densityText: 'VERY HIGH',
      densityPercent: 92,
      incidents: '02',
      safeRouteInfo: 'GATE 3 · 12 min',
      heatZones: [
        {
          lat: 25.4380, lng: 81.8830, radius: 550, color: '#FF3B5C',
          name: 'Critical Heat Zone: Sangam Core & Gate 2 (92% Saturation)',
          desc: 'Peak saturation along main bathing ghats. Marshals dispatched.'
        },
        {
          lat: 25.4280, lng: 81.8700, radius: 480, color: '#FFB020',
          name: 'Moderate Heat Zone: Parade Ground Entry (64%)',
          desc: 'Steady inflow from railway transit buses.'
        },
        {
          lat: 25.4340, lng: 81.9020, radius: 460, color: '#00D6A3',
          name: 'Open Dispersal Zone: Arail Ghat (38%)',
          desc: 'Safe alternative movement corridor with available boat & shuttle transit.'
        }
      ],
      gates: [
        {
          lat: 25.4280, lng: 81.8740,
          name: 'GATE 1',
          status: 'MODERATE',
          statusClass: 'status-amber',
          color: '#FFB020',
          iconSvg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 4H5a2 2 0 0 0-2 2v14h2V6h14v14h2V6a2 2 0 0 0-2-2z"/></svg>',
          queue: '12 min',
          flow: '420/min'
        },
        {
          lat: 25.4335, lng: 81.8840,
          name: 'GATE 2',
          status: 'CONGESTED',
          statusClass: 'status-red',
          color: '#FF3B5C',
          iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
          queue: '34 min',
          flow: '840/min'
        },
        {
          lat: 25.4340, lng: 81.8980,
          name: 'GATE 3',
          status: 'OPEN',
          statusClass: 'status-green',
          color: '#00D6A3',
          iconSvg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 4H5a2 2 0 0 0-2 2v14h2V6h14v14h2V6a2 2 0 0 0-2-2z"/></svg>',
          queue: '4 min',
          flow: '280/min'
        }
      ],
      route: [
        [25.4280, 81.8740],
        [25.4295, 81.8790],
        [25.4310, 81.8835],
        [25.4325, 81.8890],
        [25.4340, 81.8980]
      ],
      cameras: [
        { lat: 25.4305, lng: 81.8855, name: 'CAM-01 Sangam Confluence High-Mast', density: 92 },
        { lat: 25.4328, lng: 81.8825, name: 'CAM-02 Gate 2 North Bottleneck', density: 88 },
        { lat: 25.4320, lng: 81.8890, name: 'CAM-03 Pontoon Bridge 3 East', density: 45 },
        { lat: 25.4270, lng: 81.8760, name: 'CAM-04 Parade Ground South Entry', density: 62 }
      ],
      transport: [
        { lat: 25.4245, lng: 81.8720, name: 'Parade Ground Shuttle Terminal', type: 'Electric Bus', occ: 74 },
        { lat: 25.4290, lng: 81.9020, name: 'Arail Multi-Modal Transit Point', type: 'Bus & Boat', occ: 42 },
        { lat: 25.4360, lng: 81.8950, name: 'Jhusi Ferry Concourse', type: 'River Ferry', occ: 55 }
      ],
      emergency: [
        { lat: 25.4318, lng: 81.8818, name: 'Red Cross First-Aid Post 1', type: 'Medical Emergency' },
        { lat: 25.4300, lng: 81.8805, name: 'Police & RAF Quick Reaction Team', type: 'Security Help' },
        { lat: 25.4330, lng: 81.8940, name: 'Arail Field Hospital & Ambulance Point', type: 'Emergency Medical' }
      ]
    },
    'jantar-mantar': {
      lat: 28.6271,
      lng: 77.2166,
      zoom: 16,
      densityText: 'HIGH',
      densityPercent: 78,
      incidents: '01',
      safeRouteInfo: 'SANSAD EXIT · 6 min',
      heatZones: [
        {
          lat: 28.6271, lng: 77.2166, radius: 190, color: '#FF3B5C',
          name: 'Protest Core: Sansad Marg Podium (78% Saturation)',
          desc: 'Central barricaded gathering area along Sansad Marg.'
        },
        {
          lat: 28.6255, lng: 77.2155, radius: 150, color: '#FFB020',
          name: 'Entry Checkpoint: Patel Chowk (52%)',
          desc: 'Pedestrian inflow corridor from Patel Chowk Metro.'
        },
        {
          lat: 28.6285, lng: 77.2185, radius: 160, color: '#00D6A3',
          name: 'Dispersal Route: Janpath Outer Road (30%)',
          desc: 'Designated peaceful dispersal and transit corridor.'
        }
      ],
      gates: [
        {
          lat: 28.6262, lng: 77.2160,
          name: 'GATE 1',
          status: 'MODERATE',
          statusClass: 'status-amber',
          color: '#FFB020',
          iconSvg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 4H5a2 2 0 0 0-2 2v14h2V6h14v14h2V6a2 2 0 0 0-2-2z"/></svg>',
          queue: '6 min',
          flow: '180/min'
        },
        {
          lat: 28.6282, lng: 77.2170,
          name: 'GATE 2',
          status: 'CONGESTED',
          statusClass: 'status-red',
          color: '#FF3B5C',
          iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
          queue: '20 min',
          flow: '310/min'
        },
        {
          lat: 28.6290, lng: 77.2185,
          name: 'GATE 3',
          status: 'OPEN',
          statusClass: 'status-green',
          color: '#00D6A3',
          iconSvg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 4H5a2 2 0 0 0-2 2v14h2V6h14v14h2V6a2 2 0 0 0-2-2z"/></svg>',
          queue: '2 min',
          flow: '90/min'
        }
      ],
      route: [
        [28.6262, 77.2160],
        [28.6268, 77.2172],
        [28.6278, 77.2180],
        [28.6290, 77.2185]
      ],
      cameras: [
        { lat: 28.6271, lng: 77.2166, name: 'Fixed Traffic Sensor - Sansad Marg', density: 78 },
        { lat: 28.6280, lng: 77.2175, name: 'Tolstoy Junction Surveillance', density: 65 }
      ],
      transport: [
        { lat: 28.6240, lng: 77.2140, name: 'Patel Chowk Metro Station Gate 2', type: 'Delhi Metro', occ: 80 },
        { lat: 28.6295, lng: 77.2190, name: 'Janpath Metro Station Gate 1', type: 'Delhi Metro', occ: 45 }
      ],
      emergency: [
        { lat: 28.6265, lng: 77.2155, name: 'Delhi Police PCR Van Alpha', type: 'Security Help' },
        { lat: 28.6275, lng: 77.2180, name: 'CATs Ambulance Mobile ICU', type: 'Emergency Medical' }
      ]
    },
    'stadium-event': {
      lat: 23.0915,
      lng: 72.5975,
      zoom: 15,
      densityText: 'HIGH',
      densityPercent: 86,
      incidents: '01',
      safeRouteInfo: 'GATE 1 · 8 min',
      heatZones: [
        {
          lat: 23.0915, lng: 72.5975, radius: 320, color: '#FF3B5C',
          name: 'Stadium Bowl Core (86% Saturation)',
          desc: 'Main concourse and ingress turnstiles.'
        },
        {
          lat: 23.0950, lng: 72.5970, radius: 240, color: '#FFB020',
          name: 'VIP North Corridor (62%)',
          desc: 'Restricted access ramp and media transit.'
        },
        {
          lat: 23.0880, lng: 72.5990, radius: 260, color: '#00D6A3',
          name: 'Motera Metro Plaza (34%)',
          desc: 'Rapid transit evacuation and shuttle corridor.'
        }
      ],
      gates: [
        {
          lat: 23.0910, lng: 72.5930,
          name: 'GATE 1',
          status: 'OPEN',
          statusClass: 'status-green',
          color: '#00D6A3',
          iconSvg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 4H5a2 2 0 0 0-2 2v14h2V6h14v14h2V6a2 2 0 0 0-2-2z"/></svg>',
          queue: '5 min',
          flow: '650/min'
        },
        {
          lat: 23.0950, lng: 72.5975,
          name: 'GATE 2',
          status: 'CONGESTED',
          statusClass: 'status-red',
          color: '#FF3B5C',
          iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
          queue: '28 min',
          flow: '1200/min'
        },
        {
          lat: 23.0880, lng: 72.5990,
          name: 'GATE 3',
          status: 'MODERATE',
          statusClass: 'status-amber',
          color: '#FFB020',
          iconSvg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 4H5a2 2 0 0 0-2 2v14h2V6h14v14h2V6a2 2 0 0 0-2-2z"/></svg>',
          queue: '11 min',
          flow: '580/min'
        }
      ],
      route: [
        [23.0880, 72.5990],
        [23.0895, 72.5960],
        [23.0910, 72.5930]
      ],
      cameras: [
        { lat: 23.0915, lng: 72.5975, name: 'Stadium Bowl 360 PTZ Cam 01', density: 86 },
        { lat: 23.0885, lng: 72.5985, name: 'Metro Concourse Camera 02', density: 40 }
      ],
      transport: [
        { lat: 23.0875, lng: 72.5995, name: 'Motera Stadium Metro Station', type: 'Metro Train', occ: 85 },
        { lat: 23.0900, lng: 72.5910, name: 'BRTS Shuttle Depot West', type: 'BRTS Bus', occ: 50 }
      ],
      emergency: [
        { lat: 23.0920, lng: 72.5940, name: 'Apollo Trauma Mobile Unit', type: 'Medical Emergency' },
        { lat: 23.0940, lng: 72.5960, name: 'Gujarat Police Command Van', type: 'Security Help' }
      ]
    },
    'mumbai-ganpati': {
      lat: 18.9548,
      lng: 72.8156,
      zoom: 15,
      densityText: 'CRITICAL',
      densityPercent: 94,
      incidents: '03',
      safeRouteInfo: 'GATE 3 · 14 min',
      heatZones: [
        {
          lat: 18.9548, lng: 72.8140, radius: 340, color: '#FF3B5C',
          name: 'Girgaon Chowpatty Immersion Axis (94% Saturation)',
          desc: 'High crowd density along sea immersion ramps.'
        },
        {
          lat: 18.9580, lng: 72.8180, radius: 280, color: '#FFB020',
          name: 'Marine Drive North Approach (72%)',
          desc: 'Continuous procession line of trucks and devotees.'
        },
        {
          lat: 18.9510, lng: 72.8190, radius: 260, color: '#00D6A3',
          name: 'Charni Road Rail Corridor (42%)',
          desc: 'Pedestrian overbridge and suburban train dispersal.'
        }
      ],
      gates: [
        {
          lat: 18.9580, lng: 72.8180,
          name: 'GATE 1',
          status: 'MODERATE',
          statusClass: 'status-amber',
          color: '#FFB020',
          iconSvg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 4H5a2 2 0 0 0-2 2v14h2V6h14v14h2V6a2 2 0 0 0-2-2z"/></svg>',
          queue: '14 min',
          flow: '720/min'
        },
        {
          lat: 18.9548, lng: 72.8140,
          name: 'GATE 2',
          status: 'CONGESTED',
          statusClass: 'status-red',
          color: '#FF3B5C',
          iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
          queue: '42 min',
          flow: '1450/min'
        },
        {
          lat: 18.9510, lng: 72.8190,
          name: 'GATE 3',
          status: 'OPEN',
          statusClass: 'status-green',
          color: '#00D6A3',
          iconSvg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 4H5a2 2 0 0 0-2 2v14h2V6h14v14h2V6a2 2 0 0 0-2-2z"/></svg>',
          queue: '5 min',
          flow: '380/min'
        }
      ],
      route: [
        [18.9580, 72.8180],
        [18.9550, 72.8175],
        [18.9510, 72.8190]
      ],
      cameras: [
        { lat: 18.9548, lng: 72.8140, name: 'Chowpatty Beach Watchtower PTZ', density: 94 },
        { lat: 18.9565, lng: 72.8160, name: 'Marine Drive Flyover Cam 04', density: 70 }
      ],
      transport: [
        { lat: 18.9515, lng: 72.8195, name: 'Charni Road Suburban Station', type: 'Western Railway', occ: 90 },
        { lat: 18.9575, lng: 72.8220, name: 'Grant Road Bus Feeder Terminal', type: 'BEST Bus', occ: 60 }
      ],
      emergency: [
        { lat: 18.9540, lng: 72.8145, name: 'Indian Coast Guard Lifeboat Base', type: 'Maritime Rescue' },
        { lat: 18.9530, lng: 72.8170, name: 'Mumbai Police Special Control Room', type: 'Security Help' }
      ]
    }
  };

  public get currentGeoConfig(): EventGeoConfig {
    const key = this.selectedEvent?.id || 'maha-kumbh';
    return this.eventGeoConfigs[key] || this.eventGeoConfigs['maha-kumbh'];
  }

  // Leaflet map instance & Layer Groups
  private map: L.Map | null = null;
  private layerGroupZones = L.layerGroup();
  private layerGroupGates = L.layerGroup();
  private layerGroupTransport = L.layerGroup();
  private layerGroupCameras = L.layerGroup();
  private layerGroupEmergency = L.layerGroup();
  private layerGroupRoute = L.layerGroup();
  private layerGroupLandmarks = L.layerGroup();
  private baseTileLayer: L.TileLayer | null = null;
  private roadOverlayLayer: L.TileLayer | null = null;
  private userMarker: L.Marker | null = null;

  public layers = {
    zones: true,
    gates: true,
    transport: true,
    cameras: true,
    emergency: true
  };

  public activeLayer: 'zones' | 'gates' | 'transport' | 'cameras' | 'emergency' = 'gates';
  public dropdownOpen: boolean = false;
  public events: MegaEvent[] = [];
  public selectedEvent: MegaEvent | null = null;
  public isLiveBackend: boolean = true;
  public isVideoLoaded: boolean = false;

  // Interactive offline mode demo state
  public offlineSimulated: boolean = false;
  public syncState: 'cached' | 'syncing' | 'synced' = 'cached';

  private sub = new Subscription();

  constructor(public eventService: EventService) {}

  ngOnInit(): void {
    // 1. Subscribe to event list from real database service, filtered to the 4 approved events
    this.sub.add(
      this.eventService.events$.subscribe(evs => {
        if (evs && evs.length > 0) {
          const approved = this.ALLOWED_EVENT_IDS
            .map(id => evs.find(e => e.id === id))
            .filter((e): e is MegaEvent => !!e);

          this.events = approved.length > 0 ? approved : evs.filter(e => this.ALLOWED_EVENT_IDS.includes(e.id));
          const kumbh = this.events.find(e => e.id === 'maha-kumbh');
          this.selectedEvent = kumbh || this.events[0];
          this.isLiveBackend = true;
        } else {
          this.isLiveBackend = false;
        }
      })
    );

    // 2. Watch for active event location changes to pan real map
    this.sub.add(
      this.eventService.activeLocation$.subscribe(loc => {
        if (loc && this.map) {
          this.map.setView([loc.latitude, loc.longitude], loc.defaultZoom || 13);
          setTimeout(() => this.map?.invalidateSize(), 150);
        }
      })
    );

    // 3. Subscribe to real event layers
    this.sub.add(this.eventService.zones$.subscribe(() => {
      if (this.selectedEvent?.id === 'maha-kumbh') {
        this.renderMahaKumbhRealisticLayers();
      } else {
        this.renderZones();
      }
    }));
    this.sub.add(this.eventService.gates$.subscribe(() => {
      if (this.selectedEvent?.id !== 'maha-kumbh') {
        this.renderGates();
      }
    }));
    this.sub.add(this.eventService.cameras$.subscribe(() => {
      if (this.selectedEvent?.id !== 'maha-kumbh') {
        this.renderCameras();
      }
    }));
    this.sub.add(this.eventService.transport$.subscribe(() => {
      if (this.selectedEvent?.id !== 'maha-kumbh') {
        this.renderTransport();
      }
    }));
    this.sub.add(this.eventService.emergency$.subscribe(() => {
      if (this.selectedEvent?.id !== 'maha-kumbh') {
        this.renderEmergency();
      }
    }));
  }

  ngAfterViewInit(): void {
    // 1. Silent video background guarantee
    if (this.bgVideoRef && this.bgVideoRef.nativeElement) {
      const vid = this.bgVideoRef.nativeElement;
      vid.muted = true;
      vid.volume = 0;
      if (vid.readyState >= 2) {
        this.isVideoLoaded = true;
      }
      vid.play().catch(() => {
        // Silent fallback
      });
    }

    // 2. Initialize REAL Circular Leaflet + OpenStreetMap Map
    setTimeout(() => {
      this.initCircularMap();
    }, 150);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent): void {
    if (this.dropdownOpen) {
      this.dropdownOpen = false;
    }
  }

  public onVideoCanPlay(): void {
    this.isVideoLoaded = true;
  }

  public toggleDropdown(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.dropdownOpen = !this.dropdownOpen;
  }

  public selectEvent(event: MegaEvent, mouseEvent: MouseEvent): void {
    mouseEvent.stopPropagation();
    this.selectedEvent = event;
    this.eventService.selectEvent(event.id);
    this.dropdownOpen = false;
    this.panMapToEvent(event.id);
  }

  private panMapToEvent(eventId: string): void {
    if (!this.map) return;
    const config = this.eventGeoConfigs[eventId] || this.eventGeoConfigs['maha-kumbh'];
    this.map.setView([config.lat, config.lng], config.zoom, { animate: true });
    this.applyEventMapTilesAndLayers(eventId);
    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  public zoomIn(): void {
    if (this.map) this.map.zoomIn();
  }

  public zoomOut(): void {
    if (this.map) this.map.zoomOut();
  }

  public locateUser(): void {
    if (!this.map) return;
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const userIcon = L.divIcon({
            className: 'leaflet-user-gps-div',
            html: `
              <div class="user-gps-pulse-wrap">
                <div class="user-gps-ring"></div>
                <div class="user-gps-dot"></div>
              </div>`
          });

          if (this.userMarker && this.map) {
            this.map.removeLayer(this.userMarker);
          }

          this.userMarker = L.marker([lat, lng], { icon: userIcon })
            .addTo(this.map!)
            .bindPopup(`<b>YOU ARE HERE</b><br>Live GPS Accuracy: ±${Math.round(pos.coords.accuracy)}m`)
            .openPopup();

          this.map?.setView([lat, lng], 15, { animate: true });
        },
        err => {
          console.warn('Geolocation permission not granted or unavailable:', err.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }

  public toggleLayer(key: 'zones' | 'gates' | 'transport' | 'cameras' | 'emergency'): void {
    this.layers[key] = !this.layers[key];
    this.activeLayer = key;
    if (!this.map) return;

    switch (key) {
      case 'zones':
        this.layers.zones ? this.map.addLayer(this.layerGroupZones) : this.map.removeLayer(this.layerGroupZones);
        break;
      case 'gates':
        this.layers.gates ? this.map.addLayer(this.layerGroupGates) : this.map.removeLayer(this.layerGroupGates);
        break;
      case 'transport':
        this.layers.transport ? this.map.addLayer(this.layerGroupTransport) : this.map.removeLayer(this.layerGroupTransport);
        break;
      case 'cameras':
        this.layers.cameras ? this.map.addLayer(this.layerGroupCameras) : this.map.removeLayer(this.layerGroupCameras);
        break;
      case 'emergency':
        this.layers.emergency ? this.map.addLayer(this.layerGroupEmergency) : this.map.removeLayer(this.layerGroupEmergency);
        break;
    }
  }

  public toggleOfflineMode(): void {
    this.offlineSimulated = !this.offlineSimulated;
    if (this.offlineSimulated) {
      this.syncState = 'cached';
    } else {
      this.syncState = 'syncing';
      setTimeout(() => {
        this.syncState = 'synced';
      }, 1800);
    }
  }

  private initCircularMap(): void {
    if (!this.circularMapRef || typeof window === 'undefined') return;

    // Center on Triveni Sangam, Prayagraj with zoom 13 for perfect geographic framing
    const prayagrajCenter: [number, number] = [25.4310, 81.8870];
    const initialZoom = 13;

    // Initialize fully interactive Leaflet map inside standard rectangular viewport
    this.map = L.map(this.circularMapRef.nativeElement, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true,
      touchZoom: true
    }).setView(prayagrajCenter, initialZoom);

    // Add metric scale indicator
    L.control.scale({ imperial: false, metric: true, position: 'bottomright' }).addTo(this.map);

    // Add layer groups to map
    this.layerGroupZones.addTo(this.map);
    this.layerGroupGates.addTo(this.map);
    this.layerGroupTransport.addTo(this.map);
    this.layerGroupCameras.addTo(this.map);
    this.layerGroupEmergency.addTo(this.map);
    this.layerGroupRoute.addTo(this.map);
    this.layerGroupLandmarks.addTo(this.map);

    // Apply the event-specific tiles and realistic layers
    const activeEventId = this.selectedEvent?.id || 'maha-kumbh';
    this.applyEventMapTilesAndLayers(activeEventId);

    // Responsive invalidateSize triggers to guarantee all tiles and overlays render sharply
    setTimeout(() => this.map?.invalidateSize(), 100);
    setTimeout(() => this.map?.invalidateSize(), 300);
    setTimeout(() => this.map?.invalidateSize(), 700);

    // Window resize handler
    window.addEventListener('resize', () => {
      this.map?.invalidateSize();
    });
  }

  private applyEventMapTilesAndLayers(eventId: string): void {
    if (!this.map) return;

    // Remove existing tile layers
    if (this.baseTileLayer) {
      this.map.removeLayer(this.baseTileLayer);
      this.baseTileLayer = null;
    }
    if (this.roadOverlayLayer) {
      this.map.removeLayer(this.roadOverlayLayer);
      this.roadOverlayLayer = null;
    }

    if (eventId === 'maha-kumbh') {
      // 1. Official Free OpenStreetMap Tile Layer as requested
      this.baseTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      // Clear generic layers
      this.layerGroupZones.clearLayers();
      this.layerGroupGates.clearLayers();
      this.layerGroupTransport.clearLayers();
      this.layerGroupCameras.clearLayers();
      this.layerGroupEmergency.clearLayers();
      this.layerGroupRoute.clearLayers();
      this.layerGroupLandmarks.clearLayers();

      // Render realistic Prayagraj / Maha Kumbh geographic features matching screenshot
      this.renderMahaKumbhRealisticLayers();
    } else {
      // Standard Free OpenStreetMap for other events
      this.baseTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      this.layerGroupLandmarks.clearLayers();
      this.renderZones();
      this.renderGates();
      this.renderCameras();
      this.renderTransport();
      this.renderEmergency();
      this.renderSafeRoute();
    }
  }

  private renderMahaKumbhRealisticLayers(): void {
    if (!this.map) return;

    this.layerGroupZones.clearLayers();
    this.layerGroupGates.clearLayers();
    this.layerGroupLandmarks.clearLayers();
    this.layerGroupCameras.clearLayers();
    this.layerGroupTransport.clearLayers();
    this.layerGroupEmergency.clearLayers();
    this.layerGroupRoute.clearLayers();

    // 1. CROWD ZONES (Polygons matching Reference Screenshot)
    // Zone A (LOW) - Green
    L.polygon([
      [25.4380, 81.8380],
      [25.4420, 81.8440],
      [25.4310, 81.8660],
      [25.4240, 81.8610],
      [25.4320, 81.8400]
    ], {
      color: '#00D6A3',
      weight: 2,
      fillColor: '#00D6A3',
      fillOpacity: 0.35
    }).addTo(this.layerGroupZones);

    // Zone B (VERY HIGH) - Red
    L.polygon([
      [25.4480, 81.8480],
      [25.4520, 81.8640],
      [25.4430, 81.8760],
      [25.4310, 81.8660],
      [25.4380, 81.8480]
    ], {
      color: '#FF3B5C',
      weight: 2,
      fillColor: '#FF3B5C',
      fillOpacity: 0.38
    }).addTo(this.layerGroupZones);

    // Zone C (HIGH) - Orange
    L.polygon([
      [25.4440, 81.8780],
      [25.4480, 81.8950],
      [25.4370, 81.9050],
      [25.4280, 81.8880],
      [25.4320, 81.8780]
    ], {
      color: '#f97316',
      weight: 2,
      fillColor: '#f97316',
      fillOpacity: 0.38
    }).addTo(this.layerGroupZones);

    // Zone D (MODERATE) - Yellow
    L.polygon([
      [25.4230, 81.8800],
      [25.4260, 81.9120],
      [25.4130, 81.9180],
      [25.4120, 81.8850],
      [25.4180, 81.8780]
    ], {
      color: '#FFB020',
      weight: 2,
      fillColor: '#FFB020',
      fillOpacity: 0.35
    }).addTo(this.layerGroupZones);

    // Zone text labels
    const addZoneLabel = (lat: number, lng: number, zoneText: string, statusText: string) => {
      const icon = L.divIcon({
        className: 'leaflet-zone-label-div',
        html: `<div class="screenshot-zone-label">${zoneText}<br>(${statusText})</div>`,
        iconSize: [120, 30],
        iconAnchor: [60, 15]
      });
      L.marker([lat, lng], { icon, interactive: false }).addTo(this.layerGroupZones);
    };

    addZoneLabel(25.4335, 81.8530, 'Zone A', 'LOW');
    addZoneLabel(25.4420, 81.8620, 'Zone B', 'VERY HIGH');
    addZoneLabel(25.4380, 81.8920, 'Zone C', 'HIGH');
    addZoneLabel(25.4180, 81.8970, 'Zone D', 'MODERATE');

    // 2. GATE PINS (Matching Reference Screenshot)
    const addGatePin = (lat: number, lng: number, gateNum: string, colorClass: string, popupHtml: string) => {
      const pinHtml = `
        <div class="screenshot-gate-pin">
          <div class="sgp-circle ${colorClass}">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
          </div>
          <span class="sgp-text">Gate ${gateNum}</span>
        </div>`;
      const icon = L.divIcon({
        className: 'screenshot-gate-div-icon',
        html: pinHtml,
        iconSize: [95, 30],
        iconAnchor: [12, 15]
      });
      L.marker([lat, lng], { icon }).bindPopup(popupHtml).addTo(this.layerGroupGates);
    };

    addGatePin(25.4380, 81.8440, '1', 'bg-green', '<b>Gate 1 &mdash; Fort Rampart Approach</b><br>Status: <strong>LOW (Normal Flow)</strong><br>Queue Time: 4 mins<br>Flow Rate: 420/min');
    addGatePin(25.4485, 81.8570, '2', 'bg-red', '<b>Gate 2 &mdash; Sangam Concourse North</b><br>Status: <strong>VERY HIGH (Surge Alert)</strong><br>Queue Time: 28 mins<br>Flow Rate: 1,840/min');
    addGatePin(25.4400, 81.8860, '3', 'bg-orange', '<b>Gate 3 &mdash; Daraganj Ghat Access</b><br>Status: <strong>HIGH (Congested)</strong><br>Queue Time: 19 mins<br>Flow Rate: 1,290/min');
    addGatePin(25.4225, 81.8965, '4', 'bg-yellow', '<b>Gate 4 &mdash; Jhusi Pontoon Link</b><br>Status: <strong>MODERATE (Active)</strong><br>Queue Time: 11 mins<br>Flow Rate: 810/min');

    // 3. BLUE LANDMARKS (Railway Station, Airport, High Court, Sangam, Fort)
    const addBlueBadge = (lat: number, lng: number, title: string, sub: string, svgPath: string) => {
      const badgeHtml = `
        <div class="landmark-badge-blue">
          <div class="lbb-icon-circle">
            <svg viewBox="0 0 24 24" fill="currentColor">${svgPath}</svg>
          </div>
          <div class="lbb-text">
            <span>${title}</span>
            <span class="lbb-sub">${sub}</span>
          </div>
        </div>`;
      const icon = L.divIcon({
        className: 'landmark-div-icon',
        html: badgeHtml,
        iconSize: [160, 32],
        iconAnchor: [10, 16]
      });
      L.marker([lat, lng], { icon }).addTo(this.layerGroupLandmarks);
    };

    // Prayagraj Junction Railway Station
    addBlueBadge(
      25.4490, 81.8310,
      'Prayagraj Junction', 'Railway Station प्रयागराज जंक्शन',
      '<path d="M4 15.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V5c0-3.5-3.58-4-8-4s-8 .5-8 4v10.5zm8 1.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6-7H6V5h12v5z"/>'
    );

    // Prayagraj Allahabad Airport
    addBlueBadge(
      25.4520, 81.9250,
      'Prayagraj', 'Allahabad Airport प्रयागराज हवाई अड्डा',
      '<path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>'
    );

    // Allahabad High Court
    addBlueBadge(
      25.4335, 81.8660,
      'Allahabad High Court', 'इलाहाबाद उच्च न्यायालय',
      '<path d="M12 1L3 5v2h18V5l-9-4zm-7 8v8h2V9H5zm4 0v8h2V9H9zm4 0v8h2V9h-2zm4 0v8h2V9h-2zM2 19v3h20v-3H2z"/>'
    );

    // Triveni Sangam
    addBlueBadge(
      25.4190, 81.8840,
      'Triveni Sangam', 'त्रिवेणी संगम',
      '<path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 4.5c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/>'
    );

    // Akbar Fort
    addBlueBadge(
      25.4230, 81.9320,
      'Akbar Fort', 'अकबर किला',
      '<path d="M2 4h3v2h2V4h2v2h2V4h2v2h2V4h2v2h2V4h3v6h-1v10H3V10H2V4zm3 8v6h14v-6H5z"/>'
    );

    // 4. PURPLE LANDMARKS (Arail Ghat, Sangam, Bharadwaj Ashram)
    const addPurpleBadge = (lat: number, lng: number, title: string, sub: string) => {
      const badgeHtml = `
        <div class="landmark-badge-purple">
          <div class="lbp-icon-circle">
            <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>
          </div>
          <div class="lbp-text">
            <span>${title}</span>
            <span class="lbp-sub">${sub}</span>
          </div>
        </div>`;
      const icon = L.divIcon({
        className: 'landmark-purple-icon',
        html: badgeHtml,
        iconSize: [120, 28],
        iconAnchor: [10, 14]
      });
      L.marker([lat, lng], { icon }).addTo(this.layerGroupLandmarks);
    };

    addPurpleBadge(25.4210, 81.8670, 'Arail Ghat', 'अरैल घाट');
    addPurpleBadge(25.4140, 81.8880, 'Sangam', 'संगम');
    addPurpleBadge(25.4380, 81.9280, 'Bharadwaj Ashram', 'भरद्वाज आश्रम');

    // 5. WHITE LOCALITY / AREA BADGES
    const addWhiteLocality = (lat: number, lng: number, title: string, sub: string, isBig: boolean = false) => {
      const badgeHtml = `
        <div class="landmark-badge-white ${isBig ? 'is-big' : ''}">
          <span class="lbw-title">${title}</span>
          <span class="lbw-sub">${sub}</span>
        </div>`;
      const icon = L.divIcon({
        className: 'locality-div-icon',
        html: badgeHtml,
        iconSize: [isBig ? 120 : 90, isBig ? 32 : 24],
        iconAnchor: [isBig ? 60 : 45, 12]
      });
      L.marker([lat, lng], { icon, interactive: false }).addTo(this.layerGroupLandmarks);
    };

    addWhiteLocality(25.4520, 81.8620, 'Prayagraj', 'प्रयागराज', true);
    addWhiteLocality(25.4560, 81.8740, 'Civil Lines', 'सिविल लाइन्स');
    addWhiteLocality(25.4580, 81.8460, 'Katra', 'कटरा');
    addWhiteLocality(25.4450, 81.8480, 'George Town', 'जॉर्ज टाउन');
    addWhiteLocality(25.4400, 81.8980, 'Kydganj', 'किडगंज');
    addWhiteLocality(25.4340, 81.8850, 'Daraganj', 'दारागंज');
    addWhiteLocality(25.4230, 81.9160, 'Jhusi', 'झूंसी');
    addWhiteLocality(25.4430, 81.8200, 'Phaphamau', 'फाफामऊ');
    addWhiteLocality(25.4050, 81.8750, 'Naini', 'नैनी');
    addWhiteLocality(25.4170, 81.9050, 'Kumbh Mela Area', 'कुम्भ मेला क्षेत्र');

    // 6. BRIDGES (Shastri, Naini, New Yamuna)
    const addBridgeLabel = (lat: number, lng: number, title: string, sub: string) => {
      const bridgeHtml = `
        <div class="bridge-screenshot-label">
          <span>${title}</span>
          <span class="bsl-sub">${sub}</span>
        </div>`;
      const icon = L.divIcon({
        className: 'bridge-div-icon',
        html: bridgeHtml,
        iconSize: [100, 24],
        iconAnchor: [50, 12]
      });
      L.marker([lat, lng], { icon, interactive: false }).addTo(this.layerGroupLandmarks);
    };

    addBridgeLabel(25.4290, 81.8980, 'Shastri Bridge', 'शास्त्री पुल');
    addBridgeLabel(25.4220, 81.8480, 'Naini Bridge', 'नैनी पुल');
    addBridgeLabel(25.4120, 81.8430, 'New Yamuna Bridge', 'नया यमुना पुल');

    // 7. HIGHWAY SHIELDS (NH 19, NH 30, NH 2)
    const addHighwayShield = (lat: number, lng: number, code: string) => {
      const shieldHtml = `<div class="highway-shield-badge">${code}</div>`;
      const icon = L.divIcon({
        className: 'highway-div-icon',
        html: shieldHtml,
        iconSize: [50, 22],
        iconAnchor: [25, 11]
      });
      L.marker([lat, lng], { icon, interactive: false }).addTo(this.layerGroupLandmarks);
    };

    addHighwayShield(25.4540, 81.9050, 'NH 19');
    addHighwayShield(25.4380, 81.9360, 'NH 30');
    addHighwayShield(25.4370, 81.8250, 'NH 2');
    addHighwayShield(25.4180, 81.8210, 'NH 2');

    // 8. RIVERS (Yamuna River, Ganga River)
    const addRiverLabel = (lat: number, lng: number, text: string, angle: number = 0) => {
      const riverHtml = `
        <div class="river-screenshot-label" style="transform: rotate(${angle}deg);">
          ${text}
        </div>`;
      const icon = L.divIcon({
        className: 'river-div-icon',
        html: riverHtml,
        iconSize: [160, 26],
        iconAnchor: [80, 13]
      });
      L.marker([lat, lng], { icon, interactive: false }).addTo(this.layerGroupLandmarks);
    };

    addRiverLabel(25.4320, 81.8450, '&larr; Yamuna River यमुना नदी', -12);
    addRiverLabel(25.4330, 81.9180, 'Ganga River &rarr; गंगा नदी', -8);
  }

  private renderZones(): void {
    if (!this.map || this.selectedEvent?.id === 'maha-kumbh') return;
    this.layerGroupZones.clearLayers();

    // 1. Subtle perimeter boundary lines for database zones (no heavy fills that obscure geography)
    const zones = this.eventService.zonesSubject?.value || [];
    const activeEventId = this.selectedEvent?.id || 'maha-kumbh';
    const eventZones = zones.filter(z => z.eventId === activeEventId);

    if (eventZones.length > 0) {
      eventZones.forEach(zone => {
        if (zone.polygonGeoJSON && zone.polygonGeoJSON.length > 2) {
          const color = zone.status === 'HIGH' || zone.status === 'EMERGENCY' ? '#FF3B5C' : zone.status === 'MODERATE' ? '#FFB020' : '#00D6A3';
          const polygon = L.polygon(zone.polygonGeoJSON as L.LatLngExpression[], {
            color,
            weight: 1.5,
            dashArray: '5 5',
            fillColor: color,
            fillOpacity: 0.05
          });
          polygon.bindTooltip(`<b>${zone.name}</b><br>Pressure: ${zone.pressurePercent}% (${zone.status})`);
          polygon.bindPopup(`<b>ZONE DETAILS: ${zone.name}</b><br>Current Pressure: <strong>${zone.pressurePercent}%</strong><br>Status: <strong>${zone.status}</strong><br>Capacity: ${zone.capacity.toLocaleString()} visitors`);
          this.layerGroupZones.addLayer(polygon);
        }
      });
    }

    // 2. Realistic Translucent Crowd Heat Zones matching active event
    const heatZones = this.currentGeoConfig.heatZones;
    heatZones.forEach(hz => {
      const circle = L.circle([hz.lat, hz.lng], {
        radius: hz.radius,
        color: hz.color,
        weight: 1.5,
        fillColor: hz.color,
        fillOpacity: 0.22
      });
      circle.bindTooltip(`<b>${hz.name}</b>`);
      circle.bindPopup(`<b>${hz.name}</b><br>${hz.desc}`);
      this.layerGroupZones.addLayer(circle);
    });
  }

  private renderGates(): void {
    if (!this.map || this.selectedEvent?.id === 'maha-kumbh') return;
    this.layerGroupGates.clearLayers();

    const gatesData = this.currentGeoConfig.gates;
    gatesData.forEach(g => {
      const gateCardHtml = `
        <div class="leaflet-gate-card ${g.statusClass}">
          <div class="lgc-icon">${g.iconSvg}</div>
          <div class="lgc-text">
            <span class="lgc-title">${g.name}</span>
            <span class="lgc-status">${g.status}</span>
          </div>
        </div>`;

      const gateIcon = L.divIcon({
        className: 'custom-leaflet-gate-marker',
        html: gateCardHtml,
        iconSize: [110, 36],
        iconAnchor: [55, 18]
      });

      const marker = L.marker([g.lat, g.lng], { icon: gateIcon });
      marker.bindPopup(`
        <div style="font-family:'Space Grotesk',sans-serif; color:#fff;">
          <h4 style="margin:0 0 4px; color:${g.color};">${g.name} — ${g.status}</h4>
          <p style="margin:0; font-size:12px; color:#cbd5e1;">Queue Time: <strong>${g.queue}</strong><br>Flow Rate: <strong>${g.flow}</strong></p>
        </div>`);
      this.layerGroupGates.addLayer(marker);
    });
  }

  private renderCameras(): void {
    if (!this.map || this.selectedEvent?.id === 'maha-kumbh') return;
    this.layerGroupCameras.clearLayers();

    const cameraPoints = this.currentGeoConfig.cameras;
    cameraPoints.forEach(cam => {
      const camIcon = L.divIcon({
        className: 'leaflet-camera-div-icon',
        html: `
          <div style="width:26px; height:26px; border-radius:50%; background:rgba(0,198,255,0.25); border:1.5px solid #00C6FF; display:flex; align-items:center; justify-content:center; color:#00C6FF; box-shadow:0 0 10px rgba(0,198,255,0.5);">
            <svg style="width:14px; height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          </div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([cam.lat, cam.lng], { icon: camIcon });
      marker.bindPopup(`<b>${cam.name}</b><br>Live Density: <strong>${cam.density}%</strong><br>CCTV Status: Active`);
      this.layerGroupCameras.addLayer(marker);
    });
  }

  private renderTransport(): void {
    if (!this.map || this.selectedEvent?.id === 'maha-kumbh') return;
    this.layerGroupTransport.clearLayers();

    const transportPoints = this.currentGeoConfig.transport;
    transportPoints.forEach(t => {
      const tIcon = L.divIcon({
        className: 'leaflet-transport-div-icon',
        html: `
          <div style="width:26px; height:26px; border-radius:50%; background:rgba(22,119,255,0.25); border:1.5px solid #1677FF; display:flex; align-items:center; justify-content:center; color:#1677FF; box-shadow:0 0 10px rgba(22,119,255,0.5);">
            <svg style="width:14px; height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="15" rx="2"/><path d="M8 21h8M12 18v3M7 14h.01M17 14h.01"/></svg>
          </div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([t.lat, t.lng], { icon: tIcon });
      marker.bindPopup(`<b>${t.name}</b><br>Type: ${t.type}<br>Utilization: <strong>${t.occ}%</strong>`);
      this.layerGroupTransport.addLayer(marker);
    });
  }

  private renderEmergency(): void {
    if (!this.map || this.selectedEvent?.id === 'maha-kumbh') return;
    this.layerGroupEmergency.clearLayers();

    const emergencyPoints = this.currentGeoConfig.emergency;
    emergencyPoints.forEach(em => {
      const emIcon = L.divIcon({
        className: 'leaflet-emergency-div-icon',
        html: `
          <div style="width:26px; height:26px; border-radius:50%; background:rgba(255,59,92,0.25); border:1.5px solid #FF3B5C; display:flex; align-items:center; justify-content:center; color:#fff; font-size:14px; font-weight:bold; box-shadow:0 0 10px rgba(255,59,92,0.6);">
            +
          </div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([em.lat, em.lng], { icon: emIcon });
      marker.bindPopup(`<b>${em.name}</b><br>Category: ${em.type}<br>Status: Active 24x7`);
      this.layerGroupEmergency.addLayer(marker);
    });
  }

  private renderSafeRoute(): void {
    if (!this.map || this.selectedEvent?.id === 'maha-kumbh') return;
    this.layerGroupRoute.clearLayers();

    const routeCoords = this.currentGeoConfig.route as L.LatLngExpression[];
    if (!routeCoords || routeCoords.length === 0) return;

    const routeLine = L.polyline(routeCoords, {
      color: '#00C6FF',
      weight: 4.5,
      dashArray: '10 8',
      opacity: 0.95
    });

    routeLine.bindTooltip(`<b>RECOMMENDED SAFE ROUTE</b><br>${this.currentGeoConfig.safeRouteInfo}`);
    this.layerGroupRoute.addLayer(routeLine);
  }
}
