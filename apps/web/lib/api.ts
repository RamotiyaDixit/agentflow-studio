const BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, '');

export type StepType = 'ai' | 'http' | 'transform' | 'condition' | 'approval';
export type WorkflowStep = { id: string; name: string; type: StepType; config: Record<string, unknown> };
export type Workflow = { id: number; name: string; description: string; status: 'active' | 'draft' | 'paused'; steps: WorkflowStep[]; createdAt?: string };
export type Run = { id: number; workflowId: number; workflowName: string; status: string; error?: string | null; createdAt: string; startedAt?: string; finishedAt?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store'
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  workflows: () => request<Workflow[]>('/workflows'),
  runs: () => request<Run[]>('/runs?limit=8'),
  run: (id: number, input: unknown) => request<{ runId: number; status: string; output?: unknown; error?: string }>(`/workflows/${id}/run`, { method: 'POST', body: JSON.stringify({ input }) }),
  create: (data: Partial<Workflow>) => request<Workflow>('/workflows', { method: 'POST', body: JSON.stringify(data) })
};
