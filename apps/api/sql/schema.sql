CREATE TABLE IF NOT EXISTS workflows (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  status ENUM('active','draft','paused') NOT NULL DEFAULT 'active',
  steps JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  workflow_id BIGINT UNSIGNED NOT NULL,
  workflow_name VARCHAR(120) NOT NULL,
  status ENUM('queued','running','succeeded','failed','needs_approval') NOT NULL DEFAULT 'queued',
  input JSON NULL,
  output JSON NULL,
  error TEXT NULL,
  started_at TIMESTAMP NULL,
  finished_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_runs_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
  INDEX idx_runs_created (created_at),
  INDEX idx_runs_workflow (workflow_id)
);

CREATE TABLE IF NOT EXISTS run_steps (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  run_id BIGINT UNSIGNED NOT NULL,
  step_index INT NOT NULL,
  step_name VARCHAR(120) NOT NULL,
  step_type VARCHAR(32) NOT NULL,
  status ENUM('running','succeeded','failed','needs_approval','skipped') NOT NULL,
  input JSON NULL,
  output JSON NULL,
  error TEXT NULL,
  duration_ms INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_steps_run FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE,
  INDEX idx_steps_run (run_id, step_index)
);

INSERT INTO workflows (name, description, status, steps)
SELECT 'Lead Enrichment Assistant', 'Summarize a lead and prepare a personalized follow-up.', 'active', JSON_ARRAY(
  JSON_OBJECT('id','trigger','name','New lead received','type','transform','config',JSON_OBJECT('template','Lead received: {{input.lead}}')),
  JSON_OBJECT('id','summarize','name','Research & summarize','type','ai','config',JSON_OBJECT('prompt','Summarize this lead and suggest 3 relevant discovery questions. Use only the provided information.','inputKey','trigger')),
  JSON_OBJECT('id','draft','name','Draft follow-up','type','ai','config',JSON_OBJECT('prompt','Write a concise, friendly first-touch follow-up based on the lead and prior analysis. Do not claim facts not provided.','inputKey','summarize')),
  JSON_OBJECT('id','approval','name','Human review','type','approval','config',JSON_OBJECT('message','Review the generated message before sending.'))
) WHERE NOT EXISTS (SELECT 1 FROM workflows WHERE name='Lead Enrichment Assistant');

INSERT INTO workflows (name, description, status, steps)
SELECT 'Support Ticket Triage', 'Classify a ticket and produce a suggested response.', 'active', JSON_ARRAY(
  JSON_OBJECT('id','ticket','name','Normalize ticket','type','transform','config',JSON_OBJECT('template','Support ticket: {{input.ticket}}')),
  JSON_OBJECT('id','classify','name','Classify & prioritize','type','ai','config',JSON_OBJECT('prompt','Classify this support ticket by category and urgency. Return a concise JSON-like object with category, priority, and rationale.','inputKey','ticket')),
  JSON_OBJECT('id','reply','name','Draft customer response','type','ai','config',JSON_OBJECT('prompt','Draft an empathetic initial response. Do not promise refunds, timelines, or outcomes.','inputKey','classify'))
) WHERE NOT EXISTS (SELECT 1 FROM workflows WHERE name='Support Ticket Triage');
