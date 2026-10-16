import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { executeWorkflow } from '../engine/runner.js';

export const workflowsRouter = Router();

const stepSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  type: z.enum(['ai', 'http', 'transform', 'condition', 'approval']),
  config: z.record(z.unknown()).default({})
});
const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().max(500).default(''),
  steps: z.array(stepSchema).min(1).max(20),
  status: z.enum(['active', 'draft', 'paused']).default('draft')
});

workflowsRouter.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id,name,description,status,steps,created_at AS createdAt,updated_at AS updatedAt FROM workflows ORDER BY updated_at DESC');
    res.json(rows);
  } catch (error) { next(error); }
});

workflowsRouter.post('/', async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const [result] = await pool.execute('INSERT INTO workflows (name,description,status,steps) VALUES (?,?,?,?)', [data.name, data.description, data.status, JSON.stringify(data.steps)]);
    res.status(201).json({ id: (result as { insertId: number }).insertId, ...data });
  } catch (error) { next(error); }
});

workflowsRouter.get('/:id', async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const [rows] = await pool.execute('SELECT id,name,description,status,steps,created_at AS createdAt,updated_at AS updatedAt FROM workflows WHERE id=?', [id]);
    const workflow = (rows as Record<string, unknown>[])[0];
    if (!workflow) { res.status(404).json({ error: 'Workflow not found' }); return; }
    res.json(workflow);
  } catch (error) { next(error); }
});

workflowsRouter.post('/:id/run', async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const input = z.unknown().parse(req.body?.input ?? {});
    const [rows] = await pool.execute('SELECT id,name,status,steps FROM workflows WHERE id=?', [id]);
    const workflow = (rows as { id: number; name: string; status: string; steps: unknown }[])[0];
    if (!workflow) { res.status(404).json({ error: 'Workflow not found' }); return; }
    if (workflow.status !== 'active') { res.status(400).json({ error: 'Activate this workflow before running it.' }); return; }
    const steps = typeof workflow.steps === 'string' ? JSON.parse(workflow.steps) as z.infer<typeof stepSchema>[] : workflow.steps as z.infer<typeof stepSchema>[];
    const [result] = await pool.execute("INSERT INTO runs (workflow_id,workflow_name,status,input) VALUES (?,?, 'queued', ?)", [id, workflow.name, JSON.stringify(input)]);
    const runId = (result as { insertId: number }).insertId;
    const execution = await executeWorkflow(runId, id, steps, input);
    res.status(execution.status === 'failed' ? 422 : 200).json({ runId, ...execution });
  } catch (error) { next(error); }
});
