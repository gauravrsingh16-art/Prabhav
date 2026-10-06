export type UserRole = 'VISITOR' | 'OPERATOR';

export interface User {
  userId: string;
  username: string;
  fullName: string;
  role: UserRole;
  email?: string;
  phone?: string;
}

export type EventStatus = 'normal' | 'elevated' | 'critical' | 'evacuating';

export interface EventScheduleItem {
  id: string;
  time: string;
  title: string;
  venueId: string;
  expectedImpact: 'low' | 'moderate' | 'high';
}

export interface MegaEvent {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  location: string;
  dateRange: string;
  expectedVisitors: number;
  status: EventStatus;
  hasCameraCoverage: boolean;
  description: string;
  schedule: EventScheduleItem[];
}

export interface EventLocation {
  locationId: string;
  eventId: string;
  name: string;
  latitude: number;
  longitude: number;
  defaultZoom: number;
  venueRadiusMeters: number;
  address: string;
}

export interface EventVideo {
  videoId: string;
  eventId: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  isRecorded: boolean;
  description: string;
  durationSeconds: number;
}

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'EMERGENCY';

export interface Zone {
  zoneId: string;
  eventId: string;
  name: string;
  polygonGeoJSON: [number, number][];
  centerLat: number;
  centerLng: number;
  capacity: number;
  currentOccupancy: number;
  pressurePercent: number;
  status: RiskLevel;
  accommodationPressure: number;
}

export type GateStatus = 'OPEN' | 'RESTRICTED' | 'CONGESTED' | 'CLOSED';

export interface Gate {
  gateId: string;
  eventId: string;
  zoneId?: string;
  name: string;
  latitude: number;
  longitude: number;
  queueTimeMinutes: number;
  flowRatePerMin: number;
  status: GateStatus;
  isEmergencyExit: boolean;
}

export interface CameraFeed {
  cameraId: string;
  eventId: string;
  zoneId?: string;
  name: string;
  streamUrl: string;
  latitude: number;
  longitude: number;
  status: 'ONLINE' | 'OFFLINE' | 'ALERT';
  lastFlowPerMin: number;
  lastDensityPercent: number;
  lastPeopleCount: number;
}

export interface TransportPoint {
  transportId: string;
  eventId: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  capacityPerHour: number;
  utilizationPercent: number;
  status: 'NORMAL' | 'BUSY' | 'OVERLOADED';
}

export interface EmergencyPoint {
  pointId: string;
  eventId: string;
  name: string;
  type: 'MEDICAL' | 'POLICE' | 'SAFE_HAVEN' | 'FIRE' | 'INFORMATION';
  latitude: number;
  longitude: number;
  contactNumber?: string;
  isActive: boolean;
}

export interface AlertItem {
  alertId: string;
  eventId: string;
  title: string;
  message: string;
  recommendation?: string;
  targetGateId?: string;
  targetZoneId?: string;
  severity: 'INFO' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'RESOLVED';
  createdAt: string;
}

export interface Intervention {
  interventionId: string;
  eventId: string;
  title: string;
  actionType: 'REDIRECT' | 'OPEN_GATE' | 'CLOSE_GATE' | 'DISPATCH_ASSISTANCE' | 'ADVISORY';
  targetEntity: string;
  description: string;
  beforeState: string;
  afterState?: string;
  status: 'PENDING' | 'APPROVED' | 'EXECUTING' | 'COMPLETED' | 'DISMISSED';
  approvedByUserId?: string;
  approvedAt?: string;
  measuredOutcome?: string;
  createdAt: string;
}

export interface CrowdObservation {
  observationId: string;
  eventId: string;
  zoneId?: string;
  locationDescription: string;
  peopleCount: number;
  densityPercent: number;
  flowRatePerMin: number;
  movementDirection: string;
  congestionLevel: RiskLevel;
  sourceType: string;
  isSimulated: boolean;
  label?: string;
  observedAt: string;
}

export interface VisitorReport {
  reportId: string;
  eventId: string;
  userId: string;
  userName?: string;
  category: 'Heavy Crowd' | 'Blocked Route' | 'Medical Emergency' | 'Unsafe Area' | 'Lost Person' | 'Other';
  description: string;
  latitude: number;
  longitude: number;
  status: 'NEW' | 'INVESTIGATING' | 'RESOLVED';
  createdAt: string;
}

export interface EmergencyReport {
  emergencyId: string;
  eventId: string;
  userId: string;
  userName?: string;
  emergencyType: 'SOS' | 'FIND_SAFE_PLACE' | 'MEDICAL_HELP' | 'POLICE_HELP' | 'SHARE_LOCATION';
  latitude: number;
  longitude: number;
  accuracy?: number;
  notes?: string;
  status: 'ACTIVE' | 'DISPATCHED' | 'RESOLVED';
  createdAt: string;
}
