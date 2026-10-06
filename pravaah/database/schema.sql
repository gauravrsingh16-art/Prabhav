-- ============================================================================
-- PRAVAAH — Intelligent Crowd & Event Orchestration
-- Database Schema: Microsoft SQL Server 2022 / SSMS 22
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'PravaahDB')
BEGIN
    CREATE DATABASE PravaahDB;
END
GO

USE PravaahDB;
GO

-- Drop tables in reverse foreign key order if needed
IF OBJECT_ID('dbo.OfflineSyncQueue', 'U') IS NOT NULL DROP TABLE dbo.OfflineSyncQueue;
IF OBJECT_ID('dbo.EmergencyReports', 'U') IS NOT NULL DROP TABLE dbo.EmergencyReports;
IF OBJECT_ID('dbo.VisitorReports', 'U') IS NOT NULL DROP TABLE dbo.VisitorReports;
IF OBJECT_ID('dbo.UserLocations', 'U') IS NOT NULL DROP TABLE dbo.UserLocations;
IF OBJECT_ID('dbo.Interventions', 'U') IS NOT NULL DROP TABLE dbo.Interventions;
IF OBJECT_ID('dbo.Alerts', 'U') IS NOT NULL DROP TABLE dbo.Alerts;
IF OBJECT_ID('dbo.CrowdPredictions', 'U') IS NOT NULL DROP TABLE dbo.CrowdPredictions;
IF OBJECT_ID('dbo.CrowdObservations', 'U') IS NOT NULL DROP TABLE dbo.CrowdObservations;
IF OBJECT_ID('dbo.EmergencyPoints', 'U') IS NOT NULL DROP TABLE dbo.EmergencyPoints;
IF OBJECT_ID('dbo.TransportPoints', 'U') IS NOT NULL DROP TABLE dbo.TransportPoints;
IF OBJECT_ID('dbo.Cameras', 'U') IS NOT NULL DROP TABLE dbo.Cameras;
IF OBJECT_ID('dbo.Gates', 'U') IS NOT NULL DROP TABLE dbo.Gates;
IF OBJECT_ID('dbo.Zones', 'U') IS NOT NULL DROP TABLE dbo.Zones;
IF OBJECT_ID('dbo.EventVideos', 'U') IS NOT NULL DROP TABLE dbo.EventVideos;
IF OBJECT_ID('dbo.EventLocations', 'U') IS NOT NULL DROP TABLE dbo.EventLocations;
IF OBJECT_ID('dbo.Events', 'U') IS NOT NULL DROP TABLE dbo.Events;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
GO

-- 1. Users table (Visitor and Operator roles)
CREATE TABLE dbo.Users (
    UserId NVARCHAR(50) PRIMARY KEY,
    Username NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(150) NOT NULL,
    Role NVARCHAR(20) NOT NULL CHECK (Role IN ('VISITOR', 'OPERATOR')),
    Email NVARCHAR(150) NULL,
    Phone NVARCHAR(25) NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);
GO

-- 2. Events table
CREATE TABLE dbo.Events (
    EventId NVARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(150) NOT NULL,
    Category NVARCHAR(80) NOT NULL,
    City NVARCHAR(100) NOT NULL,
    State NVARCHAR(100) NOT NULL,
    DateRange NVARCHAR(100) NOT NULL,
    ExpectedVisitors BIGINT DEFAULT 100000,
    Status NVARCHAR(30) DEFAULT 'normal' CHECK (Status IN ('normal', 'elevated', 'critical', 'evacuating')),
    HasCameraCoverage BIT DEFAULT 1,
    Description NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);
GO

-- 3. EventLocations table
CREATE TABLE dbo.EventLocations (
    LocationId NVARCHAR(50) PRIMARY KEY,
    EventId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Events(EventId) ON DELETE CASCADE,
    Name NVARCHAR(150) NOT NULL,
    Latitude FLOAT NOT NULL,
    Longitude FLOAT NOT NULL,
    DefaultZoom INT DEFAULT 15,
    VenueRadiusMeters INT DEFAULT 2500,
    Address NVARCHAR(255) NULL
);
GO

-- 4. EventVideos table
CREATE TABLE dbo.EventVideos (
    VideoId NVARCHAR(50) PRIMARY KEY,
    EventId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Events(EventId) ON DELETE CASCADE,
    Title NVARCHAR(150) NOT NULL,
    VideoUrl NVARCHAR(500) NOT NULL,
    ThumbnailUrl NVARCHAR(500) NULL,
    IsRecorded BIT DEFAULT 1,
    Description NVARCHAR(300) NULL,
    DurationSeconds INT DEFAULT 180,
    RecordedDate DATETIME2 NULL
);
GO

