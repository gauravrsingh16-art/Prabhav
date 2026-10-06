-- ============================================================================
-- PRAVAAH — Intelligent Crowd & Event Orchestration
-- Seed Data: Microsoft SQL Server 2022 / SSMS 22
-- ============================================================================

USE PravaahDB;
GO

-- 1. Users
INSERT INTO dbo.Users (UserId, Username, PasswordHash, FullName, Role, Email, Phone)
VALUES 
('usr-op-01', 'operator', 'pbkdf2$operator_hash_pravaah_2026', 'Command Center Officer', 'OPERATOR', 'ops@pravaah.gov.in', '+91 98765 43210'),
('usr-vis-01', 'visitor', 'pbkdf2$visitor_hash_pravaah_2026', 'Arjun Sharma', 'VISITOR', 'arjun@pravaah.app', '+91 91234 56789'),
('usr-vis-02', 'priya', 'pbkdf2$visitor_hash_pravaah_2026', 'Priya Patel', 'VISITOR', 'priya@pravaah.app', '+91 98111 22334');
GO

-- 2. Events (All 7 required mega events)
INSERT INTO dbo.Events (EventId, Name, Category, City, State, DateRange, ExpectedVisitors, Status, HasCameraCoverage, Description)
VALUES
('maha-kumbh', 'Maha Kumbh Mela', 'Religious Gathering', 'Prayagraj', 'Uttar Pradesh', '13 Jan – 26 Feb', 40000000, 'normal', 1, 'The world largest peaceful congregation at the sacred Triveni Sangam.'),
('jantar-mantar', 'Jantar Mantar Protest', 'Civil Gathering', 'New Delhi', 'Delhi', 'Today · 10:00 AM – 06:00 PM', 45000, 'normal', 0, 'Public demonstration zone with restricted camera/drone access. Operates in manual & aggregated intelligence mode.'),
('mumbai-ganpati', 'Mumbai Ganpati Visarjan', 'Large Public Celebration', 'Mumbai', 'Maharashtra', '17 Sep – 19 Sep', 15000000, 'normal', 1, 'Immersion procession of idols moving towards Girgaon Chowpatty and Juhu Beach.'),
('stadium-event', 'Mega Cricket Championship', 'Stadium Event', 'Ahmedabad', 'Gujarat', '22 Oct · 02:00 PM – 11:00 PM', 132000, 'normal', 1, 'High-density international sports fixture with multi-gate radial ingress and transit shuttles.'),
('concert-festival', 'NH7 Weekender Festival', 'Concert / Music Festival', 'Bengaluru', 'Karnataka', '05 Nov – 07 Nov', 60000, 'normal', 1, 'Multi-stage open-air music festival with dynamic acoustic zones and surge egress points.'),
('religious-festival', 'Puri Jagannath Ratha Yatra', 'Religious Festival', 'Puri', 'Odisha', '07 Jul – 16 Jul', 2500000, 'normal', 1, 'Historic chariot festival along the Grand Road (Bada Danda) leading to Gundicha Temple.'),
('public-celebration', 'Durga Puja Carnival', 'Large Public Celebration', 'Kolkata', 'West Bengal', '08 Oct – 13 Oct', 8000000, 'normal', 1, 'City-wide cultural celebrations with high pedestrian footfall across central pandal corridors.');
GO

-- 3. EventLocations
INSERT INTO dbo.EventLocations (LocationId, EventId, Name, Latitude, Longitude, DefaultZoom, VenueRadiusMeters, Address)
VALUES
('loc-kumbh', 'maha-kumbh', 'Triveni Sangam Ghats', 25.4294, 81.8841, 14, 4500, 'Triveni Sangam, Daraganj, Prayagraj, UP 211006'),
('loc-jantar', 'jantar-mantar', 'Jantar Mantar Demonstration Area', 28.6271, 77.2166, 16, 1200, 'Sansad Marg, Connaught Place, New Delhi, Delhi 110001'),
('loc-mumbai', 'mumbai-ganpati', 'Girgaon Chowpatty Coastal Sector', 18.9548, 72.8156, 15, 3000, 'Marine Drive / Girgaon Chowpatty, Mumbai, MH 400007'),
('loc-stadium', 'stadium-event', 'Narendra Modi Stadium Complex', 23.0915, 72.5975, 15, 2000, 'Motera, Stadium Rd, Ahmedabad, GJ 380005'),
('loc-concert', 'concert-festival', 'Nice Grounds Arena', 13.0489, 77.4735, 15, 1800, 'Tumkur Road, Madavara, Bengaluru, KA 562123'),
('loc-puri', 'religious-festival', 'Bada Danda (Grand Road)', 19.8048, 85.8179, 15, 3200, 'Grand Road, Jagannath Temple to Gundicha, Puri, OD 752001'),
('loc-kolkata', 'public-celebration', 'Red Road & Central Pandal Belt', 22.5552, 88.3476, 14, 3800, 'Red Road, Maidan, Kolkata, WB 700021');
GO

