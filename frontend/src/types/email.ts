export interface EmailAccount {
  id: string;
  name: string;
  email: string;
  provider: string;
  status: 'connected' | 'error' | 'syncing';
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  imapUsername: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUsername?: string;
  lastSync?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Email {
  id: string;
  uid: number;
  subject: string;
  sender: string;
  recipient: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  flags?: string;
  content?: string;
  textContent?: string;
  htmlContent?: string;
  attachments?: any;
  category?: string;
  priority?: 'high' | 'medium' | 'low';
  tags?: string;
  folder: string;
  summary?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  keyPoints?: string;
  actionRequired: boolean;
  confidence?: number;
  aiAnalysis?: any;
  isSent: boolean;
  messageId?: string;
  accountId: string;
  account?: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EmailFilter {
  accountId?: string;
  folder?: string;
  page?: number;
  limit?: number;
  search?: string;
  unreadOnly?: boolean;
}

export interface EmailPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface EmailListResponse {
  emails: Email[];
  pagination: EmailPagination;
}

export interface AttachmentData {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailRequest {
  accountId: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: AttachmentData[];
}

export interface SendEmailResponse {
  success: boolean;
  messageId: string;
  response: string;
}

export interface IMAPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

export interface AddAccountRequest {
  name: string;
  email: string;
  provider?: string;
  imapConfig: IMAPConfig;
  smtpConfig?: SMTPConfig;
}