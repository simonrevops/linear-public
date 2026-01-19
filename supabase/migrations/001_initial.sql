-- Boards/Views configuration
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  public_label TEXT DEFAULT 'public',
  password_hash TEXT,
  allowed_domains TEXT[],
  column_grouping JSONB,
  row_grouping JSONB,
  filters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cached Linear data for performance
CREATE TABLE IF NOT EXISTS linear_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments from portal viewers
CREATE TABLE IF NOT EXISTS issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  linear_issue_id TEXT NOT NULL,
  author_name TEXT,
  author_email TEXT,
  content TEXT NOT NULL,
  linear_comment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User authentication/identification
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  hubspot_contact_id TEXT,
  hubspot_team TEXT,
  hubspot_team_id TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chatbot conversation history (for Report page)
-- Mirrors n8n DataTable structure for compatibility
CREATE TABLE IF NOT EXISTS chatbot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id TEXT,
  user_name TEXT,
  user_email TEXT NOT NULL,
  hubspot_contact_id TEXT,
  hubspot_team TEXT,
  hubspot_team_id TEXT,
  channel_id TEXT,
  thread_ts TEXT,
  state TEXT,
  classification JSONB,
  messages JSONB,
  duplicate_id TEXT,
  linear_issue_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_boards_public_label ON boards(public_label);
CREATE INDEX IF NOT EXISTS idx_linear_cache_key ON linear_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_linear_cache_expires ON linear_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_issue_comments_linear_id ON issue_comments(linear_issue_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_email ON chatbot_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_session_id ON chatbot_sessions(session_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issue_comments_updated_at BEFORE UPDATE ON issue_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chatbot_sessions_updated_at BEFORE UPDATE ON chatbot_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

