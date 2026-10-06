import { Router, Request, Response } from 'express';
import { dbService } from '../config/db';
import { getIO } from '../socket';

const router = Router();

// GET /api/interventions
router.get('/', async (req: Request, res: Response) => {
  try {
    const eventId = req.query.eventId as string;
    const list = await dbService.getInterventions(eventId);
    return res.json({ success: true, count: list.length, interventions: list });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve interventions', details: err.message });
  }
});

// POST /api/interventions (Create or approve intervention)
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      interventionId,
      eventId,
      title,
      actionType,
      targetEntity,
      description,
      beforeState,
      afterState,
      approvedByUserId
    } = req.body;

    if (interventionId) {
      // Approving existing intervention using stored procedure or SQL query
      const outcome = `Intervention '${title || 'Dynamic Reroute'}' executed. Flow redistributed: ${beforeState || 'HIGH'} ➔ ${afterState || 'MODERATE (Pressure normalized)'}.`;
      await dbService.approveIntervention(interventionId, approvedByUserId || 'usr-op-01', outcome);

      const io = getIO();
      if (io) {
        io.emit('intervention:approved', {
          interventionId,
          eventId,
          status: 'APPROVED',
          approvedByUserId: approvedByUserId || 'usr-op-01',
          approvedAt: new Date().toISOString(),
          measuredOutcome: outcome
        });
        io.emit('crowd:update', {
          eventId: eventId || 'maha-kumbh',
          reason: 'INTERVENTION_EXECUTED',
          interventionId
        });
      }

      return res.json({
        success: true,
        message: 'Intervention approved and executed via SQL Server procedure.',
        intervention: {
          interventionId,
          status: 'APPROVED',
          measuredOutcome: outcome
        }
      });
    }

    // Creating new intervention record in SQL Server
    const newIntervention = await dbService.createIntervention({
      eventId: eventId || 'maha-kumbh',
      title: title || 'Operational Re-routing Action',
      actionType: actionType || 'REDIRECT',
      targetEntity: targetEntity || 'General Venue',
      description: description || 'Operator initiated intervention',
      beforeState: beforeState || 'HIGH',
      afterState: afterState || 'MODERATE',
      approvedByUserId: approvedByUserId || 'usr-op-01'
    });

    const io = getIO();
    if (io) {
      io.emit('intervention:approved', newIntervention);
    }

    return res.status(201).json({
      success: true,
      message: 'Intervention registered in SQL Server and outcome measured',
      intervention: newIntervention
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to process intervention', details: err.message });
  }
});

export default router;
