import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
import {
  User,
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
  VisitorReport,
  EmergencyReport,
  GateAnalysisRecord
} from '../types';
import {
  initialUsers,
  initialEvents,
  initialLocations,
  initialVideos,
  initialZones,
  initialGates,
  initialCameras,
  initialTransport,
  initialEmergency,
  initialAlerts,
  initialInterventions,
  initialVisitorReports,
  initialEmergencyReports
} from '../data/mockData';

// Load .env from node-api directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

// Step 2 & 3: Standardized database configuration via environment variables
export const dbConfig: sql.config = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD, // Read from environment; never hardcoded
  database: process.env.DB_DATABASE || process.env.DB_NAME || 'PravaahDB',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false'
  },
  connectionTimeout: 8000,
  requestTimeout: 15000,
  pool: {
    max: 15,
    min: 1,
    idleTimeoutMillis: 30000
  }
};

export interface VerifiedVideoClassification {
  key: string;
  filename: string;
  crowdLevel: string;
  crowdDensity: string;
  densityPercent: number;
  crowdFlow: string;
  status: string;
  zoneColor: string;
  recommendation: string;
  recommendationSub: string;
  alertMessage: string;
}

export const VERIFIED_VIDEO_DATA: VerifiedVideoClassification[] = [
  {
    key: '4.19.55',
    filename: 'WhatsApp Video 2026-10-03 at 4.19.55 PM.mp4',
    crowdLevel: 'HIGH',
    crowdDensity: '70%',
    densityPercent: 70,
    crowdFlow: 'ACTIVE CROWD MOVEMENT',
    status: 'ELEVATED CROWD PRESSURE',
    zoneColor: '#f97316',
    recommendation: 'REGULATE CONCOURSE & DIVERT TRAFFIC',
    recommendationSub: 'Elevated concourse flow observed from verified demo footage.',
    alertMessage: 'High crowd movement detected. Follow designated walking lanes.'
  },
  {
    key: '4.19.58',
    filename: 'WhatsApp Video 2026-10-03 at 4.19.58 PM.mp4',
    crowdLevel: 'VERY HIGH',
    crowdDensity: '90%',
    densityPercent: 90,
    crowdFlow: 'HEAVY CROWD MOVEMENT',
    status: 'CRITICAL CROWD PRESSURE',
    zoneColor: '#FF3B5C',
    recommendation: 'DIVERT VISITORS TOWARD ALTERNATIVE LOWER-DENSITY GATE',
    recommendationSub: 'Critical crowd surge occupancy detected from verified demo footage.',
    alertMessage: 'Critical crowd pressure detected. Immediate diversion recommended.'
  },
  {
    key: '4.20.27',
    filename: 'WhatsApp Video 2026-10-03 at 4.20.27 PM.mp4',
    crowdLevel: 'MODERATE',
    crowdDensity: '48%',
    densityPercent: 48,
    crowdFlow: 'STEADY INFLOW',
    status: 'CONTROLLED',
    zoneColor: '#FFB020',
    recommendation: 'MONITOR FLOW & BUFFER ARRIVALS',
    recommendationSub: 'Concourse flow within manageable thresholds.',
    alertMessage: 'Moderate crowd volume observed. Normal queuing protocols in effect.'
  },
  {
    key: '3.45.34',
    filename: 'WhatsApp Video 2026-10-04 at 3.45.34 PM.mp4',
    crowdLevel: 'VERY HIGH',
    crowdDensity: '95%',
    densityPercent: 95,
    crowdFlow: 'HEAVY CROWD MOVEMENT',
    status: 'CRITICAL CROWD PRESSURE',
    zoneColor: '#FF3B5C',
    recommendation: 'DIVERT VISITORS TOWARD ALTERNATIVE LOWER-DENSITY GATE',
    recommendationSub: 'Critical crowd surge occupancy detected from verified demo footage.',
    alertMessage: 'Critical crowd pressure detected. Immediate diversion recommended.'
  },
  {
    key: '4.12.35',
    filename: 'WhatsApp Video 2026-10-04 at 4.12.35 PM.mp4',
    crowdLevel: 'HIGH',
    crowdDensity: '70%',
    densityPercent: 70,
    crowdFlow: 'ACTIVE CROWD MOVEMENT',
    status: 'ELEVATED CROWD PRESSURE',
    zoneColor: '#f97316',
    recommendation: 'REGULATE CONCOURSE & DIVERT TRAFFIC',
    recommendationSub: 'Elevated concourse flow observed from verified demo footage.',
    alertMessage: 'High crowd movement detected. Follow designated walking lanes.'
  },
  {
    key: '4.12.50',
    filename: 'WhatsApp Video 2026-10-04 at 4.12.50 PM.mp4',
    crowdLevel: 'VERY HIGH',
    crowdDensity: '85%',
    densityPercent: 85,
    crowdFlow: 'HEAVY CROWD MOVEMENT',
    status: 'CRITICAL CROWD PRESSURE',
    zoneColor: '#FF3B5C',
    recommendation: 'DIVERT VISITORS TOWARD ALTERNATIVE LOWER-DENSITY GATE',
    recommendationSub: 'Critical crowd surge occupancy detected from verified demo footage.',
    alertMessage: 'Critical crowd pressure detected. Immediate diversion recommended.'
  }
];

export function findVerifiedVideoClassification(input: string): VerifiedVideoClassification | null {
  if (!input) return null;
  const raw = input.toLowerCase();
  const normalized = raw.replace(/[^a-z0-9]/g, '');

  for (const item of VERIFIED_VIDEO_DATA) {
    const itemNorm = item.filename.toLowerCase().replace(/[^a-z0-9]/g, '');
    const keyClean = item.key.replace(/[^a-z0-9]/g, '');
    if (
      raw.includes(item.filename.toLowerCase()) ||
      normalized.includes(itemNorm) ||
      raw.includes(item.key) ||
      raw.includes(item.key.replace(/\./g, '_')) ||
      raw.includes(item.key.replace(/\./g, '-')) ||
      normalized.includes(keyClean)
    ) {
      return item;
    }
  }
  return null;
}

export class DatabaseService {
  private static instance: DatabaseService;
  public isConnectedToSqlServer = false;
  public lastError: string | null = null;
  public pool: sql.ConnectionPool | null = null;
  public isDemoMode: boolean = process.env.DEMO_MODE === 'true';

  // In-memory fallback dataset ONLY utilized when explicitly opted-in via DEMO_MODE=true
  public mockUsers: User[] = [...initialUsers];
  public mockEvents: MegaEvent[] = [...initialEvents];
  public mockLocations: Record<string, EventLocation> = { ...initialLocations };
  public mockVideos: Record<string, EventVideo> = { ...initialVideos };
  public mockZones: Record<string, Zone[]> = JSON.parse(JSON.stringify(initialZones));
  public mockGates: Record<string, Gate[]> = JSON.parse(JSON.stringify(initialGates));
  public mockCameras: Record<string, CameraFeed[]> = JSON.parse(JSON.stringify(initialCameras));
  public mockTransport: Record<string, TransportPoint[]> = JSON.parse(JSON.stringify(initialTransport));
  public mockEmergency: Record<string, EmergencyPoint[]> = JSON.parse(JSON.stringify(initialEmergency));
  public mockAlerts: AlertItem[] = [...initialAlerts];
  public mockInterventions: Intervention[] = [...initialInterventions];
  public mockVisitorReports: VisitorReport[] = [...initialVisitorReports];
  public mockEmergencyReports: EmergencyReport[] = [...initialEmergencyReports];
  public mockOfflineSyncQueue: any[] = [];
  public mockGateAnalysisStates: Record<string, GateAnalysisRecord[]> = {};

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initializes the Microsoft SQL Server 2022 connection.
   * If connection fails and DEMO_MODE is not true, DOES NOT switch to mock data.
   */
  public async initialize(): Promise<void> {
    if (this.isDemoMode) {
      console.log('ℹ️ [DEMO_MODE=true] Explicit demo mode active. Utilizing in-memory test repository.');
      this.isConnectedToSqlServer = false;
      this.lastError = null;
      return;
    }

    try {
      console.log(`[SQL Server 2022] Connecting to ${dbConfig.server}:${dbConfig.port}/${dbConfig.database} as user '${dbConfig.user}'...`);
      
      if (!dbConfig.password) {
        throw new Error("DB_PASSWORD environment variable is missing or empty. Please set DB_PASSWORD in node-api/.env.");
      }

      this.pool = await new sql.ConnectionPool(dbConfig).connect();
      
      // Perform test ping query
      const ping = await this.pool.request().query('SELECT 1 AS Ping');
      if (ping.recordset && ping.recordset.length > 0) {
        this.isConnectedToSqlServer = true;
        this.lastError = null;
        console.log('=======================================================');
        console.log(`✅ [SQL Server 2022] SQL Server connection successful!`);
        console.log(`🗄️ Database: ${dbConfig.database} on ${dbConfig.server}:${dbConfig.port}`);
        console.log(`👤 Connected as: ${dbConfig.user}`);
        console.log('=======================================================');

        // Ensure gate analysis tables are available
        await this.ensureGateAnalysisTables();
      }
    } catch (err: any) {
      this.isConnectedToSqlServer = false;
      this.lastError = err.message;
      this.pool = null;
      console.error('=======================================================');
      console.error('❌ [SQL Server 2022] SQL SERVER CONNECTION FAILED!');
      console.error(`Target: ${dbConfig.server}:${dbConfig.port}/${dbConfig.database}`);
      console.error(`Reason: ${err.message}`);
      console.error('⚠️ Real SQL Server is required. Automatic mock fallback is DISABLED.');
      console.error('=======================================================');
    }
  }

