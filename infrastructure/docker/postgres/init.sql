-- 邮箱管家数据库初始化脚本
-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    avatar_url TEXT,
    locale VARCHAR(10) DEFAULT 'zh-CN',
    timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
    preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- 用户OAuth提供商关联表
CREATE TABLE IF NOT EXISTS user_oauth_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'google', 'microsoft', etc.
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

-- 邮件账户表
CREATE TABLE IF NOT EXISTS mail_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(200),
    provider VARCHAR(50) NOT NULL, -- 'gmail', 'outlook', 'imap', 'exchange'
    oauth_provider_id UUID REFERENCES user_oauth_providers(id),
    -- IMAP/SMTP配置（用于非OAuth账户）
    imap_server VARCHAR(255),
    imap_port INTEGER DEFAULT 993,
    imap_security VARCHAR(10) DEFAULT 'SSL', -- 'SSL', 'STARTTLS', 'NONE'
    smtp_server VARCHAR(255),
    smtp_port INTEGER DEFAULT 587,
    smtp_security VARCHAR(10) DEFAULT 'STARTTLS',
    -- 账户设置
    sync_enabled BOOLEAN DEFAULT TRUE,
    sync_frequency INTEGER DEFAULT 300, -- 秒
    signature TEXT,
    auto_reply_enabled BOOLEAN DEFAULT FALSE,
    auto_reply_message TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 邮件文件夹表
CREATE TABLE IF NOT EXISTS mail_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES mail_accounts(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    folder_type VARCHAR(50) DEFAULT 'custom', -- 'inbox', 'sent', 'drafts', 'trash', 'spam', 'custom'
    parent_folder_id UUID REFERENCES mail_folders(id),
    unread_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, name)
);

-- 邮件表
CREATE TABLE IF NOT EXISTS emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES mail_accounts(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES mail_folders(id),
    -- 邮件标识
    message_id VARCHAR(500) NOT NULL,
    thread_id VARCHAR(255),
    uid VARCHAR(100), -- IMAP UID
    -- 邮件头信息
    subject TEXT,
    sender_name VARCHAR(255),
    sender_email VARCHAR(255) NOT NULL,
    reply_to VARCHAR(255),
    recipients JSONB DEFAULT '[]', -- [{"name": "张三", "email": "zhang@example.com", "type": "to"}]
    cc JSONB DEFAULT '[]',
    bcc JSONB DEFAULT '[]',
    -- 邮件内容
    text_content TEXT,
    html_content TEXT,
    preview_text TEXT, -- 邮件预览文本
    -- 邮件属性
    size_bytes INTEGER DEFAULT 0,
    has_attachments BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    is_important BOOLEAN DEFAULT FALSE,
    is_draft BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    -- AI分析结果
    priority_score INTEGER DEFAULT 0, -- 0-100
    sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative'
    ai_summary TEXT,
    ai_tags JSONB DEFAULT '[]',
    -- 时间信息
    sent_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 邮件附件表
CREATE TABLE IF NOT EXISTS email_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    content_type VARCHAR(200),
    size_bytes INTEGER DEFAULT 0,
    content_id VARCHAR(255), -- 用于内嵌图片
    is_inline BOOLEAN DEFAULT FALSE,
    file_path TEXT, -- 存储路径
    download_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI 分析记录表
CREATE TABLE IF NOT EXISTS ai_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL, -- 'summary', 'priority', 'sentiment', 'category', 'reply_suggestion'
    analysis_result JSONB NOT NULL,
    confidence_score DECIMAL(4,3), -- 0.000-1.000
    model_version VARCHAR(50),
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 用户标签表
CREATE TABLE IF NOT EXISTS user_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- 邮件标签关联表
CREATE TABLE IF NOT EXISTS email_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES user_tags(id) ON DELETE CASCADE,
    applied_by VARCHAR(20) DEFAULT 'user', -- 'user', 'ai', 'rule'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email_id, tag_id)
);

-- 邮件规则表
CREATE TABLE IF NOT EXISTS mail_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    conditions JSONB NOT NULL, -- 规则条件
    actions JSONB NOT NULL, -- 执行动作
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 通知配置表
CREATE TABLE IF NOT EXISTS notification_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'dingtalk', 'feishu', 'wechat', 'slack'
    config JSONB NOT NULL, -- 平台特定配置
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, platform)
);

