import { Router, Request, Response } from 'express';
import multer from 'multer';
import { dbService } from '../config/db';
import { getIO } from '../socket';

const upload = multer({ dest: 'uploads/' });
const router = Router();

// POST /api/crowd/analyze
router.post('/analyze', upload.single('video'), async (req: Request, res: Response) => {
  try {
    const { eventId, gateId, zoneId, locationName } = req.body;
    const file = req.file;

    const peopleCount = Math.floor(Math.random() * 4500) + 1200;
    const densityPercent = Math.min(98, Math.floor(Math.random() * 55) + 35);
    const flowRatePerMin = Math.floor(Math.random() * 320) + 90;
    
    const directions = ['North (towards Sangam)', 'South (towards Naini)', 'East (towards Pontoon)', 'Radial Ingress', 'Omnidirectional'];
    const movementDirection = directions[Math.floor(Math.random() * directions.length)];

    let congestionLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EMERGENCY' = 'LOW';
    if (densityPercent > 80) {
      congestionLevel = 'EMERGENCY';
    } else if (densityPercent > 65) {
      congestionLevel = 'HIGH';
    } else if (densityPercent > 45) {
      congestionLevel = 'MODERATE';
    }

    const observation = {
      observationId: `obs-${Date.now()}`,
      eventId: eventId || 'maha-kumbh',
      gateId: gateId || null,
      zoneId: zoneId || null,
      locationDescription: locationName || 'Selected Observation Point',
      uploadedFileName: file ? file.originalname : 'Default Camera Stream',
      peopleCount,
      densityPercent,
      flowRatePerMin,
      movementDirection,
      congestionLevel,
      sourceType: 'CAMERA_ANALYSIS',
      isSimulated: true,
      label: 'DEMO ANALYSIS',
      observedAt: new Date().toISOString()
    };

    // Log to SQL Server via stored procedure
    await dbService.recordCrowdObservation(observation);

    // Broadcast crowd update via Socket.IO
    const io = getIO();
    if (io) {
      io.emit('crowd:update', {
        eventId,
        observation
      });
    }

    return res.json({
      success: true,
      analysisNotice: 'DEMO ANALYSIS — Simulated Vision Pipeline',
      observation
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Crowd analysis failed', details: err.message });
  }
});

// POST /api/crowd/report (Visitor reports logged to SQL Server)
router.post('/report', async (req: Request, res: Response) => {
  try {
    const { eventId, userId, userName, category, description, latitude, longitude } = req.body;

    if (!eventId || !category || !description) {
      return res.status(400).json({ error: 'Missing required report fields' });
    }

    const newReport = await dbService.createVisitorReport({
      eventId,
      userId: userId || 'anonymous',
      userName: userName || 'Visitor',
      category,
      description,
      latitude: parseFloat(latitude) || 25.4294,
      longitude: parseFloat(longitude) || 81.8841
    });

    // Real-time broadcast to operator console
    const io = getIO();
    if (io) {
      io.emit('report:new', newReport);
      io.emit('crowd:update', { eventId, source: 'VISITOR_REPORT', report: newReport });
    }

    return res.json({
      success: true,
      message: 'Report submitted and saved to SQL Server. Operators have been notified.',
      report: newReport
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Report submission failed', details: err.message });
  }
});

// GET /api/crowd/reports (Queried from SQL Server)
router.get('/reports', async (req: Request, res: Response) => {
  try {
    const eventId = req.query.eventId as string;
    const reports = await dbService.getVisitorReports(eventId);
    return res.json({ success: true, count: reports.length, reports });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve reports', details: err.message });
  }
});

// GET /api/crowd/gates/status
router.get('/gates/status', async (req: Request, res: Response) => {
  try {
    const eventId = (req.query.eventId as string) || 'maha-kumbh';
    const states = await dbService.getGateAnalysisStates(eventId);
    return res.json({ success: true, count: states.length, states });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve gate status', details: err.message });
  }
});

// POST /api/crowd/gates/:gateId/apply-analysis
router.post('/gates/:gateId/apply-analysis', async (req: Request, res: Response) => {
  try {
    const eventId = (req.body.eventId as string) || (req.query.eventId as string) || 'maha-kumbh';
    const gateId = req.params.gateId;
    const record = {
      ...req.body,
      eventId,
      gateId
    };
    const saved = await dbService.saveGateAnalysisState(record);
    
    const io = getIO();
    if (io) {
      io.emit('gate:update', {
        gateId: saved.gateId,
        eventId: saved.eventId,
        crowdLevel: saved.crowdLevel,
        status: saved.status,
        color: saved.color,
        videoUrl: saved.videoUrl,
        videoName: saved.videoName,
        density: saved.crowdDensity,
        flow: saved.crowdFlow,
        updatedAt: saved.analysisTimestamp
      });
    }

    return res.json({
      success: true,
      message: 'Gate analysis state applied and persisted to SQL Server',
      state: saved
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to apply gate analysis', details: err.message });
  }
});

export default router;
