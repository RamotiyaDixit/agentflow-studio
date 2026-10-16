import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';

export const runsRouter = Router();

runsRouter.get('/', async (req, res, next) => {
  try {
    const limit = z.coerce.number().int().min(1).max(100).catch(20).parse(req.query.limit ?? 20);
    const [rows] = await pool.query('SELECT id,workflow_id AS workflowId,workflow_name AS workflowName,status,error,started_at AS startedAt,finished_at AS finishedAt,created_at AS createdAt FROM runs ORDER BY id DESC LIMIT ?', [limit]);
    res.json(rows);
  } catch (error) { next(error); }
});

runsRouter.get('/:id', async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const [rows] = await pool.execute('SELECT id,workflow_id AS workflowId,workflow_name AS workflowName,status,input,output,error,started_at AS startedAt,finished_at AS finishedAt,created_at AS createdAt FROM runs WHERE id=?', [id]);
    const run = (rows as Record<string, unknown>[])[0];
    if (!run) { res.status(404).json({ error: 'Run not found' }); return; }
    const [steps] = await pool.execute('SELECT id,step_index AS stepIndex,step_name AS stepName,step_type AS stepType,status,input,output,error,duration_ms AS durationMs,created_at AS createdAt FROM run_steps WHERE run_id=? ORDER BY step_index', [id]);
    res.json({ ...run, steps });
  } catch (error) { next(error); }
});
