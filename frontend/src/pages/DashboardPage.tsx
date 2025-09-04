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
  Cog6ToothIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
  PlusIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  PencilIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import AccountSwitcher from '../components/AccountSwitcher';
import AIDashboardPage from './AIDashboardPage';
import EmailSettingsPage from './EmailSettingsPage';

// 模拟邮件数据
const allMockEmails = [
  // 收件箱邮件
  {
    id: 1,
    sender: 'GitHub Support',
    subject: '您的 Pull Request 已被合并',
    preview: '恭喜！您提交的 Pull Request #1234 已经被成功合并到主分支...',
    time: '10:30',
    isRead: false,
    isStarred: true,
    account: 'github@example.com',
    folder: 'inbox',
    type: 'received'
  },
  {
    id: 2,
    sender: '钉钉团队',
    subject: '会议提醒：团队周会 - 14:00',
    preview: '您有一个即将开始的会议：团队周会，时间：今天 14:00，地点：会议室A...',
    time: '09:45',
    isRead: false,
    isStarred: false,
    account: 'work@company.com',
    folder: 'inbox',
    type: 'received'
  },
  {
    id: 3,
    sender: 'OpenAI',
    subject: 'API 使用报告 - 2024年9月',
    preview: '您的 OpenAI API 使用情况报告已生成，本月共使用了 150,000 tokens...',
    time: '08:20',
    isRead: true,
    isStarred: false,
    account: 'dev@example.com',
    folder: 'inbox',
    type: 'received'
  },
  {
    id: 4,
    sender: '飞书',
    subject: '文档协作邀请',
    preview: '张三邀请您协作编辑文档："邮箱管家产品需求文档"，点击链接开始协作...',
    time: '昨天',
    isRead: true,
    isStarred: true,
    account: 'work@company.com',
    folder: 'inbox',
    type: 'received'
  },
  // 已发送邮件
  {
    id: 5,
    sender: '您',
    recipient: '张三 <zhangsan@company.com>',
    subject: '项目进度汇报',
    preview: '附件中是本周的项目进度汇报，请查收。主要完成了以下工作...',
    time: '昨天 16:30',
    isRead: true,
    isStarred: false,
    account: 'work@company.com',
    folder: 'sent',
    type: 'sent'
  },
  // 草稿箱邮件
  {
    id: 6,
    sender: '您',
    recipient: '',
    subject: '月度总结报告',
    preview: '9月份工作总结：1. 完成了邮箱管家项目的核心功能开发... [草稿]',
    time: '2小时前',
    isRead: false,
    isStarred: false,
    account: 'work@company.com',
    folder: 'drafts',
    type: 'draft'
  },
  // 垃圾箱邮件
  {
    id: 7,
    sender: '营销推广',
    subject: '限时优惠！99元购买年费会员',
    preview: '亲爱的用户，我们为您准备了超值优惠活动...',
    time: '1周前',
    isRead: false,
    isStarred: false,
    account: 'personal@example.com',
    folder: 'trash',
    type: 'spam'
  }
];

