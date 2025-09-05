import {
  EmailAccount,
  SendEmailRequest,
  SendEmailResponse,
  EmailFilter,
  EmailListResponse,
  Email,
  AddAccountRequest,
  IMAPConfig
} from '../types/email';

class EmailService {
  private baseURL = '/api/emails';

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // 获取用户邮箱账户
  async getAccounts(): Promise<EmailAccount[]> {
    const response = await fetch(`${this.baseURL}/accounts`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('获取邮箱账户失败');
    }

    return response.json();
  }

  // 发送邮件
  async sendEmail(emailData: SendEmailRequest): Promise<SendEmailResponse> {
    const response = await fetch(`${this.baseURL}/send`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '发送邮件失败');
    }

    return response.json();
  }

  // 获取邮件列表
  async getEmails(filter: EmailFilter = {}): Promise<EmailListResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseURL}?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('获取邮件列表失败');
    }

    return response.json();
  }

  // 获取邮件详情
  async getEmailDetail(emailId: string): Promise<Email> {
    const response = await fetch(`${this.baseURL}/${emailId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('获取邮件详情失败');
    }

    return response.json();
  }

  // 标记邮件为已读/未读
  async markEmailRead(emailId: string, isRead: boolean): Promise<{success: boolean}> {
    const response = await fetch(`${this.baseURL}/${emailId}/read`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ isRead }),
    });

    if (!response.ok) {
      throw new Error('标记邮件状态失败');
    }

    return response.json();
  }

  // 同步邮箱
  async syncAccount(accountId: string): Promise<{success: boolean; message: string}> {
    const response = await fetch(`${this.baseURL}/accounts/${accountId}/sync`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('同步邮箱失败');
    }

    return response.json();
  }

  // 添加邮箱账户
  async addAccount(accountData: AddAccountRequest): Promise<EmailAccount> {
    const response = await fetch(`${this.baseURL}/accounts`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(accountData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '添加邮箱账户失败');
    }

    return response.json();
  }

  // 删除邮箱账户
  async deleteAccount(accountId: string): Promise<{success: boolean}> {
    const response = await fetch(`${this.baseURL}/accounts/${accountId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('删除邮箱账户失败');
    }

    return response.json();
  }

  // 测试IMAP连接
  async testConnection(imapConfig: IMAPConfig): Promise<{success: boolean; message?: string}> {
    const response = await fetch(`${this.baseURL}/test-connection`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(imapConfig),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '连接测试失败');
    }

    return data;
  }
}

export const emailService = new EmailService();
export default emailService;