# PRAVAAH — Intelligent Crowd & Event Orchestration

> **Pravaah** is a destination-intelligence platform for mega-events — featuring a personalized visitor journey and a destination-level operator command center powered by one shared intelligence layer.

Built from the ground up to match the visual language, information hierarchy, and UX flow of the reference design (`mega-event-orchestration-prototype.vercel.app`), reimplemented on:
- **Frontend**: Angular 22, TypeScript, RxJS, Vanilla CSS Design System, Leaflet Maps
- **Backend**: Node.js, Express.js, TypeScript, Socket.IO Real-Time Engine
- **Database**: Microsoft SQL Server 2022 (SSMS 22 schemas, procedures & automated mock connector)
- **Maps**: Leaflet + OpenStreetMap (True interactive maps with dark filter, live GPS, layers, safe routing)

---

## Architecture Overview

```
Angular 22 Frontend (Port 4200)
       ↕ (HTTP REST & Real-time Socket.IO)
Node.js + Express API (Port 5000)
       ↓
Microsoft SQL Server 2022 (Port 1433)
```

### Key Workflow
```
OBSERVE  ──►  PREDICT  ──►  RECOMMEND  ──►  ACT  ──►  MEASURE
(Cameras /    (Demand &     (Operational   (Approve  (Before vs After
 Sensors)      Forecast)     Intervention)  Action)   Verification)
```

---

## Core Features

1. **Brand-Aligned Experience**: Dark operational interface, rounded 2xl/xl panels, crisp tabular typography, risk tokens (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`), and subtle micro-animations.
2. **7 Mega Events Supported**:
   - Maha Kumbh Mela (Prayagraj)
   - Jantar Mantar Protest (New Delhi — Camera-free manual mode)
   - Mumbai Ganpati Visarjan (Mumbai)
   - Mega Cricket Championship (Ahmedabad Narendra Modi Stadium)
   - NH7 Weekender Festival (Bengaluru)
   - Puri Jagannath Ratha Yatra (Puri)
   - Durga Puja Carnival (Kolkata)
3. **Dedicated Event Video**: Distinct player for prerecorded aerial/ground event footage with controls (Play, Pause, Mute, Fullscreen, Progress).
4. **Live Cameras vs Analysis Video**: Separate modules for live CCTV streams and video crowd density analysis.
5. **Real Leaflet Interactive Map**: Pan, zoom, custom dark tile layer, layer toggles (Zones, Venue & Gates, Transport, Cameras, Emergency, User Reports).
6. **Live GPS Tracking**: Real `navigator.geolocation.watchPosition` with precision indicator and fallback notification.
7. **Safe Route Generation**: Calculates detour polylines bypassing congested gates and crowded zones.
8. **I'm Stuck & SOS Emergency Flow**: Instant distress dispatch with live coordinates streamed via Socket.IO directly onto the operator's command map.
9. **Jantar Mantar Mode**: Full situational awareness when camera and drone feeds are unavailable, powered by manual logs and aggregated field reports.
10. **Offline Mode**: Local caching of maps, gates, safe points, and offline sync queue with automatic push upon reconnection.
11. **Outcome Measurement**: Quantifies the before-and-after impact of every approved intervention.

---

## Quick Start

### 1. Backend (`node-api`)
```bash
cd pravaah/node-api
npm install
npm run dev
```

### 2. Frontend (`frontend`)
```bash
cd pravaah/frontend
npm install
npm start
```
Frontend runs at: `http://localhost:4200`
API runs at: `http://localhost:5000`

### 3. Database (`database`)
- Connect to SQL Server 2022 using SSMS 22 or sqlcmd.
- Run `schema.sql`, `seed.sql`, and `procedures.sql`.
*(Note: If SQL Server is offline, node-api automatically activates its built-in in-memory repository with zero disruption.)*

### 4. Default Login Credentials
- **Operator**: `operator` / `Operator@123`
- **Visitor**: `visitor` / `Visitor@123`
