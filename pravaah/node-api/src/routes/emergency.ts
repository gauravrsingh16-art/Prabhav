import { Router, Request, Response } from 'express';
import { dbService } from '../config/db';
import { getIO } from '../socket';

const router = Router();

// GET /api/emergency (Queried from SQL Server)
router.get('/', async (req: Request, res: Response) => {
  try {
    const eventId = req.query.eventId as string;
    const list = await dbService.getEmergencyReports(eventId);
    return res.json({ success: true, count: list.length, emergencies: list });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve emergencies', details: err.message });
  }
});

// POST /api/emergency/sos (Saved to SQL Server via sp_ReportEmergencySOS)
router.post('/sos', async (req: Request, res: Response) => {
  try {
    const { eventId, userId, userName, latitude, longitude, accuracy, notes } = req.body;

    const report = await dbService.createEmergencySOS({
      eventId: eventId || 'maha-kumbh',
      userId: userId || 'anonymous-user',
      userName: userName || 'Visitor in Distress',
      latitude: parseFloat(latitude) || 25.4294,
      longitude: parseFloat(longitude) || 81.8841,
      accuracy: accuracy ? parseFloat(accuracy) : 5,
      notes: notes || 'EMERGENCY SOS triggered by visitor.'
    });

    // Socket.IO broadcast to Operator Command Center
    const io = getIO();
    if (io) {
      io.emit('emergency:sos', report);
    }

    return res.status(201).json({
      success: true,
      message: 'SOS signal transmitted to Command Center and logged in SQL Server. Emergency response dispatched.',
      emergency: report
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to process SOS', details: err.message });
  }
});

// POST /api/emergency/stuck
router.post('/stuck', async (req: Request, res: Response) => {
  try {
    const { eventId, userId, userName, emergencyType, latitude, longitude, accuracy, notes } = req.body;

    const validTypes = ['FIND_SAFE_PLACE', 'MEDICAL_HELP', 'POLICE_HELP', 'SHARE_LOCATION', 'SOS'];
    const selectedType = validTypes.includes(emergencyType) ? emergencyType : 'FIND_SAFE_PLACE';

    const report = await dbService.createStuckReport({
      eventId: eventId || 'maha-kumbh',
      userId: userId || 'anonymous-user',
      userName: userName || 'Visitor',
      emergencyType: selectedType,
      latitude: parseFloat(latitude) || 25.4294,
      longitude: parseFloat(longitude) || 81.8841,
      accuracy: accuracy ? parseFloat(accuracy) : 8,
      notes: notes || `User requested assistance: ${selectedType.replace(/_/g, ' ')}`
    });

    // Socket.IO broadcast
    const io = getIO();
    if (io) {
      io.emit('emergency:stuck', report);
    }

    return res.status(201).json({
      success: true,
      message: `Assistance request '${selectedType.replace(/_/g, ' ')}' dispatched and logged in SQL Server.`,
      emergency: report
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to process stuck request', details: err.message });
  }
});

export default router;