-- 5. Zones table
CREATE TABLE dbo.Zones (
    ZoneId NVARCHAR(50) PRIMARY KEY,
    EventId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Events(EventId) ON DELETE CASCADE,
    Name NVARCHAR(100) NOT NULL,
    PolygonGeoJSON NVARCHAR(MAX) NOT NULL,
    CenterLat FLOAT NOT NULL,
    CenterLng FLOAT NOT NULL,
    Capacity INT DEFAULT 10000,
    CurrentOccupancy INT DEFAULT 0,
    PressurePercent INT DEFAULT 0,
    Status NVARCHAR(20) DEFAULT 'LOW' CHECK (Status IN ('LOW', 'MODERATE', 'HIGH', 'EMERGENCY')),
    AccommodationPressure INT DEFAULT 0
);
GO

-- 6. Gates table
CREATE TABLE dbo.Gates (
    GateId NVARCHAR(50) PRIMARY KEY,
    EventId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Events(EventId) ON DELETE CASCADE,
    ZoneId NVARCHAR(50) NULL FOREIGN KEY REFERENCES dbo.Zones(ZoneId),
    Name NVARCHAR(100) NOT NULL,
    Latitude FLOAT NOT NULL,
    Longitude FLOAT NOT NULL,
    QueueTimeMinutes INT DEFAULT 5,
    FlowRatePerMin INT DEFAULT 100,
    Status NVARCHAR(20) DEFAULT 'OPEN' CHECK (Status IN ('OPEN', 'RESTRICTED', 'CONGESTED', 'CLOSED')),
    IsEmergencyExit BIT DEFAULT 0
);
GO

-- 7. Cameras table
CREATE TABLE dbo.Cameras (
    CameraId NVARCHAR(50) PRIMARY KEY,
    EventId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Events(EventId) ON DELETE CASCADE,
    ZoneId NVARCHAR(50) NULL FOREIGN KEY REFERENCES dbo.Zones(ZoneId),
    Name NVARCHAR(100) NOT NULL,
    StreamUrl NVARCHAR(500) NOT NULL,
    Latitude FLOAT NOT NULL,
    Longitude FLOAT NOT NULL,
    Status NVARCHAR(20) DEFAULT 'ONLINE' CHECK (Status IN ('ONLINE', 'OFFLINE', 'ALERT')),
    LastFlowPerMin INT DEFAULT 0,
    LastDensityPercent INT DEFAULT 0,
    LastPeopleCount INT DEFAULT 0
);
GO

-- 8. TransportPoints table
CREATE TABLE dbo.TransportPoints (
    TransportId NVARCHAR(50) PRIMARY KEY,
    EventId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Events(EventId) ON DELETE CASCADE,
    Name NVARCHAR(120) NOT NULL,
    Type NVARCHAR(40) NOT NULL, -- Shuttle, Bus, Metro, Parking, Station
    Latitude FLOAT NOT NULL,
    Longitude FLOAT NOT NULL,
    CapacityPerHour INT DEFAULT 1000,
    UtilizationPercent INT DEFAULT 50,
    Status NVARCHAR(20) DEFAULT 'NORMAL' CHECK (Status IN ('NORMAL', 'BUSY', 'OVERLOADED', 'SUSPENDED'))
);
GO

-- 9. EmergencyPoints table
CREATE TABLE dbo.EmergencyPoints (
    PointId NVARCHAR(50) PRIMARY KEY,
    EventId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Events(EventId) ON DELETE CASCADE,
    Name NVARCHAR(120) NOT NULL,
    Type NVARCHAR(40) NOT NULL CHECK (Type IN ('MEDICAL', 'POLICE', 'SAFE_HAVEN', 'FIRE', 'INFORMATION')),
    Latitude FLOAT NOT NULL,
    Longitude FLOAT NOT NULL,
    ContactNumber NVARCHAR(50) NULL,
    IsActive BIT DEFAULT 1
);
GO

-- 10. CrowdObservations table
CREATE TABLE dbo.CrowdObservations (
    ObservationId NVARCHAR(50) PRIMARY KEY,
    EventId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Events(EventId),
    ZoneId NVARCHAR(50) NULL,
    CameraId NVARCHAR(50) NULL,
    LocationDescription NVARCHAR(200) NULL,
    PeopleCount INT NOT NULL,
    DensityPercent INT NOT NULL,
    FlowRatePerMin INT NOT NULL,
    MovementDirection NVARCHAR(50) NOT NULL, -- North, South, East, West, Omnidirectional
    CongestionLevel NVARCHAR(20) NOT NULL CHECK (CongestionLevel IN ('LOW', 'MODERATE', 'HIGH', 'EMERGENCY')),
    SourceType NVARCHAR(30) DEFAULT 'CAMERA_ANALYSIS' CHECK (SourceType IN ('CAMERA_ANALYSIS', 'OPERATOR_REPORT', 'VISITOR_REPORTS', 'MANUAL_OVERRIDE')),
    IsSimulated BIT DEFAULT 1,
    ObservedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);
GO