-- 4. EventVideos (Step 7: Recorded Event Video for every event)
INSERT INTO dbo.EventVideos (VideoId, EventId, Title, VideoUrl, ThumbnailUrl, IsRecorded, Description, DurationSeconds)
VALUES
('vid-kumbh', 'maha-kumbh', 'Maha Kumbh Holy Snan & Riverfront Movement', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'assets/thumbnails/kumbh.jpg', 1, 'Prerecorded operational overview of Sangam ghat approaches during morning peak bath.', 240),
('vid-jantar', 'jantar-mantar', 'Sansad Marg Movement Pattern & Ingress Flow', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'assets/thumbnails/jantar.jpg', 1, 'Prerecorded perimeter security movement and barricaded corridor video.', 180),
('vid-mumbai', 'mumbai-ganpati', 'Marine Drive to Chowpatty Immersion Route', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'assets/thumbnails/mumbai.jpg', 1, 'Prerecorded evening procession trajectory along the coastal belt.', 300),
('vid-stadium', 'stadium-event', 'Motera Radial Ingress & Metro Concourses', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'assets/thumbnails/stadium.jpg', 1, 'Prerecorded spectator entry queue dispersal video.', 210),
('vid-concert', 'concert-festival', 'Stage Arena Perimeter & Acoustic Corridors', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'assets/thumbnails/concert.jpg', 1, 'Prerecorded festival grounds crowd movement and lighting test.', 195),
('vid-puri', 'religious-festival', 'Bada Danda Chariot Pulling Stream', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4', 'assets/thumbnails/puri.jpg', 1, 'Prerecorded grand chariot procession along the main thoroughfare.', 320),
('vid-kolkata', 'public-celebration', 'Durga Puja Carnival Float Pathway', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', 'assets/thumbnails/kolkata.jpg', 1, 'Prerecorded ceremonial carnival staging and spectator stands.', 260);
GO

-- 5. Zones (Maha Kumbh example and others)
INSERT INTO dbo.Zones (ZoneId, EventId, Name, PolygonGeoJSON, CenterLat, CenterLng, Capacity, CurrentOccupancy, PressurePercent, Status, AccommodationPressure)
VALUES
('zn-kumbh-central', 'maha-kumbh', 'Central Zone (Sangam Main Ghat)', '[[25.434,81.878],[25.436,81.890],[25.425,81.892],[25.423,81.880]]', 25.4294, 81.8841, 150000, 93000, 62, 'MODERATE', 72),
('zn-kumbh-north', 'maha-kumbh', 'North Zone (Shankar Viman Mandir)', '[[25.438,81.875],[25.445,81.885],[25.436,81.890],[25.432,81.878]]', 25.4370, 81.8820, 90000, 37800, 42, 'LOW', 48),
('zn-kumbh-east', 'maha-kumbh', 'East Zone (Arail Ghat & Tents)', '[[25.425,81.892],[25.428,81.905],[25.418,81.904],[25.415,81.891]]', 25.4215, 81.8980, 80000, 24800, 31, 'LOW', 34),
('zn-kumbh-south', 'maha-kumbh', 'South Zone (Naini Bridge Access)', '[[25.420,81.875],[25.423,81.884],[25.414,81.886],[25.411,81.877]]', 25.4170, 81.8805, 75000, 28500, 38, 'LOW', 40),

-- Jantar Mantar Zones (No camera mode)
('zn-jm-core', 'jantar-mantar', 'Central Demonstration Plaza', '[[28.6275,77.2155],[28.6280,77.2175],[28.6265,77.2178],[28.6260,77.2158]]', 28.6271, 77.2166, 20000, 11000, 55, 'MODERATE', 0),
('zn-jm-north', 'jantar-mantar', 'Tolstoy Marg Ingress', '[[28.6285,77.2150],[28.6295,77.2180],[28.6280,77.2175],[28.6275,77.2155]]', 28.6285, 77.2165, 15000, 4200, 28, 'LOW', 0),

-- Mumbai Ganpati
('zn-mb-chowpatty', 'mumbai-ganpati', 'Girgaon Chowpatty Beachfront', '[[18.956,72.813],[18.958,72.818],[18.951,72.819],[18.949,72.814]]', 18.9548, 72.8156, 80000, 52000, 65, 'MODERATE', 85);
GO

-- 6. Gates
INSERT INTO dbo.Gates (GateId, EventId, ZoneId, Name, Latitude, Longitude, QueueTimeMinutes, FlowRatePerMin, Status, IsEmergencyExit)
VALUES
('gt-kumbh-1', 'maha-kumbh', 'zn-kumbh-central', 'Gate 1 (Fort Rampart)', 25.4312, 81.8798, 8, 220, 'OPEN', 0),
('gt-kumbh-2', 'maha-kumbh', 'zn-kumbh-central', 'Gate 2 (Sangam Direct)', 25.4285, 81.8820, 22, 380, 'CONGESTED', 0),
('gt-kumbh-3', 'maha-kumbh', 'zn-kumbh-north', 'Gate 3 (North Causeway)', 25.4358, 81.8845, 4, 150, 'OPEN', 1),
('gt-kumbh-4', 'maha-kumbh', 'zn-kumbh-east', 'Gate 4 (Pontoon Bridge East)', 25.4241, 81.8912, 6, 180, 'OPEN', 0),

-- Jantar Mantar Gates
('gt-jm-1', 'jantar-mantar', 'zn-jm-core', 'Sansad Marg Entry Gate', 28.6262, 77.2160, 5, 80, 'OPEN', 0),
('gt-jm-2', 'jantar-mantar', 'zn-jm-north', 'Tolstoy Road Barricade Point', 28.6282, 77.2170, 7, 60, 'OPEN', 1);
GO

-- 7. Cameras
INSERT INTO dbo.Cameras (CameraId, EventId, ZoneId, Name, StreamUrl, Latitude, Longitude, Status, LastFlowPerMin, LastDensityPercent, LastPeopleCount)
VALUES
('cam-07', 'maha-kumbh', 'zn-kumbh-central', 'CAM-07 · Main Corridor', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 25.4305, 81.8815, 'ONLINE', 258, 47, 4910),
('cam-03', 'maha-kumbh', 'zn-kumbh-north', 'CAM-03 · North Transit Hub', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 25.4362, 81.8830, 'ONLINE', 118, 29, 1640),
('cam-12', 'maha-kumbh', 'zn-kumbh-east', 'CAM-12 · East Approach', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 25.4230, 81.8935, 'ONLINE', 96, 55, 1180),
('cam-09', 'maha-kumbh', 'zn-kumbh-south', 'CAM-09 · Naini Bridge Ingress', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 25.4180, 81.8820, 'ONLINE', 145, 38, 2100);
GO

-- 8. TransportPoints
INSERT INTO dbo.TransportPoints (TransportId, EventId, Name, Type, Latitude, Longitude, CapacityPerHour, UtilizationPercent, Status)
VALUES
('tr-kumbh-s1', 'maha-kumbh', 'Shuttle S1 — Central Line', 'Shuttle', 25.4330, 81.8760, 3000, 70, 'BUSY'),
('tr-kumbh-s3', 'maha-kumbh', 'Shuttle S3 — North Line', 'Shuttle', 25.4390, 81.8790, 2400, 52, 'NORMAL'),
('tr-kumbh-bus', 'maha-kumbh', 'East Express Bus Terminal', 'Bus', 25.4210, 81.9020, 1800, 45, 'NORMAL'),
('tr-kumbh-south', 'maha-kumbh', 'South Connector Shuttle Hub', 'Shuttle', 25.4150, 81.8780, 2000, 48, 'NORMAL');
GO

-- 9. EmergencyPoints
INSERT INTO dbo.EmergencyPoints (PointId, EventId, Name, Type, Latitude, Longitude, ContactNumber, IsActive)
VALUES
('em-kumbh-med1', 'maha-kumbh', 'Sangam Sector Hospital & Trauma Unit', 'MEDICAL', 25.4310, 81.8850, '108 / +91 532 2451000', 1),
('em-kumbh-med2', 'maha-kumbh', 'North Corridor First Aid Post', 'MEDICAL', 25.4380, 81.8830, '108', 1),
('em-kumbh-pol1', 'maha-kumbh', 'Central Mela Police Control Post', 'POLICE', 25.4290, 81.8810, '112 / +91 532 2451100', 1),
('em-kumbh-safe1', 'maha-kumbh', 'Fort Safe Haven & Evacuation Field', 'SAFE_HAVEN', 25.4335, 81.8770, '+91 532 2451200', 1),

-- Jantar Mantar Emergency
('em-jm-med', 'jantar-mantar', 'Sansad Marg Mobile Medical Van', 'MEDICAL', 28.6265, 77.2162, '102', 1),
('em-jm-pol', 'jantar-mantar', 'Parliament Street Police Station', 'POLICE', 28.6255, 77.2170, '112', 1);
GO

-- 10. Initial Alerts
INSERT INTO dbo.Alerts (AlertId, EventId, Title, Message, Recommendation, TargetGateId, TargetZoneId, Severity, Status)
VALUES
('alt-01', 'maha-kumbh', 'Elevated Queue at Gate 2', 'Gate 2 queue length has exceeded 20 minutes with high incoming rate.', 'USE GATE 3 via North Causeway — current wait time under 4 minutes.', 'gt-kumbh-2', 'zn-kumbh-central', 'MODERATE', 'ACTIVE');
GO

-- 11. Initial Interventions
INSERT INTO dbo.Interventions (InterventionId, EventId, Title, ActionType, TargetEntity, Description, BeforeState, AfterState, Status)
VALUES
('int-01', 'maha-kumbh', 'Redirect arrivals to Gate 3', 'REDIRECT', 'Gate 2', 'Divert incoming visitors approaching Central Zone toward Gate 3 to balance queue density.', 'Gate 2: HIGH (22 min wait)', 'Gate 2: MODERATE (9 min wait)', 'PENDING'),
('int-02', 'maha-kumbh', 'Promote Gate B / Gate 3 in Visitor App', 'ADVISORY', 'Visitor App Navigation', 'Push in-app route advice recommending Gate 3 over congested Gate 2.', 'NORMAL', 'APPLIED', 'COMPLETED');
GO
