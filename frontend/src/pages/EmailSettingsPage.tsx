import React, { useState, useEffect } from 'react';
import { 
  Cog6ToothIcon,
  PlusIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface EmailAccount {
  id: string;
  name: string;
  email: string;
  provider: 'gmail' | 'outlook' | 'imap' | 'other';
  status: 'connected' | 'error' | 'connecting';
  lastSync?: string;
  unreadCount?: number;
  imapConfig?: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
  };
}

const EmailSettingsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<EmailAccount[]>([
    {
      id: '1',
      name: '工作邮箱',
      email: 'work@company.com',
      provider: 'gmail',
      status: 'connected',
      lastSync: '2024-09-03 16:30:00',
      unreadCount: 5
    },
    {
      id: '2', 
      name: '个人邮箱',
      email: 'personal@gmail.com',
      provider: 'gmail',
      status: 'connected',
      lastSync: '2024-09-03 16:25:00',
      unreadCount: 12
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    email: '',
    provider: 'imap' as const,
    imapHost: '',
    imapPort: 993,
    imapSecure: true,
    username: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // 测试 IMAP 连接
  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const response = await fetch('/api/emails/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          host: newAccount.imapHost,
          port: newAccount.imapPort,
          secure: newAccount.imapSecure,
          username: newAccount.username,
          password: newAccount.password
        })
      });
      
      if (response.ok) {
        alert('连接测试成功！');
      } else {
        const error = await response.json();
        alert(`连接测试失败: ${error.message}`);
      }
    } catch (error) {
      alert(`连接测试失败: ${error}`);
    } finally {
      setTestingConnection(false);
    }
  };

  // 添加新邮箱账户
  const handleAddAccount = async () => {
    if (!newAccount.name || !newAccount.email || !newAccount.imapHost) {
      alert('请填写所有必需字段');
      return;
    }

    try {
      const response = await fetch('/api/emails/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          name: newAccount.name,
          email: newAccount.email,
          provider: newAccount.provider,
          imapConfig: {
            host: newAccount.imapHost,
            port: newAccount.imapPort,
            secure: newAccount.imapSecure,
            username: newAccount.username,
            password: newAccount.password
          }
        })
      });

      if (response.ok) {
        const account = await response.json();
        setAccounts([...accounts, account]);
        setShowAddForm(false);
        setNewAccount({
          name: '',
          email: '',
          provider: 'imap',
          imapHost: '',
          imapPort: 993,
          imapSecure: true,
          username: '',
          password: ''
        });
        alert('邮箱账户添加成功！');
      } else {
        const error = await response.json();
        alert(`添加失败: ${error.message}`);
      }
    } catch (error) {
      alert(`添加失败: ${error}`);
    }
  };

  // 删除邮箱账户
  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('确定要删除这个邮箱账户吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/emails/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        setAccounts(accounts.filter(acc => acc.id !== accountId));
        alert('邮箱账户删除成功！');
      }
    } catch (error) {
      alert(`删除失败: ${error}`);
    }
  };

  // 重新同步邮箱
  const handleSyncAccount = async (accountId: string) => {
    try {
      const response = await fetch(`/api/emails/accounts/${accountId}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        // 更新账户状态
        setAccounts(accounts.map(acc => 
          acc.id === accountId 
            ? { ...acc, status: 'connecting' as const, lastSync: new Date().toISOString() }
            : acc
        ));
      }
    } catch (error) {
      console.error('同步失败:', error);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'gmail':
        return '📧';
      case 'outlook':
        return '📬';
      case 'imap':
        return '⚙️';
      default:
        return '📮';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'connecting':
        return <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Cog6ToothIcon className="h-8 w-8 text-gray-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">邮箱设置</h1>
              <p className="text-gray-600">管理您的邮箱账户和连接设置</p>
            </div>
          </div>
        </div>

        {/* 邮箱账户列表 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">已连接的邮箱账户</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                添加邮箱
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {accounts.map((account) => (
              <div key={account.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{getProviderIcon(account.provider)}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900">{account.name}</h3>
                        {getStatusIcon(account.status)}
                      </div>
                      <p className="text-sm text-gray-500">{account.email}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        {account.lastSync && (
                          <p className="text-xs text-gray-400">
                            上次同步: {new Date(account.lastSync).toLocaleString('zh-CN')}
                          </p>
                        )}
                        {account.unreadCount !== undefined && (
                          <p className="text-xs text-blue-600">
                            未读: {account.unreadCount} 封
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSyncAccount(account.id)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50"
                    >
                      同步
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="p-2 text-gray-400 hover:text-red-500"
                      title="删除账户"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 添加邮箱表单 */}
        {showAddForm && (
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">添加新邮箱账户</h2>
              <p className="text-sm text-gray-500 mt-1">配置您的 IMAP 邮箱连接</p>
            </div>

            <div className="px-6 py-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    账户名称
                  </label>
                  <input
                    type="text"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                    placeholder="例如：工作邮箱"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱地址
                  </label>
                  <input
                    type="email"
                    value={newAccount.email}
                    onChange={(e) => setNewAccount({...newAccount, email: e.target.value})}
                    placeholder="your@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IMAP 服务器地址
                  </label>
                  <input
                    type="text"
                    value={newAccount.imapHost}
                    onChange={(e) => setNewAccount({...newAccount, imapHost: e.target.value})}
                    placeholder="imap.gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    端口
                  </label>
                  <input
                    type="number"
                    value={newAccount.imapPort}
                    onChange={(e) => setNewAccount({...newAccount, imapPort: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newAccount.imapSecure}
                    onChange={(e) => setNewAccount({...newAccount, imapSecure: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">使用 SSL/TLS 加密连接</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    用户名
                  </label>
                  <input
                    type="text"
                    value={newAccount.username}
                    onChange={(e) => setNewAccount({...newAccount, username: e.target.value})}
                    placeholder="通常是您的邮箱地址"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    密码
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newAccount.password}
                      onChange={(e) => setNewAccount({...newAccount, password: e.target.value})}
                      placeholder="邮箱密码或应用专用密码"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Gmail 用户建议使用应用专用密码
                  </p>
                </div>
              </div>

              {/* 常用邮箱配置提示 */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">常用邮箱 IMAP 设置</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <div><strong>Gmail:</strong> imap.gmail.com:993 (SSL)</div>
                  <div><strong>Outlook:</strong> outlook.office365.com:993 (SSL)</div>
                  <div><strong>QQ邮箱:</strong> imap.qq.com:993 (SSL)</div>
                  <div><strong>网易邮箱:</strong> imap.163.com:993 (SSL)</div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-between">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                取消
              </button>
              <div className="space-x-3">
                <button
                  onClick={testConnection}
                  disabled={testingConnection}
                  className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {testingConnection ? '测试中...' : '测试连接'}
                </button>
                <button
                  onClick={handleAddAccount}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  添加账户
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailSettingsPage;