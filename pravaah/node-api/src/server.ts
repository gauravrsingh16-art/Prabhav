import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { dbService } from './config/db';
import { initSocketIO } from './socket';

import authRouter from './routes/auth';
import eventsRouter from './routes/events';
import crowdRouter from './routes/crowd';
import alertsRouter from './routes/alerts';
import interventionsRouter from './routes/interventions';
import emergencyRouter from './routes/emergency';
import userRouter from './routes/user';
import offlineRouter from './routes/offline';
import healthRouter from './routes/health';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:4200';

// Middleware
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:4200', 'http://127.0.0.1:4200'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads directory for crowd videos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Initialize Socket.IO
initSocketIO(server, [CLIENT_URL, 'http://localhost:4200', 'http://127.0.0.1:4200']);

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/crowd', crowdRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/interventions', interventionsRouter);
app.use('/api/emergency', emergencyRouter);
app.use('/api/user', userRouter);
app.use('/api/offline', offlineRouter);
app.use('/api/health', healthRouter);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'PRAVAAH — Intelligent Crowd & Event Orchestration API',
    version: '1.0.0',
    documentation: '/api/health',
    status: 'Running'
  });
});

// Start server
async function start() {
  await dbService.initialize();

  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 PRAVAAH Backend API active at: http://localhost:${PORT}`);
    console.log(`📡 Socket.IO Real-Time Engine ready`);
    console.log(`🗄️ Database: Microsoft SQL Server 2022 / SSMS 22 Engine`);
    console.log(`=======================================================`);
  });
}

start().catch(err => {
  console.error('Failed to start PRAVAAH server:', err);
});
