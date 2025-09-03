import React, { useState } from 'react';
import { 
  EnvelopeIcon, 
  InboxIcon, 
  PaperAirplaneIcon,
  StarIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import AccountSwitcher from '../components/AccountSwitcher';

// 模拟邮件数据
const mockEmails = [
  {
    id: 1,
    sender: 'GitHub Support',
    subject: '您的 Pull Request 已被合并',
    preview: '恭喜！您提交的 Pull Request #1234 已经被成功合并到主分支...',
    time: '10:30',
    isRead: false,
    isStarred: true,
    account: 'github@example.com'
  },
  {
    id: 2,
    sender: '钉钉团队',
    subject: '会议提醒：团队周会 - 14:00',
    preview: '您有一个即将开始的会议：团队周会，时间：今天 14:00，地点：会议室A...',
    time: '09:45',
    isRead: false,
    isStarred: false,
    account: 'work@company.com'
  },
  {
    id: 3,
    sender: 'OpenAI',
    subject: 'API 使用报告 - 2024年9月',
    preview: '您的 OpenAI API 使用情况报告已生成，本月共使用了 150,000 tokens...',
    time: '08:20',
    isRead: true,
    isStarred: false,
    account: 'dev@example.com'
  },
  {
    id: 4,
    sender: '飞书',
    subject: '文档协作邀请',
    preview: '张三邀请您协作编辑文档："邮箱管家产品需求文档"，点击链接开始协作...',
    time: '昨天',
    isRead: true,
    isStarred: true,
    account: 'work@company.com'
  }
];

const DashboardPage: React.FC = () => {
  const [selectedEmail, setSelectedEmail] = useState(mockEmails[0]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* 侧边栏 */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
        {/* 头部 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <span className="text-2xl">📧</span>
              {!sidebarCollapsed && (
                <h1 className="ml-2 text-xl font-bold text-gray-900">邮箱管家</h1>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <Cog6ToothIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 p-4 space-y-2">
          <NavItem icon={InboxIcon} label="收件箱" count={2} active={true} collapsed={sidebarCollapsed} />
          <NavItem icon={PaperAirplaneIcon} label="已发送" collapsed={sidebarCollapsed} />
          <NavItem icon={StarIcon} label="已标星" count={3} collapsed={sidebarCollapsed} />
          <NavItem icon={TrashIcon} label="垃圾箱" collapsed={sidebarCollapsed} />
          
          {!sidebarCollapsed && (
            <>
              <div className="pt-4 pb-2">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  AI 助手
                </h3>
              </div>
              <NavItem icon={BellIcon} label="智能提醒" collapsed={false} />
            </>
          )}
        </nav>

        {/* 用户信息 */}
        <div className="p-4 border-t border-gray-200">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <UserCircleIcon className="h-8 w-8 text-gray-400" />
            {!sidebarCollapsed && (
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">演示用户</p>
                <p className="text-xs text-gray-500">demo@example.com</p>
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={handleLogout}
                className="ml-2 p-1 text-gray-400 hover:text-red-500 rounded"
                title="退出登录"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex">
        {/* 邮件列表 */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          {/* 账户切换器 */}
          <div className="p-4 border-b border-gray-200">
            <AccountSwitcher />
          </div>

          {/* 搜索栏 */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索邮件..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 邮件列表 */}
          <div className="flex-1 overflow-y-auto">
            {mockEmails.map((email) => (
              <EmailItem
                key={email.id}
                email={email}
                isSelected={selectedEmail.id === email.id}
                onClick={() => setSelectedEmail(email)}
              />
            ))}
          </div>
        </div>

        {/* 邮件内容 */}
        <div className="flex-1 flex flex-col">
          {selectedEmail && <EmailContent email={selectedEmail} />}
        </div>
      </div>
    </div>
  );
};

// 导航菜单项组件
const NavItem: React.FC<{
  icon: React.ComponentType<any>;
  label: string;
  count?: number;
  active?: boolean;
  collapsed: boolean;
}> = ({ icon: Icon, label, count, active = false, collapsed }) => {
  return (
    <div
      className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-700 hover:bg-gray-100'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!collapsed && (
        <>
          <span className="ml-3 text-sm font-medium">{label}</span>
          {count !== undefined && (
            <span className="ml-auto bg-gray-200 text-gray-700 text-xs rounded-full px-2 py-1">
              {count}
            </span>
          )}
        </>
      )}
    </div>
  );
};

// 邮件列表项组件
const EmailItem: React.FC<{
  email: any;
  isSelected: boolean;
  onClick: () => void;
}> = ({ email, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
        isSelected ? 'bg-blue-50 border-blue-200' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className={`w-2 h-2 rounded-full mt-2 ${email.isRead ? 'bg-transparent' : 'bg-blue-500'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`text-sm ${email.isRead ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
              {email.sender}
            </p>
            <div className="flex items-center space-x-1">
              {email.isStarred && <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />}
              <span className="text-xs text-gray-500">{email.time}</span>
            </div>
          </div>
          <p className={`text-sm mt-1 ${email.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
            {email.subject}
          </p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {email.preview}
          </p>
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
              {email.account}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 邮件内容组件
const EmailContent: React.FC<{ email: any }> = ({ email }) => {
  return (
    <div className="flex-1 flex flex-col">
      {/* 邮件头部 */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{email.subject}</h1>
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
              <span>来自: {email.sender}</span>
              <span>发送到: {email.account}</span>
              <span>时间: {email.time}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-yellow-500">
              <StarIcon className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-red-500">
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 邮件内容 */}
      <div className="flex-1 p-6 bg-white overflow-y-auto">
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed">
            {email.preview}
          </p>
          <p className="mt-4 text-gray-700 leading-relaxed">
            这是邮件的详细内容。在实际应用中，这里会显示完整的邮件正文，
            支持富文本格式、图片、附件等内容。
          </p>
          <p className="mt-4 text-gray-700 leading-relaxed">
            AI 助手可以帮助您：
          </p>
          <ul className="mt-2 space-y-1 text-gray-700">
            <li>• 自动分析邮件重要性</li>
            <li>• 提供回复建议</li>
            <li>• 智能分类和标签</li>
            <li>• 设置提醒和跟进</li>
          </ul>
        </div>
      </div>

      {/* AI 助手建议 */}
      <div className="p-4 bg-blue-50 border-t border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">🤖</span>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900">AI 助手建议</h4>
            <p className="text-sm text-blue-700 mt-1">
              这封邮件看起来很重要，建议您及时回复。我为您准备了一些回复模板：
            </p>
            <div className="mt-2 space-x-2">
              <button className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
                感谢确认
              </button>
              <button className="px-3 py-1 bg-white text-blue-500 text-xs rounded border border-blue-300 hover:bg-blue-50">
                需要更多信息
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;