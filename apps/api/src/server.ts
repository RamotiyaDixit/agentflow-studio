import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { workflowsRouter } from './routes/workflows.js';
import { runsRouter } from './routes/runs.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();
const port = Number(process.env.PORT ?? 4000);
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim());

app.disable('x-powered-by');
app.use(cors({ origin: allowedOrigins, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json({ limit: '64kb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/workflows', workflowsRouter);
app.use('/api/runs', runsRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => console.log(`AgentFlow API listening at http://localhost:${port}`));
