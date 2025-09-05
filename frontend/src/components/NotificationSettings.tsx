import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  BellIcon,
  TrashIcon,
  PencilIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import NotificationService from '../services/notificationService';
import {
  NotificationConfig,
  NotificationPlatform,
  NotificationType,
  SupportedOptions,
  NotificationStats,
  AddNotificationConfigRequest,
  UpdateNotificationConfigRequest
} from '../types/notification';
import { AddConfigModal, EditConfigModal } from './NotificationModals';

interface NotificationSettingsProps {
  onClose?: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'configs' | 'stats' | 'history'>('configs');
  const [configs, setConfigs] = useState<NotificationConfig[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [supportedOptions, setSupportedOptions] = useState<SupportedOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<NotificationConfig | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (activeTab === 'configs') {
        const [configsData, optionsData] = await Promise.all([
          NotificationService.getNotificationConfigs(),
          NotificationService.getSupportedOptions()
        ]);
        setConfigs(configsData);
        setSupportedOptions(optionsData);
      } else if (activeTab === 'stats') {
        const statsData = await NotificationService.getNotificationStats();
        setStats(statsData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddConfig = async (config: AddNotificationConfigRequest) => {
    try {
      await NotificationService.addNotificationConfig(config);
      await loadData();
      setShowAddModal(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateConfig = async (configId: string, updates: UpdateNotificationConfigRequest) => {
    try {
      await NotificationService.updateNotificationConfig(configId, updates);
      await loadData();
      setEditingConfig(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    if (!confirm('确认删除此通知配置？')) return;
    
    try {
      await NotificationService.deleteNotificationConfig(configId);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTestConfig = async (platform: NotificationPlatform, webhook: string) => {
    try {
      await NotificationService.testNotificationConfig({ platform, webhook });
      alert('测试通知发送成功！');
    } catch (err: any) {
      alert(`测试失败：${err.message}`);
    }
  };

  const getPlatformIcon = (platform: NotificationPlatform) => {
    switch (platform) {
      case NotificationPlatform.DINGTALK:
        return '💬';
      case NotificationPlatform.FEISHU:
        return '🐦';
      case NotificationPlatform.WECHAT:
        return '💚';
      default:
        return '📱';
    }
  };

  const getPlatformName = (platform: NotificationPlatform) => {
    switch (platform) {
      case NotificationPlatform.DINGTALK:
        return '钉钉';
      case NotificationPlatform.FEISHU:
        return '飞书';
      case NotificationPlatform.WECHAT:
        return '微信企业号';
      default:
        return platform;
    }
  };

  const getTypeName = (type: NotificationType) => {
    const typeNames = {
      [NotificationType.NEW_EMAIL]: '新邮件通知',
      [NotificationType.IMPORTANT_EMAIL]: '重要邮件通知',
      [NotificationType.AI_SUMMARY]: 'AI摘要通知',
      [NotificationType.DAILY_DIGEST]: '每日摘要',
      [NotificationType.CUSTOM]: '自定义通知'
    };
    return typeNames[type] || type;
  };

  return (
    <div className="bg-white rounded-lg shadow-xl">
      {/* 头部 */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
          <BellIcon className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">通知设置</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* 标签页 */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('configs')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'configs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <CogIcon className="h-4 w-4 inline mr-2" />
            通知配置
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ChartBarIcon className="h-4 w-4 inline mr-2" />
            统计数据
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ClockIcon className="h-4 w-4 inline mr-2" />
            通知历史
          </button>
        </nav>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 内容区域 */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'configs' && (
              <ConfigsTab
                configs={configs}
                supportedOptions={supportedOptions}
                onAdd={() => setShowAddModal(true)}
                onEdit={setEditingConfig}
                onDelete={handleDeleteConfig}
                onTest={handleTestConfig}
                getPlatformIcon={getPlatformIcon}
                getPlatformName={getPlatformName}
                getTypeName={getTypeName}
              />
            )}

            {activeTab === 'stats' && stats && (
              <StatsTab
                stats={stats}
                getPlatformName={getPlatformName}
                getTypeName={getTypeName}
              />
            )}

            {activeTab === 'history' && (
              <HistoryTab
                getPlatformIcon={getPlatformIcon}
                getPlatformName={getPlatformName}
                getTypeName={getTypeName}
              />
            )}
          </>
        )}
      </div>

      {/* 添加配置模态框 */}
      {showAddModal && supportedOptions && (
        <AddConfigModal
          supportedOptions={supportedOptions}
          onAdd={handleAddConfig}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* 编辑配置模态框 */}
      {editingConfig && supportedOptions && (
        <EditConfigModal
          config={editingConfig}
          supportedOptions={supportedOptions}
          onUpdate={handleUpdateConfig}
          onClose={() => setEditingConfig(null)}
        />
      )}
    </div>
  );
};

// 配置标签页组件
const ConfigsTab: React.FC<{
  configs: NotificationConfig[];
  supportedOptions: SupportedOptions | null;
  onAdd: () => void;
  onEdit: (config: NotificationConfig) => void;
  onDelete: (configId: string) => void;
  onTest: (platform: NotificationPlatform, webhook: string) => void;
  getPlatformIcon: (platform: NotificationPlatform) => string;
  getPlatformName: (platform: NotificationPlatform) => string;
  getTypeName: (type: NotificationType) => string;
}> = ({ configs, onAdd, onEdit, onDelete, onTest, getPlatformIcon, getPlatformName, getTypeName }) => {
  return (
    <div>
      {/* 添加按钮 */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">通知配置列表</h3>
        <button
          onClick={onAdd}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          添加配置
        </button>
      </div>

      {/* 配置列表 */}
      {configs.length === 0 ? (
        <div className="text-center py-12">
          <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">暂无通知配置</h3>
          <p className="mt-1 text-sm text-gray-500">开始添加第一个通知配置</p>
          <div className="mt-6">
            <button
              onClick={onAdd}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              添加配置
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {configs.map((config) => (
            <div
              key={config.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getPlatformIcon(config.platform)}</span>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {getPlatformName(config.platform)}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {config.types.map(type => getTypeName(type)).join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      config.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {config.enabled ? '启用' : '禁用'}
                  </span>
                  <button
                    onClick={() => onTest(config.platform, config.webhook)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="测试通知"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onEdit(config)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="编辑配置"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => config.id && onDelete(config.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="删除配置"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {config.filters && Object.keys(config.filters).length > 0 && (
                <div className="mt-3 text-xs text-gray-500">
                  <span className="font-medium">过滤条件:</span>
                  {config.filters.keywords && (
                    <span className="ml-2">关键词: {config.filters.keywords.join(', ')}</span>
                  )}
                  {config.filters.senders && (
                    <span className="ml-2">发件人: {config.filters.senders.join(', ')}</span>
                  )}
                  {config.filters.minPriority && (
                    <span className="ml-2">最低优先级: {config.filters.minPriority}</span>
                  )}
                  {config.filters.timeRange && (
                    <span className="ml-2">
                      时间范围: {config.filters.timeRange.start} - {config.filters.timeRange.end}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 统计标签页组件
const StatsTab: React.FC<{
  stats: NotificationStats;
  getPlatformName: (platform: NotificationPlatform) => string;
  getTypeName: (type: NotificationType) => string;
}> = ({ stats, getPlatformName, getTypeName }) => {
  return (
    <div className="space-y-6">
      {/* 总览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-blue-800">总通知数</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
          <div className="text-sm text-green-800">成功发送</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{stats.failureRate}%</div>
          <div className="text-sm text-red-800">失败率</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{stats.activeConfigs}</div>
          <div className="text-sm text-purple-800">活跃配置</div>
        </div>
      </div>

      {/* 平台统计 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-lg font-medium text-gray-900 mb-4">平台统计</h4>
        <div className="space-y-2">
          {stats.platformStats.map((stat) => (
            <div key={stat.platform} className="flex justify-between items-center">
              <span className="text-sm text-gray-700">
                {getPlatformName(stat.platform as NotificationPlatform)}
              </span>
              <div className="text-sm">
                <span className="text-green-600">{stat.successful}</span>
                <span className="text-gray-500"> / </span>
                <span className="text-gray-700">{stat.total}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 类型统计 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-lg font-medium text-gray-900 mb-4">类型统计</h4>
        <div className="space-y-2">
          {stats.typeStats.map((stat) => (
            <div key={stat.type} className="flex justify-between items-center">
              <span className="text-sm text-gray-700">
                {getTypeName(stat.type as NotificationType)}
              </span>
              <span className="text-sm text-gray-700">{stat.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 历史标签页组件
const HistoryTab: React.FC<{
  getPlatformIcon: (platform: NotificationPlatform) => string;
  getPlatformName: (platform: NotificationPlatform) => string;
  getTypeName: (type: NotificationType) => string;
}> = ({ getPlatformIcon, getPlatformName, getTypeName }) => {
  // 这里可以添加历史记录的实现
  return (
    <div className="text-center py-12">
      <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">通知历史</h3>
      <p className="mt-1 text-sm text-gray-500">功能开发中...</p>
    </div>
  );
};

// 这里需要添加 AddConfigModal 和 EditConfigModal 组件
// 由于代码较长，我将在下一个文件中创建这些模态框组件

export default NotificationSettings;