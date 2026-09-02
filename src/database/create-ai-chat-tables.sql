CREATE TABLE IF NOT EXISTS ai_conversations (
  conversation_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_chat_messages (
  message_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES ai_conversations(conversation_id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
  request_id VARCHAR(100),
  content VARCHAR(5000) NOT NULL CHECK (char_length(trim(content)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_chat_messages_conversation_created_idx
  ON ai_chat_messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_chat_messages_created_idx
  ON ai_chat_messages (created_at);
ALTER TABLE ai_chat_messages ADD COLUMN IF NOT EXISTS request_id VARCHAR(100);
CREATE UNIQUE INDEX IF NOT EXISTS ai_chat_messages_user_request_uidx
  ON ai_chat_messages (conversation_id, request_id)
  WHERE role = 'user' AND request_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_conversations_user_id_fkey'
  ) THEN
    ALTER TABLE ai_conversations
      ADD CONSTRAINT ai_conversations_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
  END IF;
END $$;
