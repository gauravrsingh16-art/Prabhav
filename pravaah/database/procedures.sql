-- ============================================================================
-- PRAVAAH — Intelligent Crowd & Event Orchestration
-- Stored Procedures: Microsoft SQL Server 2022 / SSMS 22
-- ============================================================================

USE PravaahDB;
GO

-- 1. User Authentication Procedure
CREATE OR ALTER PROCEDURE dbo.sp_AuthenticateUser
    @Username NVARCHAR(100),
    @PasswordHash NVARCHAR(255)
    WITH ENCRYPTION
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        UserId,
        Username,
        FullName,
        Role,
        Email,
        Phone,
        CreatedAt
    FROM dbo.Users
    WHERE Username = @Username 
      AND PasswordHash = @PasswordHash
      AND IsActive = 1;
END;
GO

-- 2. Record Crowd Observation & Update Zone Pressure
CREATE OR ALTER PROCEDURE dbo.sp_RecordCrowdObservation
    @ObservationId NVARCHAR(50),
    @EventId NVARCHAR(50),
    @ZoneId NVARCHAR(50),
    @CameraId NVARCHAR(50),
    @LocationDescription NVARCHAR(200),
    @PeopleCount INT,
    @DensityPercent INT,
    @FlowRatePerMin INT,
    @MovementDirection NVARCHAR(50),
    @CongestionLevel NVARCHAR(20),
    @SourceType NVARCHAR(30),
    @IsSimulated BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    INSERT INTO dbo.CrowdObservations (
        ObservationId, EventId, ZoneId, CameraId, LocationDescription,
        PeopleCount, DensityPercent, FlowRatePerMin, MovementDirection,
        CongestionLevel, SourceType, IsSimulated, ObservedAt
    )
    VALUES (
        @ObservationId, @EventId, @ZoneId, @CameraId, @LocationDescription,
        @PeopleCount, @DensityPercent, @FlowRatePerMin, @MovementDirection,
        @CongestionLevel, @SourceType, @IsSimulated, SYSUTCDATETIME()
    );
    
    -- Update corresponding Zone status & pressure if ZoneId is provided
    IF @ZoneId IS NOT NULL
    BEGIN
        UPDATE dbo.Zones
        SET CurrentOccupancy = @PeopleCount,
            PressurePercent = @DensityPercent,
            Status = @CongestionLevel
        WHERE ZoneId = @ZoneId;
    END;
    
    COMMIT TRANSACTION;
END;
GO

-- 3. Register Emergency SOS
CREATE OR ALTER PROCEDURE dbo.sp_ReportEmergencySOS
    @EmergencyId NVARCHAR(50),
    @EventId NVARCHAR(50),
    @UserId NVARCHAR(50),
    @EmergencyType NVARCHAR(50),
    @Latitude FLOAT,
    @Longitude FLOAT,
    @Accuracy FLOAT,
    @Notes NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO dbo.EmergencyReports (
        EmergencyId, EventId, UserId, EmergencyType,
        Latitude, Longitude, Accuracy, Notes, Status, CreatedAt
    )
    VALUES (
        @EmergencyId, @EventId, @UserId, @EmergencyType,
        @Latitude, @Longitude, @Accuracy, @Notes, 'ACTIVE', SYSUTCDATETIME()
    );
    
    -- Also log to UserLocations
    INSERT INTO dbo.UserLocations (UserId, EventId, Latitude, Longitude, AccuracyMeters, RecordedAt)
    VALUES (@UserId, @EventId, @Latitude, @Longitude, @Accuracy, SYSUTCDATETIME());
END;
GO

-- 4. Approve Operator Intervention (Observe -> Predict -> Recommend -> Act -> Measure)
CREATE OR ALTER PROCEDURE dbo.sp_ApproveIntervention
    @InterventionId NVARCHAR(50),
    @ApprovedByUserId NVARCHAR(50),
    @MeasuredOutcome NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE dbo.Interventions
    SET Status = 'APPROVED',
        ApprovedByUserId = @ApprovedByUserId,
        ApprovedAt = SYSUTCDATETIME(),
        MeasuredOutcome = COALESCE(@MeasuredOutcome, 'Action approved and dispatched to field teams.')
    WHERE InterventionId = @InterventionId;
END;
GO

-- 5. Process Offline Sync Batch
CREATE OR ALTER PROCEDURE dbo.sp_ProcessOfflineSync
    @SyncId NVARCHAR(50),
    @UserId NVARCHAR(50),
    @PayloadType NVARCHAR(50),
    @PayloadJSON NVARCHAR(MAX),
    @ClientTimestamp DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO dbo.OfflineSyncQueue (
        SyncId, UserId, PayloadType, PayloadJSON, ClientTimestamp, ServerReceivedAt, SyncStatus
    )
    VALUES (
        @SyncId, @UserId, @PayloadType, @PayloadJSON, @ClientTimestamp, SYSUTCDATETIME(), 'PROCESSED'
    );
END;
GO
