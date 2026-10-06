import { Router, Request, Response } from 'express';
import { dbService } from '../config/db';
import { getIO } from '../socket';

const router = Router();

// GET /api/alerts
router.get('/', async (req: Request, res: Response) => {
  try {
    const eventId = req.query.eventId as string;
    const list = await dbService.getAlerts(eventId);
    return res.json({ success: true, count: list.length, alerts: list });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve alerts', details: err.message });
  }
});

// POST /api/alerts (Operator creates live alert)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { eventId, title, message, recommendation, targetGateId, targetZoneId, severity } = req.body;

    if (!eventId || !title || !message) {
      return res.status(400).json({ error: 'eventId, title and message are required' });
    }

    const newAlert = await dbService.createAlert({
      eventId,
      title,
      message,
      recommendation: recommendation || 'USE GATE 3',
      targetGateId: targetGateId || null,
      targetZoneId: targetZoneId || null,
      severity: severity || 'HIGH'
    });

    // Broadcast via Socket.IO
    const io = getIO();
    if (io) {
      io.emit('alert:new', newAlert);
    }

    return res.status(201).json({
      success: true,
      message: 'Alert published and broadcasted to all visitors and field operators',
      alert: newAlert
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create alert', details: err.message });
  }
});

// PUT /api/alerts/:id/resolve
router.put('/:id/resolve', async (req: Request, res: Response) => {
  try {
    const success = await dbService.resolveAlert(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Alert not found or already resolved' });
    }

    const io = getIO();
    if (io) {
      io.emit('alert:resolved', { alertId: req.params.id, status: 'RESOLVED' });
    }

    return res.json({ success: true, message: 'Alert resolved', alertId: req.params.id });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to resolve alert', details: err.message });
  }
});

export default router;
