import { Router, Request, Response } from 'express';
import { dbService } from '../config/db';
import { getIO } from '../socket';

const router = Router();

// POST /api/user/location
router.post('/location', async (req: Request, res: Response) => {
  try {
    const { userId, eventId, latitude, longitude, accuracy, speed, heading } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and Longitude are required' });
    }

    const payload = {
      userId: userId || 'anonymous',
      eventId: eventId || 'maha-kumbh',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: accuracy ? parseFloat(accuracy) : null,
      speed: speed ? parseFloat(speed) : null,
      heading: heading ? parseFloat(heading) : null,
      timestamp: new Date().toISOString()
    };

    // Log location to SQL Server UserLocations table
    await dbService.recordUserLocation(payload.userId, payload.eventId, payload.latitude, payload.longitude, payload.accuracy || undefined);

    // Broadcast user location to operator map
    const io = getIO();
    if (io) {
      io.emit('user:location', payload);
    }

    return res.json({ success: true, payload });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to record location', details: err.message });
  }
});

export default router;