-- 通知历史表
CREATE TABLE IF NOT EXISTS notification_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email_id UUID REFERENCES emails(id) ON DELETE SET NULL,
    platform VARCHAR(50) NOT NULL,
    message_type VARCHAR(50) NOT NULL, -- 'new_email', 'important_email', 'reminder'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI对话历史表
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL,
    message_type VARCHAR(20) NOT NULL, -- 'user', 'assistant'
    message_text TEXT NOT NULL,
    context JSONB, -- 相关邮件ID、操作上下文等
    model_version VARCHAR(50),
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
-- 用户相关索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- OAuth提供商索引
CREATE INDEX IF NOT EXISTS idx_oauth_providers_user_id ON user_oauth_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_providers_provider ON user_oauth_providers(provider, provider_user_id);

-- 邮件账户索引
CREATE INDEX IF NOT EXISTS idx_mail_accounts_user_id ON mail_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_mail_accounts_email ON mail_accounts(email);
CREATE INDEX IF NOT EXISTS idx_mail_accounts_active ON mail_accounts(is_active);

-- 邮件文件夹索引
CREATE INDEX IF NOT EXISTS idx_mail_folders_account_id ON mail_folders(account_id);
CREATE INDEX IF NOT EXISTS idx_mail_folders_type ON mail_folders(folder_type);

-- 邮件索引
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_account_id ON emails(account_id);
CREATE INDEX IF NOT EXISTS idx_emails_folder_id ON emails(folder_id);
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);
CREATE INDEX IF NOT EXISTS idx_emails_thread_id ON emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_sender_email ON emails(sender_email);
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_is_read ON emails(is_read);
CREATE INDEX IF NOT EXISTS idx_emails_is_starred ON emails(is_starred);
CREATE INDEX IF NOT EXISTS idx_emails_priority_score ON emails(priority_score DESC);

-- 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_emails_subject_gin ON emails USING GIN (to_tsvector('english', subject));
CREATE INDEX IF NOT EXISTS idx_emails_content_gin ON emails USING GIN (to_tsvector('english', text_content));

-- AI分析索引
CREATE INDEX IF NOT EXISTS idx_ai_analyses_email_id ON ai_analyses(email_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_type ON ai_analyses(analysis_type);

-- 标签索引
CREATE INDEX IF NOT EXISTS idx_user_tags_user_id ON user_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_email_tags_email_id ON email_tags(email_id);
CREATE INDEX IF NOT EXISTS idx_email_tags_tag_id ON email_tags(tag_id);

-- 规则索引
CREATE INDEX IF NOT EXISTS idx_mail_rules_user_id ON mail_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_mail_rules_active ON mail_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_mail_rules_priority ON mail_rules(priority DESC);

-- 通知索引
CREATE INDEX IF NOT EXISTS idx_notification_configs_user_id ON notification_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_status ON notification_history(status);

-- AI对话索引
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at DESC);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_oauth_providers_updated_at BEFORE UPDATE ON user_oauth_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mail_accounts_updated_at BEFORE UPDATE ON mail_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mail_folders_updated_at BEFORE UPDATE ON mail_folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON emails FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_tags_updated_at BEFORE UPDATE ON user_tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mail_rules_updated_at BEFORE UPDATE ON mail_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_configs_updated_at BEFORE UPDATE ON notification_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入系统标签
INSERT INTO user_tags (id, user_id, name, color, description, is_system) 
SELECT 
    uuid_generate_v4(),
    u.id,
    tag_data.name,
    tag_data.color,
    tag_data.description,
    true
FROM (
    SELECT 
        '重要' as name, '#EF4444' as color, '重要邮件' as description
    UNION ALL SELECT '工作', '#3B82F6', '工作相关邮件'
    UNION ALL SELECT '个人', '#10B981', '个人邮件'
    UNION ALL SELECT '待回复', '#F59E0B', '需要回复的邮件'
    UNION ALL SELECT '已处理', '#6B7280', '已处理的邮件'
) tag_data
CROSS JOIN (
    SELECT id FROM users WHERE email = 'demo@example.com'
    UNION ALL
    SELECT uuid_generate_v4() as id -- 如果demo用户不存在，创建一个临时ID
    LIMIT 1
) u
ON CONFLICT (user_id, name) DO NOTHING;

-- 插入演示用户数据
INSERT INTO users (id, email, name, avatar_url, preferences) 
VALUES (
    uuid_generate_v4(),
    'demo@example.com', 
    '演示用户',
    'https://via.placeholder.com/40',
    '{"theme": "light", "language": "zh-CN", "emailsPerPage": 20}'
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url,
    preferences = EXCLUDED.preferences,
    updated_at = CURRENT_TIMESTAMP;
