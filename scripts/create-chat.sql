-- =============================================
-- 채팅 테이블
-- =============================================

-- 채팅 메시지
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_hash TEXT
);

CREATE INDEX idx_chat_messages_created_at ON chat_messages (created_at DESC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages_read" ON chat_messages
  FOR SELECT USING (true);

CREATE POLICY "chat_messages_insert" ON chat_messages
  FOR INSERT WITH CHECK (true);

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- 채팅 유저 (닉네임 중복 방지)
CREATE TABLE chat_users (
  user_hash TEXT PRIMARY KEY,
  nickname TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_users_nickname ON chat_users (nickname);

ALTER TABLE chat_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_users_read" ON chat_users
  FOR SELECT USING (true);

CREATE POLICY "chat_users_insert" ON chat_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "chat_users_update" ON chat_users
  FOR UPDATE USING (true);
