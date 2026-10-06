import { Router, Request, Response } from 'express';
import { dbService } from '../config/db';
import { getIO } from '../socket';

const router = Router();

// POST /api/offline/sync
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { userId, queue } = req.body;

    if (!Array.isArray(queue)) {
      return res.status(400).json({ error: 'Queue must be an array of queued actions' });
    }

    const processedResults: any[] = [];

    for (const item of queue) {
      const syncId = `sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const clientTimestamp = item.timestamp || new Date().toISOString();

      // Log sync batch record into SQL Server OfflineSyncQueue
      await dbService.processOfflineSync(
        syncId,
        userId || 'anonymous',
        item.type,
        JSON.stringify(item.payload || {}),
        clientTimestamp
      );

      // Process specific payloads into their respective SQL Server tables
      if (item.type === 'VISITOR_REPORT' && item.payload) {
        await dbService.createVisitorReport({
          eventId: item.payload.eventId || 'maha-kumbh',
          userId: userId || 'anonymous',
          userName: item.payload.userName || 'Offline Visitor',
          category: item.payload.category || 'Other',
          description: `[OFFLINE SYNC] ${item.payload.description}`,
          latitude: parseFloat(item.payload.latitude) || 25.4294,
          longitude: parseFloat(item.payload.longitude) || 81.8841
        });
      } else if (item.type === 'SOS' && item.payload) {
        await dbService.createEmergencySOS({
          eventId: item.payload.eventId || 'maha-kumbh',
          userId: userId || 'anonymous',
          userName: item.payload.userName || 'Offline Visitor',
          latitude: parseFloat(item.payload.latitude) || 25.4294,
          longitude: parseFloat(item.payload.longitude) || 81.8841,
          notes: `[OFFLINE QUEUED SOS] ${item.payload.notes || ''}`
        });
      }

      processedResults.push({ id: item.id || syncId, status: 'SYNCED' });
    }

    // Broadcast offline:sync event
    const io = getIO();
    if (io) {
      io.emit('offline:sync', {
        userId,
        count: processedResults.length,
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      message: `Successfully synchronized ${processedResults.length} queued offline actions into SQL Server`,
      processed: processedResults,
      serverTime: new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Offline sync failed', details: err.message });
  }
});

export default router;
