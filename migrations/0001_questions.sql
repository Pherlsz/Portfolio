CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asked_at TEXT NOT NULL,
  text TEXT NOT NULL,
  reasoning TEXT NOT NULL DEFAULT 'default',
  leaked INTEGER NOT NULL DEFAULT 0,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  thinking_tokens INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_questions_asked_at ON questions(asked_at);