  public getPool(): sql.ConnectionPool | null {
    return this.pool;
  }

  // --- Real SQL Server Queries ---

  public async getCounts(): Promise<{ events: number; alerts: number; interventions: number; visitorReports: number; emergencies: number }> {
    if (this.isDemoMode) {
      return {
        events: this.mockEvents.length,
        alerts: this.mockAlerts.length,
        interventions: this.mockInterventions.length,
        visitorReports: this.mockVisitorReports.length,
        emergencies: this.mockEmergencyReports.length
      };
    }

    if (!this.pool || !this.isConnectedToSqlServer) {
      throw new Error(`Database connection not available: ${this.lastError || 'SQL Server is offline'}`);
    }

    const result = await this.pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM dbo.Events) AS events,
        (SELECT COUNT(*) FROM dbo.Alerts) AS alerts,
        (SELECT COUNT(*) FROM dbo.Interventions) AS interventions,
        (SELECT COUNT(*) FROM dbo.VisitorReports) AS visitorReports,
        (SELECT COUNT(*) FROM dbo.EmergencyReports) AS emergencies
    `);

    return result.recordset[0];
  }

  public async getEvents(): Promise<MegaEvent[]> {
    if (this.isDemoMode) return this.mockEvents;
    if (!this.pool || !this.isConnectedToSqlServer) throw new Error(this.lastError || 'Database not connected');

    const result = await this.pool.request().query(`
      SELECT 
        EventId, Name, Category, City, State, DateRange, ExpectedVisitors, Status, HasCameraCoverage, Description
      FROM dbo.Events
      ORDER BY Name ASC
    `);

    return result.recordset.map(r => ({
      id: r.EventId,
      name: r.Name,
      category: r.Category,
      city: r.City,
      state: r.State,
      location: `${r.City}, ${r.State}`,
      dateRange: r.DateRange,
      expectedVisitors: Number(r.ExpectedVisitors),
      status: r.Status,
      hasCameraCoverage: Boolean(r.HasCameraCoverage),
      description: r.Description,
      schedule: []
    }));
  }

  public async getEventById(eventId: string): Promise<MegaEvent | null> {
    if (this.isDemoMode) {
      return this.mockEvents.find(e => e.id === eventId) || null;
    }
    if (!this.pool || !this.isConnectedToSqlServer) throw new Error(this.lastError || 'Database not connected');

    const result = await this.pool.request()
      .input('EventId', sql.NVarChar, eventId)
      .query(`
        SELECT 
          EventId, Name, Category, City, State, DateRange, ExpectedVisitors, Status, HasCameraCoverage, Description
        FROM dbo.Events
        WHERE EventId = @EventId
      `);

    if (result.recordset.length === 0) return null;
    const r = result.recordset[0];
    return {
      id: r.EventId,
      name: r.Name,
      category: r.Category,
      city: r.City,
      state: r.State,
      location: `${r.City}, ${r.State}`,
      dateRange: r.DateRange,
      expectedVisitors: Number(r.ExpectedVisitors),
      status: r.Status,
      hasCameraCoverage: Boolean(r.HasCameraCoverage),
      description: r.Description,
      schedule: []
    };
  }

  public async getEventLocation(eventId: string): Promise<EventLocation | null> {
    if (this.isDemoMode) return this.mockLocations[eventId] || null;
    if (!this.pool || !this.isConnectedToSqlServer) throw new Error(this.lastError || 'Database not connected');

    const result = await this.pool.request()
      .input('EventId', sql.NVarChar, eventId)
      .query(`
        SELECT LocationId, EventId, Name, Latitude, Longitude, DefaultZoom, VenueRadiusMeters, Address
        FROM dbo.EventLocations
        WHERE EventId = @EventId
      `);

    if (result.recordset.length === 0) return null;
    const r = result.recordset[0];
    return {
      locationId: r.LocationId,
      eventId: r.EventId,
      name: r.Name,
      latitude: r.Latitude,
      longitude: r.Longitude,
      defaultZoom: r.DefaultZoom,
      venueRadiusMeters: r.VenueRadiusMeters,
      address: r.Address
    };
  }

  public async getEventVideo(eventId: string): Promise<EventVideo | null> {
    if (this.isDemoMode) return this.mockVideos[eventId] || null;
    if (!this.pool || !this.isConnectedToSqlServer) throw new Error(this.lastError || 'Database not connected');

    const result = await this.pool.request()
      .input('EventId', sql.NVarChar, eventId)
      .query(`
        SELECT VideoId, EventId, Title, VideoUrl, ThumbnailUrl, IsRecorded, Description, DurationSeconds
        FROM dbo.EventVideos
        WHERE EventId = @EventId
      `);

    if (result.recordset.length === 0) return null;
    const r = result.recordset[0];
    return {
      videoId: r.VideoId,
      eventId: r.EventId,
      title: r.Title,
      videoUrl: r.VideoUrl,
      thumbnailUrl: r.ThumbnailUrl,
      isRecorded: Boolean(r.IsRecorded),
      description: r.Description,
      durationSeconds: r.DurationSeconds
    };
  }

  public async getGates(eventId: string): Promise<Gate[]> {
    if (this.isDemoMode) return this.mockGates[eventId] || [];
    if (!this.pool || !this.isConnectedToSqlServer) throw new Error(this.lastError || 'Database not connected');

    const result = await this.pool.request()
      .input('EventId', sql.NVarChar, eventId)
      .query(`
        SELECT GateId, EventId, ZoneId, Name, Latitude, Longitude, QueueTimeMinutes, FlowRatePerMin, Status, IsEmergencyExit
        FROM dbo.Gates
        WHERE EventId = @EventId
      `);

    return result.recordset.map(g => ({
      gateId: g.GateId,
      eventId: g.EventId,
      zoneId: g.ZoneId,
      name: g.Name,
      latitude: g.Latitude,
      longitude: g.Longitude,
      queueTimeMinutes: g.QueueTimeMinutes || 0,
      flowRatePerMin: g.FlowRatePerMin || 0,
      status: g.Status,
      isEmergencyExit: Boolean(g.IsEmergencyExit)
    }));
  }

  public async getZones(eventId: string): Promise<Zone[]> {
    if (this.isDemoMode) return this.mockZones[eventId] || [];
    if (!this.pool || !this.isConnectedToSqlServer) throw new Error(this.lastError || 'Database not connected');

    const result = await this.pool.request()
      .input('EventId', sql.NVarChar, eventId)
      .query(`
        SELECT ZoneId, EventId, Name, PolygonGeoJSON, CenterLat, CenterLng, Capacity, CurrentOccupancy, PressurePercent, Status, AccommodationPressure
        FROM dbo.Zones
        WHERE EventId = @EventId
      `);

    return result.recordset.map(z => {
      let polygon: [number, number][] = [];
      try {
        polygon = JSON.parse(z.PolygonGeoJSON);
      } catch {
        polygon = [];
      }
      return {
        zoneId: z.ZoneId,
        eventId: z.EventId,
        name: z.Name,
        polygonGeoJSON: polygon,
        centerLat: z.CenterLat,
        centerLng: z.CenterLng,
        capacity: z.Capacity,
        currentOccupancy: z.CurrentOccupancy,
        pressurePercent: z.PressurePercent,
        status: z.Status,
        accommodationPressure: z.AccommodationPressure
      };
    });
  }

  public async getCameras(eventId: string): Promise<CameraFeed[]> {
    if (this.isDemoMode) return this.mockCameras[eventId] || [];
    if (!this.pool || !this.isConnectedToSqlServer) throw new Error(this.lastError || 'Database not connected');

    const result = await this.pool.request()
      .input('EventId', sql.NVarChar, eventId)
      .query(`
        SELECT CameraId, EventId, ZoneId, Name, StreamUrl, Latitude, Longitude, Status, LastFlowPerMin, LastDensityPercent, LastPeopleCount
        FROM dbo.Cameras
        WHERE EventId = @EventId
      `);

    return result.recordset.map(c => ({
      cameraId: c.CameraId,
      eventId: c.EventId,
      zoneId: c.ZoneId,
      name: c.Name,
      streamUrl: c.StreamUrl,
      latitude: c.Latitude,
      longitude: c.Longitude,
      status: (c.Status === 'online' ? 'ONLINE' : c.Status === 'ALERT' ? 'ALERT' : 'ONLINE') as any,
      lastFlowPerMin: c.LastFlowPerMin || 180,
      lastDensityPercent: c.LastDensityPercent || 65,
      lastPeopleCount: c.LastPeopleCount || 1200
    }));
  }

  public async getTransport(eventId: string): Promise<TransportPoint[]> {
    if (this.isDemoMode) return this.mockTransport[eventId] || [];
    if (!this.pool || !this.isConnectedToSqlServer) throw new Error(this.lastError || 'Database not connected');

    const result = await this.pool.request()
      .input('EventId', sql.NVarChar, eventId)
      .query(`
        SELECT TransportId, EventId, Name, Type, Latitude, Longitude, CapacityPerHour, UtilizationPercent, Status
        FROM dbo.TransportPoints
        WHERE EventId = @EventId
      `);

    return result.recordset.map(t => ({
      transportId: t.TransportId,
      eventId: t.EventId,
      name: t.Name,
      type: t.Type,
      latitude: t.Latitude,
      longitude: t.Longitude,
      capacityPerHour: t.CapacityPerHour || 2500,
      utilizationPercent: t.UtilizationPercent || 60,
      status: (t.Status === 'ELEVATED' ? 'BUSY' : t.Status === 'FULL' ? 'OVERLOADED' : 'NORMAL') as any
    }));
  }

  public async getEmergencyPoints(eventId: string): Promise<EmergencyPoint[]> {
    if (this.isDemoMode) return this.mockEmergency[eventId] || [];
    if (!this.pool || !this.isConnectedToSqlServer) throw new Error(this.lastError || 'Database not connected');

    const result = await this.pool.request()
      .input('EventId', sql.NVarChar, eventId)
      .query(`
        SELECT PointId, EventId, Name, Type, Latitude, Longitude, ContactNumber, IsActive
        FROM dbo.EmergencyPoints
        WHERE EventId = @EventId
      `);

    return result.recordset.map(e => ({
      pointId: e.PointId,
      eventId: e.EventId,
      name: e.Name,
      type: (e.Type === 'HELP_DESK' ? 'INFORMATION' : e.Type || 'MEDICAL') as any,
      latitude: e.Latitude,
      longitude: e.Longitude,
      contactNumber: e.ContactNumber,
      isActive: Boolean(e.IsActive)
    }));
  }

  public async getAlerts(eventId?: string): Promise<AlertItem[]> {
    if (this.isDemoMode) {
      return eventId ? this.mockAlerts.filter(a => a.eventId === eventId) : this.mockAlerts;
    }
    if (!this.pool || !this.isConnectedToSqlServer) throw new Error(this.lastError || 'Database not connected');

    const req = this.pool.request();
    let query = `
      SELECT AlertId, EventId, Title, Message, Recommendation, TargetGateId, TargetZoneId, Severity, Status, CreatedAt
      FROM dbo.Alerts
    `;
    if (eventId) {
      req.input('EventId', sql.NVarChar, eventId);
      query += ` WHERE EventId = @EventId`;
    }
    query += ` ORDER BY CreatedAt DESC`;

    const result = await req.query(query);
    return result.recordset.map(a => ({
      alertId: a.AlertId,
      eventId: a.EventId,
      title: a.Title,
      message: a.Message,
      recommendation: a.Recommendation,
      targetGateId: a.TargetGateId || undefined,
      targetZoneId: a.TargetZoneId || undefined,
      severity: a.Severity,
      status: a.Status,
      createdAt: a.CreatedAt ? new Date(a.CreatedAt).toISOString() : new Date().toISOString()
    }));
  }

  public async createAlert(alert: Partial<AlertItem>): Promise<AlertItem> {
    const alertId = alert.alertId || `alt-${Date.now()}`;
    const newAlert: AlertItem = {
      alertId,
      eventId: alert.eventId || 'maha-kumbh',
      title: alert.title || 'Operational Notification',
      message: alert.message || '',
      recommendation: alert.recommendation || 'USE GATE 3',
      targetGateId: alert.targetGateId || undefined,
      targetZoneId: alert.targetZoneId || undefined,
      severity: alert.severity || 'HIGH',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    if (this.isDemoMode) {
      this.mockAlerts.unshift(newAlert);
      return newAlert;
    }

    if (!this.pool || !this.isConnectedToSqlServer) throw new Error(this.lastError || 'Database not connected');

    await this.pool.request()
      .input('AlertId', sql.NVarChar, newAlert.alertId)
      .input('EventId', sql.NVarChar, newAlert.eventId)
      .input('Title', sql.NVarChar, newAlert.title)
      .input('Message', sql.NVarChar, newAlert.message)
      .input('Recommendation', sql.NVarChar, newAlert.recommendation)
      .input('TargetGateId', sql.NVarChar, newAlert.targetGateId)
      .input('TargetZoneId', sql.NVarChar, newAlert.targetZoneId)
      .input('Severity', sql.NVarChar, newAlert.severity)
      .input('Status', sql.NVarChar, newAlert.status)
      .query(`
        INSERT INTO dbo.Alerts (AlertId, EventId, Title, Message, Recommendation, TargetGateId, TargetZoneId, Severity, Status, CreatedAt)
        VALUES (@AlertId, @EventId, @Title, @Message, @Recommendation, @TargetGateId, @TargetZoneId, @Severity, @Status, SYSUTCDATETIME())
      `);

    return newAlert;
  }

  public async resolveAlert(alertId: string): Promise<boolean> {
    if (this.isDemoMode) {
      const a = this.mockAlerts.find(x => x.alertId === alertId);
      if (a) a.status = 'RESOLVED';
      return !!a;
    }

    if (!this.pool || !this.isConnectedToSqlServer) throw new Error(this.lastError || 'Database not connected');

    const res = await this.pool.request()
      .input('AlertId', sql.NVarChar, alertId)
      .query(`UPDATE dbo.Alerts SET Status = 'RESOLVED' WHERE AlertId = @AlertId`);

    return (res.rowsAffected[0] || 0) > 0;
  }

  public async getInterventions(eventId?: string): Promise<Intervention[]> {
    if (this.isDemoMode) {
      return eventId ? this.mockInterventions.filter(i => i.eventId === eventId) : this.mockInterventions;
    }
    if (!this.pool || !this.isConnectedToSqlServer) throw new Error(this.lastError || 'Database not connected');

    const req = this.pool.request();
    let query = `
      SELECT InterventionId, EventId, Title, ActionType, TargetEntity, Description, BeforeState, AfterState, Status, ApprovedByUserId, ApprovedAt, MeasuredOutcome, CreatedAt
      FROM dbo.Interventions
    `;
    if (eventId) {
      req.input('EventId', sql.NVarChar, eventId);
      query += ` WHERE EventId = @EventId`;
    }
    query += ` ORDER BY CreatedAt DESC`;

    const result = await req.query(query);
    return result.recordset.map(i => ({
      interventionId: i.InterventionId,
      eventId: i.EventId,
      title: i.Title,
      actionType: i.ActionType,
      targetEntity: i.TargetEntity,
      description: i.Description,
      beforeState: i.BeforeState,
      afterState: i.AfterState,
      status: i.Status,
      approvedByUserId: i.ApprovedByUserId,
      approvedAt: i.ApprovedAt ? new Date(i.ApprovedAt).toISOString() : undefined,
      measuredOutcome: i.MeasuredOutcome,
      createdAt: i.CreatedAt ? new Date(i.CreatedAt).toISOString() : new Date().toISOString()
    }));
  }

  public async approveIntervention(interventionId: string, approvedByUserId: string = 'usr-op-01', measuredOutcome?: string): Promise<boolean> {
    if (this.isDemoMode) {
      const item = this.mockInterventions.find(i => i.interventionId === interventionId);
      if (item) {
        item.status = 'APPROVED';
        item.approvedByUserId = approvedByUserId;
        item.approvedAt = new Date().toISOString();
        item.measuredOutcome = measuredOutcome || 'Action approved and executed.';
        return true;
      }
      return false;
    }

    if (!this.pool || !this.isConnectedToSqlServer) throw new Error(this.lastError || 'Database not connected');

    const req = this.pool.request();
    req.input('InterventionId', sql.NVarChar, interventionId);
    req.input('ApprovedByUserId', sql.NVarChar, approvedByUserId);
    req.input('MeasuredOutcome', sql.NVarChar, measuredOutcome || 'Action approved and dispatched to field teams.');

    await req.execute('dbo.sp_ApproveIntervention');
    return true;
  }

  public async createIntervention(item: Partial<Intervention>): Promise<Intervention> {
    const interventionId = item.interventionId || `int-${Date.now()}`;
    const newInt: Intervention = {
      interventionId,
      eventId: item.eventId || 'maha-kumbh',
      title: item.title || 'Operational Intervention',
      actionType: item.actionType || 'REDIRECT',
      targetEntity: item.targetEntity || 'Gate 2',
      description: item.description || 'Operator initiated action',
      beforeState: item.beforeState || 'HIGH',
      afterState: item.afterState || 'MODERATE',
      status: 'APPROVED',
      approvedByUserId: item.approvedByUserId || 'usr-op-01',
      approvedAt: new Date().toISOString(),
      measuredOutcome: item.measuredOutcome || `Target pressure reduced from ${item.beforeState || 'HIGH'} to ${item.afterState || 'MODERATE'}.`,
      createdAt: new Date().toISOString()
    };

    if (this.isDemoMode) {
      this.mockInterventions.unshift(newInt);
      return newInt;
    }

    if (!this.pool || !this.isConnectedToSqlServer) throw new Error(this.lastError || 'Database not connected');

    await this.pool.request()
      .input('InterventionId', sql.NVarChar, newInt.interventionId)
      .input('EventId', sql.NVarChar, newInt.eventId)
      .input('Title', sql.NVarChar, newInt.title)
      .input('ActionType', sql.NVarChar, newInt.actionType)
      .input('TargetEntity', sql.NVarChar, newInt.targetEntity)
      .input('Description', sql.NVarChar, newInt.description)
      .input('BeforeState', sql.NVarChar, newInt.beforeState)
      .input('AfterState', sql.NVarChar, newInt.afterState)
      .input('Status', sql.NVarChar, newInt.status)
      .input('ApprovedByUserId', sql.NVarChar, newInt.approvedByUserId)
      .input('MeasuredOutcome', sql.NVarChar, newInt.measuredOutcome)
      .query(`
        INSERT INTO dbo.Interventions (InterventionId, EventId, Title, ActionType, TargetEntity, Description, BeforeState, AfterState, Status, ApprovedByUserId, ApprovedAt, MeasuredOutcome, CreatedAt)
        VALUES (@InterventionId, @EventId, @Title, @ActionType, @TargetEntity, @Description, @BeforeState, @AfterState, @Status, @ApprovedByUserId, SYSUTCDATETIME(), @MeasuredOutcome, SYSUTCDATETIME())
      `);

    return newInt;
  }

  public async getVisitorReports(eventId?: string): Promise<VisitorReport[]> {
    if (this.isDemoMode) {
      return eventId ? this.mockVisitorReports.filter(r => r.eventId === eventId) : this.mockVisitorReports;
    }
    if (!this.pool || !this.isConnectedToSqlServer) throw new Error(this.lastError || 'Database not connected');

    const req = this.pool.request();
    let query = `
      SELECT ReportId, EventId, UserId, Category, Description, Latitude, Longitude, Status, CreatedAt
      FROM dbo.VisitorReports
    `;
    if (eventId) {
      req.input('EventId', sql.NVarChar, eventId);
      query += ` WHERE EventId = @EventId`;
    }
    query += ` ORDER BY CreatedAt DESC`;

    const mapCategory = (c?: string): 'Heavy Crowd' | 'Blocked Route' | 'Medical Emergency' | 'Unsafe Area' | 'Lost Person' | 'Other' => {
      if (!c) return 'Other';
      const l = c.toLowerCase().replace(/_/g, ' ');
      if (l.includes('heavy') || l.includes('crowd')) return 'Heavy Crowd';
      if (l.includes('block') || l.includes('route')) return 'Blocked Route';
      if (l.includes('med')) return 'Medical Emergency';
      if (l.includes('unsafe') || l.includes('danger')) return 'Unsafe Area';
      if (l.includes('lost') || l.includes('person')) return 'Lost Person';
      return 'Other';
    };

    const result = await req.query(query);
    return result.recordset.map(r => ({
      reportId: r.ReportId,
      eventId: r.EventId,
      userId: r.UserId,
      userName: 'Visitor',
      category: mapCategory(r.Category),
      description: r.Description,
      latitude: r.Latitude,
      longitude: r.Longitude,
      status: r.Status,
      createdAt: r.CreatedAt ? new Date(r.CreatedAt).toISOString() : new Date().toISOString()
    }));
  }

  public async createVisitorReport(report: Partial<VisitorReport>): Promise<VisitorReport> {
    const mapCategory = (c?: string): 'Heavy Crowd' | 'Blocked Route' | 'Medical Emergency' | 'Unsafe Area' | 'Lost Person' | 'Other' => {
      if (!c) return 'Other';
      const l = c.toLowerCase().replace(/_/g, ' ');
      if (l.includes('heavy') || l.includes('crowd')) return 'Heavy Crowd';
      if (l.includes('block') || l.includes('route')) return 'Blocked Route';
      if (l.includes('med')) return 'Medical Emergency';
      if (l.includes('unsafe') || l.includes('danger')) return 'Unsafe Area';
      if (l.includes('lost') || l.includes('person')) return 'Lost Person';
      return 'Other';
    };

    const reportId = report.reportId || `rep-${Date.now()}`;
    const newReport: VisitorReport = {
      reportId,
      eventId: report.eventId || 'maha-kumbh',
      userId: report.userId || 'anonymous',
      userName: report.userName || 'Visitor',
      category: mapCategory(report.category),
      description: report.description || '',
      latitude: report.latitude || 25.4294,
      longitude: report.longitude || 81.8841,
      status: 'NEW',
      createdAt: new Date().toISOString()
    };

    if (this.isDemoMode) {
      this.mockVisitorReports.unshift(newReport);
      return newReport;
    }

    if (!this.pool || !this.isConnectedToSqlServer) throw new Error(this.lastError || 'Database not connected');

    await this.pool.request()
      .input('ReportId', sql.NVarChar, newReport.reportId)
      .input('EventId', sql.NVarChar, newReport.eventId)
      .input('UserId', sql.NVarChar, newReport.userId)
      .input('Category', sql.NVarChar, newReport.category)
      .input('Description', sql.NVarChar, newReport.description)
      .input('Latitude', sql.Float, newReport.latitude)
      .input('Longitude', sql.Float, newReport.longitude)
      .input('Status', sql.NVarChar, newReport.status)
      .query(`
        INSERT INTO dbo.VisitorReports (ReportId, EventId, UserId, Category, Description, Latitude, Longitude, Status, CreatedAt)
        VALUES (@ReportId, @EventId, @UserId, @Category, @Description, @Latitude, @Longitude, @Status, SYSUTCDATETIME())
      `);

    return newReport;
  }

  public async getEmergencyReports(eventId?: string): Promise<EmergencyReport[]> {
    if (this.isDemoMode) {
      return eventId ? this.mockEmergencyReports.filter(e => e.eventId === eventId) : this.mockEmergencyReports;
    }
    if (!this.pool || !this.isConnectedToSqlServer) throw new Error(this.lastError || 'Database not connected');

    const req = this.pool.request();
    let query = `
      SELECT EmergencyId, EventId, UserId, EmergencyType, Latitude, Longitude, Accuracy, Notes, Status, CreatedAt
      FROM dbo.EmergencyReports
    `;
    if (eventId) {
      req.input('EventId', sql.NVarChar, eventId);
      query += ` WHERE EventId = @EventId`;
    }
    query += ` ORDER BY CreatedAt DESC`;

    const result = await req.query(query);
    return result.recordset.map(e => ({
      emergencyId: e.EmergencyId,
      eventId: e.EventId,
      userId: e.UserId,
      userName: 'Visitor in Distress',
      emergencyType: e.EmergencyType,
      latitude: e.Latitude,
      longitude: e.Longitude,
      accuracy: e.Accuracy,
      notes: e.Notes,
      status: e.Status,
      createdAt: e.CreatedAt ? new Date(e.CreatedAt).toISOString() : new Date().toISOString()
    }));
  }

  public async createEmergencySOS(report: Partial<EmergencyReport>): Promise<EmergencyReport> {
    const emergencyId = report.emergencyId || `sos-${Date.now()}`;
    const newReport: EmergencyReport = {
      emergencyId,
      eventId: report.eventId || 'maha-kumbh',
      userId: report.userId || 'anonymous-user',
      userName: report.userName || 'Visitor in Distress',
      emergencyType: 'SOS',
      latitude: report.latitude || 25.4294,
      longitude: report.longitude || 81.8841,
      accuracy: report.accuracy || 5,
      notes: report.notes || 'EMERGENCY SOS triggered by visitor.',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    if (this.isDemoMode) {
      this.mockEmergencyReports.unshift(newReport);
      return newReport;
    }

    if (!this.pool || !this.isConnectedToSqlServer) throw new Error(this.lastError || 'Database not connected');

    const req = this.pool.request();
    req.input('EmergencyId', sql.NVarChar, newReport.emergencyId);
    req.input('EventId', sql.NVarChar, newReport.eventId);
    req.input('UserId', sql.NVarChar, newReport.userId);
    req.input('EmergencyType', sql.NVarChar, newReport.emergencyType);
    req.input('Latitude', sql.Float, newReport.latitude);
    req.input('Longitude', sql.Float, newReport.longitude);
    req.input('Accuracy', sql.Float, newReport.accuracy || 5);
    req.input('Notes', sql.NVarChar, newReport.notes || '');

    await req.execute('dbo.sp_ReportEmergencySOS');
    return newReport;
  }

  public async createStuckReport(report: Partial<EmergencyReport>): Promise<EmergencyReport> {
    const emergencyId = report.emergencyId || `stk-${Date.now()}`;
    const newReport: EmergencyReport = {
      emergencyId,
      eventId: report.eventId || 'maha-kumbh',
      userId: report.userId || 'anonymous-user',
      userName: report.userName || 'Visitor',
      emergencyType: report.emergencyType || 'FIND_SAFE_PLACE',
      latitude: report.latitude || 25.4294,
      longitude: report.longitude || 81.8841,
      accuracy: report.accuracy || 8,
      notes: report.notes || `User requested assistance: ${report.emergencyType}`,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    if (this.isDemoMode) {
      this.mockEmergencyReports.unshift(newReport);
      return newReport;
    }

    if (!this.pool || !this.isConnectedToSqlServer) throw new Error(this.lastError || 'Database not connected');

    await this.pool.request()
      .input('EmergencyId', sql.NVarChar, newReport.emergencyId)
      .input('EventId', sql.NVarChar, newReport.eventId)
      .input('UserId', sql.NVarChar, newReport.userId)
      .input('EmergencyType', sql.NVarChar, newReport.emergencyType)
      .input('Latitude', sql.Float, newReport.latitude)
      .input('Longitude', sql.Float, newReport.longitude)
      .input('Accuracy', sql.Float, newReport.accuracy || 8)
      .input('Notes', sql.NVarChar, newReport.notes)
      .input('Status', sql.NVarChar, newReport.status)
      .query(`
        INSERT INTO dbo.EmergencyReports (EmergencyId, EventId, UserId, EmergencyType, Latitude, Longitude, Accuracy, Notes, Status, CreatedAt)
        VALUES (@EmergencyId, @EventId, @UserId, @EmergencyType, @Latitude, @Longitude, @Accuracy, @Notes, @Status, SYSUTCDATETIME())
      `);

    return newReport;
  }

  public async authenticateUser(username: string): Promise<User | null> {
    if (this.isDemoMode) {
      return this.mockUsers.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
    }

    if (!this.pool || !this.isConnectedToSqlServer) throw new Error(this.lastError || 'Database not connected');

    const result = await this.pool.request()
      .input('Username', sql.NVarChar, username)
      .query(`
        SELECT UserId, Username, FullName, Role, Email, Phone
        FROM dbo.Users
        WHERE Username = @Username AND IsActive = 1
      `);

    if (result.recordset.length === 0) return null;
    const r = result.recordset[0];
    return {
      userId: r.UserId,
      username: r.Username,
      fullName: r.FullName,
      role: r.Role,
      email: r.Email,
      phone: r.Phone
    };
  }

  public async recordCrowdObservation(obs: any): Promise<void> {
    if (this.isDemoMode) return;
    if (!this.pool || !this.isConnectedToSqlServer) return;

    try {
      const req = this.pool.request();
      req.input('ObservationId', sql.NVarChar, obs.observationId);
      req.input('EventId', sql.NVarChar, obs.eventId);
      req.input('ZoneId', sql.NVarChar, obs.zoneId || null);
      req.input('CameraId', sql.NVarChar, obs.cameraId || null);
      req.input('LocationDescription', sql.NVarChar, obs.locationDescription);
      req.input('PeopleCount', sql.Int, obs.peopleCount);
      req.input('DensityPercent', sql.Int, obs.densityPercent);
      req.input('FlowRatePerMin', sql.Int, obs.flowRatePerMin);
      req.input('MovementDirection', sql.NVarChar, obs.movementDirection);
      req.input('CongestionLevel', sql.NVarChar, obs.congestionLevel);
      req.input('SourceType', sql.NVarChar, obs.sourceType);
      req.input('IsSimulated', sql.Bit, obs.isSimulated ? 1 : 0);

      await req.execute('dbo.sp_RecordCrowdObservation');
    } catch (err: any) {
      console.warn('Observation logging warning:', err.message);
    }
  }

  public async recordUserLocation(userId: string, eventId: string, latitude: number, longitude: number, accuracy?: number): Promise<void> {
    if (this.isDemoMode || !this.pool || !this.isConnectedToSqlServer) return;

    try {
      await this.pool.request()
        .input('UserId', sql.NVarChar, userId)
        .input('EventId', sql.NVarChar, eventId)
        .input('Latitude', sql.Float, latitude)
        .input('Longitude', sql.Float, longitude)
        .input('Accuracy', sql.Float, accuracy || null)
        .query(`
          INSERT INTO dbo.UserLocations (UserId, EventId, Latitude, Longitude, AccuracyMeters, RecordedAt)
          VALUES (@UserId, @EventId, @Latitude, @Longitude, @Accuracy, SYSUTCDATETIME())
        `);
    } catch (err: any) {
      console.warn('Location recording warning:', err.message);
    }
  }

  public async processOfflineSync(syncId: string, userId: string, payloadType: string, payloadJSON: string, clientTimestamp: string): Promise<void> {
    if (this.isDemoMode || !this.pool || !this.isConnectedToSqlServer) return;

    try {
      const req = this.pool.request();
      req.input('SyncId', sql.NVarChar, syncId);
      req.input('UserId', sql.NVarChar, userId);
      req.input('PayloadType', sql.NVarChar, payloadType);
      req.input('PayloadJSON', sql.NVarChar, payloadJSON);
      req.input('ClientTimestamp', sql.DateTime2, new Date(clientTimestamp));

      await req.execute('dbo.sp_ProcessOfflineSync');
    } catch (err: any) {
      console.warn('Offline sync queue warning:', err.message);
    }
  }

  public getVerifiedVideoClassification(videoName: string): VerifiedVideoClassification | null {
    return findVerifiedVideoClassification(videoName);
  }

  public getInitialGateAnalysisStates(eventId: string = 'maha-kumbh'): GateAnalysisRecord[] {
    if (eventId === 'mumbai-ganpati') {
      return [
        {
          gateId: 'gt-mumbai-1',
          eventId: 'mumbai-ganpati',
          videoId: 'vid-mumbai-1',
          videoName: 'Gate1_2.03.00 PM.mp4',
          videoUrl: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 10.19.31 PM.mp4'),
          videoThumbnail: '',
          uploadedAt: new Date().toISOString(),
          crowdLevel: 'LOW / LESS CROWD',
          crowdDensity: '15%',
          crowdFlow: 'LIGHT CROWD MOVEMENT',
          status: 'NORMAL',
          color: '#00D6A3',
          recommendation: 'NO INTERVENTION REQUIRED',
          recommendationSub: 'Observed density is well within safe gate capacity.',
          alertMessage: 'Lalbaug Entry ingress is clear. Normal queuing.',
          analysisType: 'DEMO_VISION',
          analysisTimestamp: new Date().toISOString(),
          isApplied: true
        },
        {
          gateId: 'gt-mumbai-2',
          eventId: 'mumbai-ganpati',
          videoId: 'vid-mumbai-2',
          videoName: 'Gate2_1.45.00 PM.mp4',
          videoUrl: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 4.12.37 PM.mp4'),
          videoThumbnail: '',
          uploadedAt: new Date().toISOString(),
          crowdLevel: 'VERY HIGH',
          crowdDensity: '89%',
          crowdFlow: 'HEAVY CROWD MOVEMENT',
          status: 'CRITICAL CROWD PRESSURE',
          color: '#FF3B5C',
          recommendation: 'DIVERT TOWARD PAREL APPROACH',
          recommendationSub: 'Critical procession density along Main Road.',
          alertMessage: 'Extreme crowd surge on Main Road. Diverting visitors to Parel Approach.',
          analysisType: 'DEMO_VISION',
          analysisTimestamp: new Date().toISOString(),
          isApplied: true
        },
        {
          gateId: 'gt-mumbai-3',
          eventId: 'mumbai-ganpati',
          videoId: 'vid-mumbai-3',
          videoName: 'Gate3_1.52.00 PM.mp4',
          videoUrl: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 4.12.38 PM.mp4'),
          videoThumbnail: '',
          uploadedAt: new Date().toISOString(),
          crowdLevel: 'MODERATE',
          crowdDensity: '39%',
          crowdFlow: 'STEADY INFLOW',
          status: 'CONTROLLED',
          color: '#FFB020',
          recommendation: 'MONITOR FLOW & BUFFER ARRIVALS',
          recommendationSub: 'Concourse flow within manageable thresholds.',
          alertMessage: 'Moderate crowd volume along Ganesh Gully approach.',
          analysisType: 'DEMO_VISION',
          analysisTimestamp: new Date().toISOString(),
          isApplied: true
        },
        {
          gateId: 'gt-mumbai-4',
          eventId: 'mumbai-ganpati',
          videoId: 'vid-mumbai-4',
          videoName: 'Gate4_2.01.00 PM.mp4',
          videoUrl: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 4.12.21 PM.mp4'),
          videoThumbnail: '',
          uploadedAt: new Date().toISOString(),
          crowdLevel: 'HIGH',
          crowdDensity: '69%',
          crowdFlow: 'ACTIVE CROWD MOVEMENT',
          status: 'ELEVATED CROWD PRESSURE',
          color: '#f97316',
          recommendation: 'MONITOR FLOW & BUFFER ARRIVALS',
          recommendationSub: 'Elevated crowd transit from Parel railway station.',
          alertMessage: 'Parel approach operating under elevated load. Follow designated walking lanes.',
          analysisType: 'DEMO_VISION',
          analysisTimestamp: new Date().toISOString(),
          isApplied: true
        },
        {
          gateId: 'gt-mumbai-5',
          eventId: 'mumbai-ganpati',
          videoId: 'vid-mumbai-5',
          videoName: 'Gate5_1.58.00 PM.mp4',
          videoUrl: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 4.12.34 PM.mp4'),
          videoThumbnail: '',
          uploadedAt: new Date().toISOString(),
          crowdLevel: 'HIGH',
          crowdDensity: '56%',
          crowdFlow: 'ACTIVE CROWD MOVEMENT',
          status: 'ELEVATED CROWD PRESSURE',
          color: '#f97316',
          recommendation: 'REGULATE CHINTAMANI INGRESS',
          recommendationSub: 'Active procession ingress toward Chintamani darshan line.',
          alertMessage: 'Chintamani Gate has high crowd movement. Follow queue barricades.',
          analysisType: 'DEMO_VISION',
          analysisTimestamp: new Date().toISOString(),
          isApplied: true
        }
      ];
    }

    return [
      {
        gateId: 'gt-kumbh-1',
        eventId,
        videoId: 'vid-gt-1',
        videoName: 'Gate1_10.19.31 PM.mp4',
        videoUrl: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 10.19.31 PM.mp4'),
        videoThumbnail: '',
        uploadedAt: new Date().toISOString(),
        crowdLevel: 'LOW / LESS CROWD',
        crowdDensity: '15%',
        crowdFlow: 'LIGHT CROWD MOVEMENT',
        status: 'NORMAL',
        color: '#00D6A3',
        recommendation: 'NO INTERVENTION REQUIRED',
        recommendationSub: 'Current crowd is within safe limits.',
        alertMessage: 'Crowd at Gate 1 is normal. No diversion required.',
        analysisType: 'DEMO_VISION',
        analysisTimestamp: new Date().toISOString(),
        isApplied: true
      },
      {
        gateId: 'gt-kumbh-2',
        eventId,
        videoId: 'vid-gt-2',
        videoName: 'Gate2_4.12.37 PM.mp4',
        videoUrl: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 4.12.37 PM.mp4'),
        videoThumbnail: '',
        uploadedAt: new Date().toISOString(),
        crowdLevel: 'VERY HIGH',
        crowdDensity: '89%',
        crowdFlow: 'HEAVY CROWD MOVEMENT',
        status: 'CRITICAL CROWD PRESSURE',
        color: '#FF3B5C',
        recommendation: 'CONSIDER DIVERTING VISITORS TOWARD A LOWER-DENSITY GATE',
        recommendationSub: 'Critical crowd pressure detected at Sangam Direct approach.',
        alertMessage: 'High crowd pressure detected at Gate 2. Please use Gate 4 for safer movement.',
        analysisType: 'DEMO_VISION',
        analysisTimestamp: new Date().toISOString(),
        isApplied: true
      },
      {
        gateId: 'gt-kumbh-3',
        eventId,
        videoId: 'vid-gt-3',
        videoName: 'Gate3_4.12.34 PM.mp4',
        videoUrl: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 4.12.34 PM.mp4'),
        videoThumbnail: '',
        uploadedAt: new Date().toISOString(),
        crowdLevel: 'HIGH',
        crowdDensity: '56%',
        crowdFlow: 'ACTIVE CROWD MOVEMENT',
        status: 'ELEVATED CROWD PRESSURE',
        color: '#f97316',
        recommendation: 'CONSIDER DIVERTING VISITORS TOWARD A LOWER-DENSITY GATE',
        recommendationSub: 'Elevated bottleneck crowd pressure detected at North Causeway.',
        alertMessage: 'Elevated crowd detected at Gate 3. Diverting visitors toward Gate 4 / Arail Side.',
        analysisType: 'DEMO_VISION',
        analysisTimestamp: new Date().toISOString(),
        isApplied: true
      },
      {
        gateId: 'gt-kumbh-4',
        eventId,
        videoId: 'vid-gt-4',
        videoName: 'Gate4_4.12.38 PM.mp4',
        videoUrl: 'http://localhost:5000/uploads/demo-videos/' + encodeURIComponent('WhatsApp Video 2026-10-03 at 4.12.38 PM.mp4'),
        videoThumbnail: '',
        uploadedAt: new Date().toISOString(),
        crowdLevel: 'MODERATE',
        crowdDensity: '39%',
        crowdFlow: 'STEADY INFLOW',
        status: 'CONTROLLED',
        color: '#FFB020',
        recommendation: 'MONITOR CROWD DISTRIBUTION',
        recommendationSub: 'Concourse flow along Pontoon Bridge East is controlled.',
        alertMessage: 'Moderate crowd movement at Gate 4. Follow designated walking corridors.',
        analysisType: 'DEMO_VISION',
        analysisTimestamp: new Date().toISOString(),
        isApplied: true
      }
    ];
  }

  public async ensureGateAnalysisTables(): Promise<void> {
    if (this.isDemoMode || !this.pool || !this.isConnectedToSqlServer) return;

    try {
      await this.pool.request().query(`
        IF OBJECT_ID('dbo.GateAnalysisStates', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.GateAnalysisStates (
                GateId NVARCHAR(50) NOT NULL,
                EventId NVARCHAR(50) NOT NULL,
                VideoId NVARCHAR(100) NULL,
                VideoName NVARCHAR(255) NULL,
                VideoUrl NVARCHAR(500) NULL,
                VideoThumbnail NVARCHAR(500) NULL,
                UploadedAt DATETIME2 NULL,
                CrowdLevel NVARCHAR(50) NOT NULL,
                CrowdDensity NVARCHAR(20) NOT NULL,
                CrowdFlow NVARCHAR(100) NOT NULL,
                Status NVARCHAR(100) NOT NULL,
                Color NVARCHAR(30) NOT NULL,
                Recommendation NVARCHAR(MAX) NULL,
                RecommendationSub NVARCHAR(MAX) NULL,
                AlertMessage NVARCHAR(MAX) NULL,
                AnalysisType NVARCHAR(50) DEFAULT 'DEMO_VISION',
                AnalysisTimestamp DATETIME2 DEFAULT SYSUTCDATETIME(),
                IsApplied BIT DEFAULT 1,
                PRIMARY KEY (EventId, GateId)
            );
        END

        IF OBJECT_ID('dbo.GateAnalysisHistory', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.GateAnalysisHistory (
                HistoryId BIGINT IDENTITY(1,1) PRIMARY KEY,
                GateId NVARCHAR(50) NOT NULL,
                EventId NVARCHAR(50) NOT NULL,
                VideoName NVARCHAR(255) NULL,
                VideoUrl NVARCHAR(500) NULL,
                CrowdLevel NVARCHAR(50) NOT NULL,
                CrowdDensity NVARCHAR(20) NOT NULL,
                Status NVARCHAR(100) NOT NULL,
                AppliedAt DATETIME2 DEFAULT SYSUTCDATETIME()
            );
        END

        IF OBJECT_ID('dbo.VerifiedVideoClassifications', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.VerifiedVideoClassifications (
                VideoKey NVARCHAR(100) PRIMARY KEY,
                OriginalFilename NVARCHAR(255) NOT NULL,
                CrowdLevel NVARCHAR(50) NOT NULL,
                CrowdDensity NVARCHAR(20) NOT NULL,
                DensityPercent INT NOT NULL,
                CrowdFlow NVARCHAR(100) NOT NULL,
                Status NVARCHAR(100) NOT NULL,
                ZoneColor NVARCHAR(30) NOT NULL,
                Recommendation NVARCHAR(MAX) NULL,
                RecommendationSub NVARCHAR(MAX) NULL,
                AlertMessage NVARCHAR(MAX) NULL,
                CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
            );
        END
      `);

      // Seed verified video classifications
      for (const item of VERIFIED_VIDEO_DATA) {
        await this.pool.request()
          .input('VideoKey', sql.NVarChar, item.key)
          .input('OriginalFilename', sql.NVarChar, item.filename)
          .input('CrowdLevel', sql.NVarChar, item.crowdLevel)
          .input('CrowdDensity', sql.NVarChar, item.crowdDensity)
          .input('DensityPercent', sql.Int, item.densityPercent)
          .input('CrowdFlow', sql.NVarChar, item.crowdFlow)
          .input('Status', sql.NVarChar, item.status)
          .input('ZoneColor', sql.NVarChar, item.zoneColor)
          .input('Recommendation', sql.NVarChar, item.recommendation)
          .input('RecommendationSub', sql.NVarChar, item.recommendationSub)
          .input('AlertMessage', sql.NVarChar, item.alertMessage)
          .query(`
            MERGE dbo.VerifiedVideoClassifications AS target
            USING (SELECT @VideoKey AS VideoKey) AS source
            ON (target.VideoKey = source.VideoKey)
            WHEN MATCHED THEN
              UPDATE SET
                OriginalFilename = @OriginalFilename,
                CrowdLevel = @CrowdLevel,
                CrowdDensity = @CrowdDensity,
                DensityPercent = @DensityPercent,
                CrowdFlow = @CrowdFlow,
                Status = @Status,
                ZoneColor = @ZoneColor,
                Recommendation = @Recommendation,
                RecommendationSub = @RecommendationSub,
                AlertMessage = @AlertMessage
            WHEN NOT MATCHED THEN
              INSERT (VideoKey, OriginalFilename, CrowdLevel, CrowdDensity, DensityPercent, CrowdFlow, Status, ZoneColor, Recommendation, RecommendationSub, AlertMessage)
              VALUES (@VideoKey, @OriginalFilename, @CrowdLevel, @CrowdDensity, @DensityPercent, @CrowdFlow, @Status, @ZoneColor, @Recommendation, @RecommendationSub, @AlertMessage);
          `);
      }

      // Check if maha-kumbh has initial records seeded
      const checkCount = await this.pool.request()
        .input('EventId', sql.NVarChar, 'maha-kumbh')
        .query(`SELECT COUNT(*) AS total FROM dbo.GateAnalysisStates WHERE EventId = @EventId`);

      if (checkCount.recordset[0]?.total === 0) {
        const defaults = this.getInitialGateAnalysisStates('maha-kumbh');
        for (const item of defaults) {
          await this.saveGateAnalysisState(item);
        }
        console.log('✅ Seeded default Maha Kumbh gate analysis states in SQL Server');
      }

      // Check if mumbai-ganpati has initial records seeded
      const checkCountMumbai = await this.pool.request()
        .input('EventId', sql.NVarChar, 'mumbai-ganpati')
        .query(`SELECT COUNT(*) AS total FROM dbo.GateAnalysisStates WHERE EventId = @EventId`);

      if (checkCountMumbai.recordset[0]?.total === 0) {
        const defaults = this.getInitialGateAnalysisStates('mumbai-ganpati');
        for (const item of defaults) {
          await this.saveGateAnalysisState(item);
        }
        console.log('✅ Seeded default Mumbai Ganpati gate analysis states in SQL Server');
      } else {
        // Ensure gt-mumbai-5 is present
        const checkGate5 = await this.pool.request()
          .input('EventId', sql.NVarChar, 'mumbai-ganpati')
          .input('GateId', sql.NVarChar, 'gt-mumbai-5')
          .query(`SELECT COUNT(*) AS total FROM dbo.GateAnalysisStates WHERE EventId = @EventId AND GateId = @GateId`);

        if (checkGate5.recordset[0]?.total === 0) {
          const defaults = this.getInitialGateAnalysisStates('mumbai-ganpati');
          const g5 = defaults.find(d => d.gateId === 'gt-mumbai-5');
          if (g5) {
            await this.saveGateAnalysisState(g5);
            console.log('✅ Seeded Gate 5 (Chintamani Gate) into SQL Server');
          }
        }
      }
    } catch (err: any) {
      console.warn('ensureGateAnalysisTables warning:', err.message);
    }
  }

  public async getGateAnalysisStates(eventId: string = 'maha-kumbh'): Promise<GateAnalysisRecord[]> {
    if (this.isDemoMode) {
      if (!this.mockGateAnalysisStates[eventId]) {
        this.mockGateAnalysisStates[eventId] = this.getInitialGateAnalysisStates(eventId);
      }
      return this.mockGateAnalysisStates[eventId];
    }

    if (!this.pool || !this.isConnectedToSqlServer) {
      throw new Error(this.lastError || 'Database not connected');
    }

    // Auto-seed Gate 5 for Mumbai Ganpati Visarjan if not yet seeded
    if (eventId === 'mumbai-ganpati') {
      const checkG5 = await this.pool.request()
        .input('EventId', sql.NVarChar, 'mumbai-ganpati')
        .input('GateId', sql.NVarChar, 'gt-mumbai-5')
        .query(`SELECT COUNT(*) AS total FROM dbo.GateAnalysisStates WHERE EventId = @EventId AND GateId = @GateId`);
      if (checkG5.recordset[0]?.total === 0) {
        const defaults = this.getInitialGateAnalysisStates('mumbai-ganpati');
        const g5 = defaults.find(d => d.gateId === 'gt-mumbai-5');
        if (g5) {
          await this.saveGateAnalysisState(g5);
          console.log('✅ Auto-seeded gt-mumbai-5 (Chintamani Gate) into SQL Server');
        }
      }
    }

    const result = await this.pool.request()
      .input('EventId', sql.NVarChar, eventId)
      .query(`
        SELECT GateId, EventId, VideoId, VideoName, VideoUrl, VideoThumbnail, UploadedAt,
               CrowdLevel, CrowdDensity, CrowdFlow, Status, Color,
               Recommendation, RecommendationSub, AlertMessage, AnalysisType,
               AnalysisTimestamp, IsApplied
        FROM dbo.GateAnalysisStates
        WHERE EventId = @EventId
        ORDER BY GateId ASC
      `);

    if (result.recordset.length === 0) {
      const defaults = this.getInitialGateAnalysisStates(eventId);
      for (const d of defaults) {
        await this.saveGateAnalysisState(d);
      }
      return defaults;
    }

    return result.recordset.map(r => ({
      gateId: r.GateId,
      eventId: r.EventId,
      videoId: r.VideoId,
      videoName: r.VideoName,
      videoUrl: r.VideoUrl,
      videoThumbnail: r.VideoThumbnail,
      uploadedAt: r.UploadedAt ? new Date(r.UploadedAt).toISOString() : undefined,
      crowdLevel: r.CrowdLevel,
      crowdDensity: r.CrowdDensity,
      crowdFlow: r.CrowdFlow,
      status: r.Status,
      color: r.Color,
      recommendation: r.Recommendation,
      recommendationSub: r.RecommendationSub,
      alertMessage: r.AlertMessage,
      analysisType: r.AnalysisType,
      analysisTimestamp: r.AnalysisTimestamp ? new Date(r.AnalysisTimestamp).toISOString() : new Date().toISOString(),
      isApplied: Boolean(r.IsApplied)
    }));
  }

  public async getGateAnalysisState(eventId: string, gateId: string): Promise<GateAnalysisRecord | null> {
    const all = await this.getGateAnalysisStates(eventId);
    return all.find(g => g.gateId === gateId) || null;
  }

  public async saveGateAnalysisState(record: GateAnalysisRecord): Promise<GateAnalysisRecord> {
    const eventId = record.eventId || 'maha-kumbh';
    const gateId = record.gateId;
    const now = new Date().toISOString();

    if (this.isDemoMode) {
      if (!this.mockGateAnalysisStates[eventId]) {
        this.mockGateAnalysisStates[eventId] = this.getInitialGateAnalysisStates(eventId);
      }
      const existingIdx = this.mockGateAnalysisStates[eventId].findIndex(g => g.gateId === gateId);
      const updatedRecord: GateAnalysisRecord = {
        ...record,
        eventId,
        gateId,
        analysisTimestamp: record.analysisTimestamp || now,
        isApplied: true
      };
      if (existingIdx >= 0) {
        this.mockGateAnalysisStates[eventId][existingIdx] = updatedRecord;
      } else {
        this.mockGateAnalysisStates[eventId].push(updatedRecord);
      }
      return updatedRecord;
    }

    if (!this.pool || !this.isConnectedToSqlServer) {
      throw new Error(this.lastError || 'Database not connected');
    }

    const req = this.pool.request();
    req.input('GateId', sql.NVarChar, gateId);
    req.input('EventId', sql.NVarChar, eventId);
    req.input('VideoId', sql.NVarChar, record.videoId || `vid-${Date.now()}`);
    req.input('VideoName', sql.NVarChar, record.videoName || 'Attached Footage');
    req.input('VideoUrl', sql.NVarChar, record.videoUrl || '');
    req.input('VideoThumbnail', sql.NVarChar, record.videoThumbnail || '');
    req.input('UploadedAt', sql.DateTime2, record.uploadedAt ? new Date(record.uploadedAt) : new Date());
    const densityVal = record.crowdDensity != null 
      ? (typeof record.crowdDensity === 'number' ? `${record.crowdDensity}%` : String(record.crowdDensity))
      : '0%';

    req.input('CrowdLevel', sql.NVarChar, String(record.crowdLevel || 'MODERATE'));
    req.input('CrowdDensity', sql.NVarChar, densityVal);
    req.input('CrowdFlow', sql.NVarChar, String(record.crowdFlow || 'STEADY INFLOW'));
    req.input('Status', sql.NVarChar, String(record.status || 'CONTROLLED'));
    req.input('Color', sql.NVarChar, String(record.color || '#FFB020'));
    req.input('Recommendation', sql.NVarChar, String(record.recommendation || ''));
    req.input('RecommendationSub', sql.NVarChar, String(record.recommendationSub || ''));
    req.input('AlertMessage', sql.NVarChar, String(record.alertMessage || ''));
    req.input('AnalysisType', sql.NVarChar, String(record.analysisType || 'DEMO_VISION'));
    req.input('AnalysisTimestamp', sql.DateTime2, record.analysisTimestamp ? new Date(record.analysisTimestamp) : new Date());

    await req.query(`
      MERGE dbo.GateAnalysisStates AS target
      USING (SELECT @GateId AS GateId, @EventId AS EventId) AS source
      ON (target.GateId = source.GateId AND target.EventId = source.EventId)
      WHEN MATCHED THEN
        UPDATE SET
          VideoId = @VideoId,
          VideoName = @VideoName,
          VideoUrl = @VideoUrl,
          VideoThumbnail = @VideoThumbnail,
          UploadedAt = @UploadedAt,
          CrowdLevel = @CrowdLevel,
          CrowdDensity = @CrowdDensity,
          CrowdFlow = @CrowdFlow,
          Status = @Status,
          Color = @Color,
          Recommendation = @Recommendation,
          RecommendationSub = @RecommendationSub,
          AlertMessage = @AlertMessage,
          AnalysisType = @AnalysisType,
          AnalysisTimestamp = @AnalysisTimestamp,
          IsApplied = 1
      WHEN NOT MATCHED THEN
        INSERT (GateId, EventId, VideoId, VideoName, VideoUrl, VideoThumbnail, UploadedAt, CrowdLevel, CrowdDensity, CrowdFlow, Status, Color, Recommendation, RecommendationSub, AlertMessage, AnalysisType, AnalysisTimestamp, IsApplied)
        VALUES (@GateId, @EventId, @VideoId, @VideoName, @VideoUrl, @VideoThumbnail, @UploadedAt, @CrowdLevel, @CrowdDensity, @CrowdFlow, @Status, @Color, @Recommendation, @RecommendationSub, @AlertMessage, @AnalysisType, @AnalysisTimestamp, 1);

      -- Record history
      INSERT INTO dbo.GateAnalysisHistory (GateId, EventId, VideoName, VideoUrl, CrowdLevel, CrowdDensity, Status, AppliedAt)
      VALUES (@GateId, @EventId, @VideoName, @VideoUrl, @CrowdLevel, @CrowdDensity, @Status, SYSUTCDATETIME());

      -- Synchronize core Gate record status
      UPDATE dbo.Gates 
      SET Status = CASE 
        WHEN @CrowdLevel LIKE '%VERY%' OR @CrowdLevel LIKE '%CRITICAL%' THEN 'CONGESTED'
        WHEN @CrowdLevel LIKE '%HIGH%' THEN 'RESTRICTED'
        ELSE 'OPEN'
      END
      WHERE GateId = @GateId AND EventId = @EventId;
    `);

    return {
      ...record,
      eventId,
      gateId,
      analysisTimestamp: now,
      isApplied: true
    };
  }
}

export const dbService = DatabaseService.getInstance();
