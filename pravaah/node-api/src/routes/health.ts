import { Router, Request, Response } from 'express';
import { dbService } from '../config/db';
import { getIO } from '../socket';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const io = getIO();
  const socketStatus = io ? 'UP' : 'DOWN';

  // Explicit demo mode check
  if (dbService.isDemoMode) {
    const counts = await dbService.getCounts();
    return res.json({
      status: 'UP',
      project: 'PRAVAAH — Intelligent Crowd & Event Orchestration',
      technology: {
        framework: 'Express + TypeScript',
        database: 'Mock Database (DEMO_MODE=true)',
        realtime: 'Socket.IO Engine 4.x',
        environment: process.env.NODE_ENV || 'development'
      },
      databaseStatus: 'MOCK',
      mockMode: true,
      socketStatus,
      counts,
      timestamp: new Date().toISOString()
    });
  }

  // Real SQL Server connection verification
  try {
    if (!dbService.isConnectedToSqlServer || !dbService.pool) {
      throw new Error(dbService.lastError || 'SQL Server pool is not connected');
    }

    // Actively test connection with a live query to verify pool responsiveness
    const testQuery = await dbService.pool.request().query('SELECT 1 AS HealthPing');
    if (!testQuery.recordset || testQuery.recordset.length === 0) {
      throw new Error('Health ping query returned no records');
    }

    // Read actual counts directly from PravaahDB tables
    const counts = await dbService.getCounts();

    return res.json({
      status: 'UP',
      project: 'PRAVAAH — Intelligent Crowd & Event Orchestration',
      technology: {
        framework: 'Express + TypeScript',
        database: 'Microsoft SQL Server 2022',
        realtime: 'Socket.IO Engine 4.x',
        environment: process.env.NODE_ENV || 'development'
      },
      databaseStatus: 'UP',
      mockMode: false,
      socketStatus,
      counts: {
        events: Number(counts.events),
        alerts: Number(counts.alerts),
        interventions: Number(counts.interventions),
        visitorReports: Number(counts.visitorReports),
        emergencies: Number(counts.emergencies)
      },
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    // Report failure explicitly without masking behind mock data
    return res.status(503).json({
      status: 'DEGRADED',
      project: 'PRAVAAH — Intelligent Crowd & Event Orchestration',
      technology: {
        framework: 'Express + TypeScript',
        database: 'Microsoft SQL Server 2022 (Disconnected)',
        realtime: 'Socket.IO Engine 4.x',
        environment: process.env.NODE_ENV || 'development'
      },
      databaseStatus: 'DOWN',
      databaseError: err.message,
      mockMode: false,
      socketStatus,
      counts: {
        events: 0,
        alerts: 0,
        interventions: 0,
        visitorReports: 0,
        emergencies: 0
      },
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