const DashboardPage: React.FC = () => {
  const [selectedEmail, setSelectedEmail] = useState(allMockEmails[0]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState<'emails' | 'dashboard' | 'settings' | 'reminders'>('emails');
  const [currentFolder, setCurrentFolder] = useState<'inbox' | 'sent' | 'starred' | 'drafts' | 'trash'>('inbox');

  // 根据当前文件夹过滤邮件
  const getFilteredEmails = () => {
    switch (currentFolder) {
      case 'inbox':
        return allMockEmails.filter(email => email.folder === 'inbox');
      case 'sent':
        return allMockEmails.filter(email => email.folder === 'sent');
      case 'starred':
        return allMockEmails.filter(email => email.isStarred);
      case 'drafts':
        return allMockEmails.filter(email => email.folder === 'drafts');
      case 'trash':
        return allMockEmails.filter(email => email.folder === 'trash');
      default:
        return allMockEmails.filter(email => email.folder === 'inbox');
    }
  };

  const filteredEmails = getFilteredEmails();
  
  // 获取各文件夹的邮件数量
  const getEmailCounts = () => {
    return {
      inbox: allMockEmails.filter(email => email.folder === 'inbox' && !email.isRead).length,
      sent: allMockEmails.filter(email => email.folder === 'sent').length,
      starred: allMockEmails.filter(email => email.isStarred).length,
      drafts: allMockEmails.filter(email => email.folder === 'drafts').length,
      trash: allMockEmails.filter(email => email.folder === 'trash').length
    };
  };

  const emailCounts = getEmailCounts();

  const handleFolderChange = (folder: 'inbox' | 'sent' | 'starred' | 'drafts' | 'trash') => {
    setCurrentFolder(folder);
    setCurrentView('emails');
    // 选择该文件夹的第一封邮件
    const folderEmails = getFilteredEmails();
    if (folderEmails.length > 0) {
      setSelectedEmail(folderEmails[0]);
    }
  };

  // 获取当前文件夹的标题
  const getCurrentFolderTitle = () => {
    switch (currentFolder) {
      case 'inbox': return '收件箱';
      case 'sent': return '已发送';
      case 'starred': return '已标星';
      case 'drafts': return '草稿箱';
      case 'trash': return '垃圾箱';
      default: return '收件箱';
    }
  };

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
          <NavItem 
            icon={InboxIcon} 
            label="收件箱" 
            count={emailCounts.inbox} 
            active={currentView === 'emails' && currentFolder === 'inbox'} 
            collapsed={sidebarCollapsed}
            onClick={() => handleFolderChange('inbox')}
          />
          <NavItem 
            icon={PaperAirplaneIcon} 
            label="已发送" 
            count={emailCounts.sent}
            active={currentView === 'emails' && currentFolder === 'sent'}
            collapsed={sidebarCollapsed}
            onClick={() => handleFolderChange('sent')}
          />
          <NavItem 
            icon={StarIcon} 
            label="已标星" 
            count={emailCounts.starred} 
            active={currentView === 'emails' && currentFolder === 'starred'}
            collapsed={sidebarCollapsed}
            onClick={() => handleFolderChange('starred')}
          />
          <NavItem 
            icon={DocumentTextIcon} 
            label="草稿箱" 
            count={emailCounts.drafts}
            active={currentView === 'emails' && currentFolder === 'drafts'}
            collapsed={sidebarCollapsed}
            onClick={() => handleFolderChange('drafts')}
          />
          <NavItem 
            icon={TrashIcon} 
            label="垃圾箱" 
            count={emailCounts.trash}
            active={currentView === 'emails' && currentFolder === 'trash'}
            collapsed={sidebarCollapsed}
            onClick={() => handleFolderChange('trash')}
          />
          
          {!sidebarCollapsed && (
            <>
              <div className="pt-4 pb-2">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  AI 助手
                </h3>
              </div>
              <NavItem 
                icon={ChartBarIcon} 
                label="智能管家" 
                collapsed={false}
                active={currentView === 'dashboard'}
                onClick={() => setCurrentView('dashboard')}
              />
              <NavItem 
                icon={BellIcon} 
                label="智能提醒" 
                collapsed={false}
                active={currentView === 'reminders'}
                onClick={() => setCurrentView('reminders')}
              />
            </>
          )}
          
          {!sidebarCollapsed && (
            <>
              <div className="pt-4 pb-2">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  设置
                </h3>
              </div>
              <NavItem 
                icon={WrenchScrewdriverIcon} 
                label="邮箱设置" 
                collapsed={false}
                active={currentView === 'settings'}
                onClick={() => setCurrentView('settings')}
              />
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
        {currentView === 'emails' ? (
          <>
            {/* 邮件列表 */}
            <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
              {/* 文件夹标题和账户切换器 */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-900">{getCurrentFolderTitle()}</h2>
                  <span className="text-sm text-gray-500">{filteredEmails.length} 封邮件</span>
                </div>
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
                {filteredEmails.length > 0 ? (
                  filteredEmails.map((email) => (
                    <EmailItem
                      key={email.id}
                      email={email}
                      isSelected={selectedEmail.id === email.id}
                      onClick={() => setSelectedEmail(email)}
                      folderType={currentFolder}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <EnvelopeIcon className="h-12 w-12 mb-4" />
                    <p className="text-lg font-medium">暂无邮件</p>
                    <p className="text-sm">{getCurrentFolderTitle()}中还没有邮件</p>
                  </div>
                )}
              </div>
            </div>

            {/* 邮件内容 */}
            <div className="flex-1 flex flex-col">
              {selectedEmail && <EmailContent email={selectedEmail} folderType={currentFolder} />}
            </div>
          </>
        ) : (
          <div className="flex-1">
            {currentView === 'dashboard' && <AIDashboardPage />}
            {currentView === 'settings' && <EmailSettingsPage />}
            {currentView === 'reminders' && <SmartRemindersPage />}
          </div>
        )}
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
  onClick?: () => void;
}> = ({ icon: Icon, label, count, active = false, collapsed, onClick }) => {
  return (
    <div
      onClick={onClick}
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
  folderType: string;
}> = ({ email, isSelected, onClick, folderType }) => {
  const getDisplayName = () => {
    if (folderType === 'sent' || folderType === 'drafts') {
      return email.recipient || '未指定收件人';
    }
    return email.sender;
  };

  const getDisplayLabel = () => {
    if (folderType === 'sent') return '发送至:';
    if (folderType === 'drafts') return '收件人:';
    return '来自:';
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
        isSelected ? 'bg-blue-50 border-blue-200' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className={`w-2 h-2 rounded-full mt-2 ${
          email.isRead ? 'bg-transparent' : 'bg-blue-500'
        }`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">{getDisplayLabel()}</p>
              <p className={`text-sm ${
                email.isRead ? 'text-gray-600' : 'text-gray-900 font-semibold'
              }`}>
                {getDisplayName()}
              </p>
            </div>
            <div className="flex items-center space-x-1">
              {email.isStarred && <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />}
              {folderType === 'drafts' && (
                <span className="text-xs text-orange-500 font-medium">[草稿]</span>
              )}
              <span className="text-xs text-gray-500">{email.time}</span>
            </div>
          </div>
          <p className={`text-sm mt-1 ${
            email.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'
          }`}>
            {email.subject}
          </p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {email.preview}
          </p>
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
              {email.account}
            </span>
            {folderType === 'trash' && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                已删除
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 邮件内容组件
const EmailContent: React.FC<{ email: any; folderType: string }> = ({ email, folderType }) => {
  const getEmailHeader = () => {
    if (folderType === 'sent' || folderType === 'drafts') {
      return {
        label: folderType === 'drafts' ? '收件人' : '发送到',
        value: email.recipient || '未指定收件人'
      };
    }
    return {
      label: '来自',
      value: email.sender
    };
  };

  const headerInfo = getEmailHeader();

  return (
    <div className="flex-1 flex flex-col">
      {/* 邮件头部 */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">{email.subject}</h1>
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
              <span>{headerInfo.label}: {headerInfo.value}</span>
              <span>账户: {email.account}</span>
              <span>时间: {email.time}</span>
              {folderType === 'drafts' && (
                <span className="text-orange-600 font-medium">[草稿]</span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {folderType === 'drafts' ? (
              <>
                <button className="p-2 text-gray-400 hover:text-blue-500" title="继续编辑">
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-500" title="删除草稿">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </>
            ) : folderType === 'trash' ? (
              <>
                <button className="p-2 text-gray-400 hover:text-green-500" title="恢复邮件">
                  <CheckCircleIcon className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-500" title="永久删除">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <button className="p-2 text-gray-400 hover:text-yellow-500" title="标记星标">
                  <StarIcon className={`h-5 w-5 ${email.isStarred ? 'text-yellow-400 fill-current' : ''}`} />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-500" title="删除">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 邮件内容 */}
      <div className="flex-1 p-6 bg-white overflow-y-auto">
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed">
            {email.preview}
          </p>
          {folderType !== 'drafts' && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* AI 助手建议 - 只在非草稿和非垃圾箱显示 */}
      {folderType !== 'drafts' && folderType !== 'trash' && (
        <div className="p-4 bg-blue-50 border-t border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🤖</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900">AI 助手建议</h4>
              <p className="text-sm text-blue-700 mt-1">
                {folderType === 'sent' 
                  ? '这封邮件已成功发送。您可以设置跟进提醒或查看回复状态。'
                  : '这封邮件看起来很重要，建议您及时回复。我为您准备了一些回复模板：'
                }
              </p>
              {folderType !== 'sent' && (
                <div className="mt-2 space-x-2">
                  <button className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
                    感谢确认
                  </button>
                  <button className="px-3 py-1 bg-white text-blue-500 text-xs rounded border border-blue-300 hover:bg-blue-50">
                    需要更多信息
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



// 智能提醒页面组件
const SmartRemindersPage: React.FC = () => {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [reminders, setReminders] = useState([
    {
      id: 1,
      name: '重要邮件截止时间提醒',
      type: 'deadline',
      status: 'active',
      triggerCondition: '邮件包含"截止"关键词',
      reminderTime: '前1天',
      lastTriggered: '2024-09-03 09:00',
      triggerCount: 5
    },
    {
      id: 2,
      name: '未读邮件24小时提醒',
      type: 'unread_24h',
      status: 'active', 
      triggerCondition: '邮件未读超过24小时',
      reminderTime: '每天 09:00',
      lastTriggered: '2024-09-04 09:00',
      triggerCount: 12
    },
    {
      id: 3,
      name: 'VIP邮件即时提醒',
      type: 'vip',
      status: 'inactive',
      triggerCondition: 'VIP联系人邮件',
      reminderTime: '立即',
      lastTriggered: '2024-09-02 14:30',
      triggerCount: 3
    }
  ]);

  const [newRule, setNewRule] = useState({
    name: '',
    type: 'deadline',
    triggerCondition: 'unread_24h',
    reminderTime: '09:00',
    frequency: 'once',
    days: 1,
    template: 'default',
    customMessage: '',
    enabled: true
  });

  const reminderTypes = [
    { value: 'deadline', label: '截止时间提醒', desc: '在邮件截止日期前提醒' },
    { value: 'unread_24h', label: '未读邮件提醒', desc: '邮件未读超过指定时间后提醒' },
    { value: 'follow_up', label: '跟进提醒', desc: '需要跟进的邮件提醒' },
    { value: 'priority', label: '优先级提醒', desc: '高优先级邮件立即提醒' },
    { value: 'custom', label: '自定义规则', desc: '基于自定义条件的智能提醒' }
  ];

  const triggerConditions = [
    { value: 'unread_24h', label: '未读超过24小时' },
    { value: 'unread_48h', label: '未读超过48小时' },
    { value: 'unread_week', label: '未读超过一周' },
    { value: 'keyword_deadline', label: '包含截止时间关键词' },
    { value: 'keyword_urgent', label: '包含紧急关键词' },
    { value: 'vip_sender', label: 'VIP发件人' },
    { value: 'high_priority', label: '高优先级邮件' },
    { value: 'no_reply_3days', label: '3天未回复' },
    { value: 'attachment_important', label: '包含重要附件' }
  ];

  const messageTemplates = [
    { 
      value: 'default', 
      label: '默认模板',
      content: '您有一封 {emailType} 邮件需要处理：来自 {sender}，主题：{subject}'
    },
    { 
      value: 'urgent', 
      label: '紧急模板',
      content: '🚨 紧急提醒：您有一封高优先级邮件需要立即处理！'
    },
    { 
      value: 'polite', 
      label: '礼貌模板',
      content: '温馨提醒：您有一封邮件等待处理，请在方便时查看。'
    },
    { 
      value: 'custom', 
      label: '自定义模板',
      content: ''
    }
  ];

  const handleCreateRule = () => {
    const rule = {
      id: Date.now(),
      name: newRule.name,
      type: newRule.type,
      status: newRule.enabled ? 'active' : 'inactive',
      triggerCondition: triggerConditions.find(c => c.value === newRule.triggerCondition)?.label || '',
      reminderTime: newRule.reminderTime,
      lastTriggered: '从未触发',
      triggerCount: 0
    };
    
    setReminders([...reminders, rule]);
    setShowConfigModal(false);
    setNewRule({
      name: '',
      type: 'deadline',
      triggerCondition: 'unread_24h',
      reminderTime: '09:00',
      frequency: 'once',
      days: 1,
      template: 'default',
      customMessage: '',
      enabled: true
    });
  };

  const handleEditRule = (rule: any) => {
    setEditingRule(rule);
    setNewRule({
      name: rule.name,
      type: rule.type,
      triggerCondition: 'unread_24h',
      reminderTime: '09:00',
      frequency: 'once',
      days: 1,
      template: 'default',
      customMessage: '',
      enabled: rule.status === 'active'
    });
    setShowConfigModal(true);
  };

  const handleToggleRule = (id: number) => {
    setReminders(reminders.map(rule => 
      rule.id === id 
        ? { ...rule, status: rule.status === 'active' ? 'inactive' : 'active' }
        : rule
    ));
  };

  const handleDeleteRule = (id: number) => {
    setReminders(reminders.filter(rule => rule.id !== id));
  };

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <BellIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">智能提醒</h1>
                <p className="text-gray-600">管理邮件提醒规则，让重要邮件不再错过</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              创建提醒规则
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BellIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">总规则数</p>
                <p className="text-2xl font-semibold text-gray-900">{reminders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">活跃规则</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {reminders.filter(r => r.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-orange-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">今日触发</p>
                <p className="text-2xl font-semibold text-gray-900">8</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">待处理提醒</p>
                <p className="text-2xl font-semibold text-gray-900">3</p>
              </div>
            </div>
          </div>
        </div>

        {/* 提醒规则列表 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">提醒规则</h3>
          </div>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    规则名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    触发条件
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    提醒时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    触发次数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reminders.map((rule) => (
                  <tr key={rule.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                      <div className="text-sm text-gray-500">{rule.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{rule.triggerCondition}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rule.reminderTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rule.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rule.status === 'active' ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rule.triggerCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditRule(rule)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={`${
                          rule.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {rule.status === 'active' ? '禁用' : '启用'}
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 配置模态框 */}
        {showConfigModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingRule ? '编辑提醒规则' : '创建提醒规则'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowConfigModal(false);
                      setEditingRule(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* 规则名称 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">规则名称</label>
                    <input
                      type="text"
                      value={newRule.name}
                      onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="请输入规则名称"
                    />
                  </div>

                  {/* 提醒类型 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">提醒类型</label>
                    <div className="mt-2 grid grid-cols-1 gap-3">
                      {reminderTypes.map((type) => (
                        <div key={type.value} className="relative">
                          <label className="flex items-start cursor-pointer">
                            <input
                              type="radio"
                              name="reminderType"
                              value={type.value}
                              checked={newRule.type === type.value}
                              onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
                              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{type.label}</div>
                              <div className="text-sm text-gray-500">{type.desc}</div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 触发条件 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">触发条件</label>
                    <select
                      value={newRule.triggerCondition}
                      onChange={(e) => setNewRule({ ...newRule, triggerCondition: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {triggerConditions.map((condition) => (
                        <option key={condition.value} value={condition.value}>
                          {condition.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 提醒时间设置 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">提醒时间</label>
                      <input
                        type="time"
                        value={newRule.reminderTime}
                        onChange={(e) => setNewRule({ ...newRule, reminderTime: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">提醒频率</label>
                      <select
                        value={newRule.frequency}
                        onChange={(e) => setNewRule({ ...newRule, frequency: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="once">仅一次</option>
                        <option value="daily">每天</option>
                        <option value="weekly">每周</option>
                        <option value="custom">自定义</option>
                      </select>
                    </div>
                  </div>

                  {/* 提前天数 */}
                  {newRule.type === 'deadline' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">提前天数</label>
                      <input
                        type="number"
                        value={newRule.days}
                        onChange={(e) => setNewRule({ ...newRule, days: parseInt(e.target.value) })}
                        min="1"
                        max="30"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}

                  {/* 消息模板 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">消息模板</label>
                    <div className="mt-2 space-y-3">
                      {messageTemplates.map((template) => (
                        <div key={template.value} className="relative">
                          <label className="flex items-start cursor-pointer">
                            <input
                              type="radio"
                              name="template"
                              value={template.value}
                              checked={newRule.template === template.value}
                              onChange={(e) => setNewRule({ ...newRule, template: e.target.value })}
                              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <div className="ml-3 flex-1">
                              <div className="text-sm font-medium text-gray-900">{template.label}</div>
                              {template.content && (
                                <div className="text-sm text-gray-500 mt-1 p-2 bg-gray-50 rounded">
                                  {template.content}
                                </div>
                              )}
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 自定义消息 */}
                  {newRule.template === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">自定义消息</label>
                      <textarea
                        value={newRule.customMessage}
                        onChange={(e) => setNewRule({ ...newRule, customMessage: e.target.value })}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="请输入自定义提醒消息..."
                      />
                    </div>
                  )}

                  {/* 启用状态 */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newRule.enabled}
                      onChange={(e) => setNewRule({ ...newRule, enabled: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      创建后立即启用此规则
                    </label>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowConfigModal(false);
                      setEditingRule(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleCreateRule}
                    disabled={!newRule.name.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingRule ? '保存修改' : '创建规则'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;