-- 11. CrowdPredictions table
CREATE TABLE dbo.CrowdPredictions (
    PredictionId NVARCHAR(50) PRIMARY KEY,
    EventId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Events(EventId),
    ZoneId NVARCHAR(50) NOT NULL,
    CurrentPressure INT NOT NULL,
    ProjectedPressureIn10Min INT NOT NULL,
    ProjectedPressureIn20Min INT NOT NULL,
    RiskLevel NVARCHAR(20) NOT NULL CHECK (RiskLevel IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    ConfidenceScore FLOAT DEFAULT 0.88,
    IsSimulated BIT DEFAULT 1,
    GeneratedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);
GO

-- 12. Alerts table
CREATE TABLE dbo.Alerts (
    AlertId NVARCHAR(50) PRIMARY KEY,
    EventId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Events(EventId),
    Title NVARCHAR(200) NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    Recommendation NVARCHAR(MAX) NULL,
    TargetGateId NVARCHAR(50) NULL,
    TargetZoneId NVARCHAR(50) NULL,
    Severity NVARCHAR(20) DEFAULT 'INFO' CHECK (Severity IN ('INFO', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    Status NVARCHAR(20) DEFAULT 'ACTIVE' CHECK (Status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED')),
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    ResolvedAt DATETIME2 NULL
);
GO

-- 13. Interventions table (Observe -> Predict -> Recommend -> Act -> Measure)
CREATE TABLE dbo.Interventions (
    InterventionId NVARCHAR(50) PRIMARY KEY,
    EventId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Events(EventId),
    Title NVARCHAR(150) NOT NULL,
    ActionType NVARCHAR(50) NOT NULL, -- REDIRECT, OPEN_GATE, CLOSE_GATE, DISPATCH_ASSISTANCE, ADVISORY
    TargetEntity NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    BeforeState NVARCHAR(50) NOT NULL,
    AfterState NVARCHAR(50) NULL,
    Status NVARCHAR(30) DEFAULT 'PENDING' CHECK (Status IN ('PENDING', 'APPROVED', 'EXECUTING', 'COMPLETED', 'DISMISSED')),
    ApprovedByUserId NVARCHAR(50) NULL FOREIGN KEY REFERENCES dbo.Users(UserId),
    ApprovedAt DATETIME2 NULL,
    MeasuredOutcome NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);
GO

-- 14. UserLocations table (Consented GPS)
CREATE TABLE dbo.UserLocations (
    LocationRecordId BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),
    EventId NVARCHAR(50) NULL,
    Latitude FLOAT NOT NULL,
    Longitude FLOAT NOT NULL,
    AccuracyMeters FLOAT NULL,
    Speed FLOAT NULL,
    Heading FLOAT NULL,
    RecordedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);
GO

-- 15. VisitorReports table
CREATE TABLE dbo.VisitorReports (
    ReportId NVARCHAR(50) PRIMARY KEY,
    EventId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Events(EventId),
    UserId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),
    Category NVARCHAR(50) NOT NULL CHECK (Category IN ('Heavy Crowd', 'Blocked Route', 'Medical Emergency', 'Unsafe Area', 'Lost Person', 'Other')),
    Description NVARCHAR(MAX) NOT NULL,
    Latitude FLOAT NOT NULL,
    Longitude FLOAT NOT NULL,
    Status NVARCHAR(20) DEFAULT 'NEW' CHECK (Status IN ('NEW', 'INVESTIGATING', 'RESOLVED')),
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);
GO

-- 16. EmergencyReports (SOS & I'M STUCK)
CREATE TABLE dbo.EmergencyReports (
    EmergencyId NVARCHAR(50) PRIMARY KEY,
    EventId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Events(EventId),
    UserId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),
    EmergencyType NVARCHAR(50) NOT NULL CHECK (EmergencyType IN ('SOS', 'FIND_SAFE_PLACE', 'MEDICAL_HELP', 'POLICE_HELP', 'SHARE_LOCATION')),
    Latitude FLOAT NOT NULL,
    Longitude FLOAT NOT NULL,
    Accuracy FLOAT NULL,
    Notes NVARCHAR(MAX) NULL,
    Status NVARCHAR(20) DEFAULT 'ACTIVE' CHECK (Status IN ('ACTIVE', 'DISPATCHED', 'RESOLVED')),
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    ResolvedAt DATETIME2 NULL
);
GO

-- 17. OfflineSyncQueue table
CREATE TABLE dbo.OfflineSyncQueue (
    SyncId NVARCHAR(50) PRIMARY KEY,
    UserId NVARCHAR(50) NOT NULL,
    PayloadType NVARCHAR(50) NOT NULL, -- VISITOR_REPORT, SOS, LOCATION_UPDATE, INTERVENTION
    PayloadJSON NVARCHAR(MAX) NOT NULL,
    ClientTimestamp DATETIME2 NOT NULL,
    ServerReceivedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    SyncStatus NVARCHAR(20) DEFAULT 'PROCESSED' CHECK (SyncStatus IN ('PENDING', 'PROCESSED', 'FAILED'))
);
GO

-- 18. GateAnalysisStates table (Persistent gate video & crowd analysis states)
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
GO

-- 19. GateAnalysisHistory table (Audit trail of applied analyses)
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
GO
