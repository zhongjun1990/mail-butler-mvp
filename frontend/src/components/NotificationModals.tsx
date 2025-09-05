import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
  NotificationConfig,
  NotificationPlatform,
  NotificationType,
  SupportedOptions,
  AddNotificationConfigRequest,
  UpdateNotificationConfigRequest
} from '../types/notification';

// 添加配置模态框
interface AddConfigModalProps {
  supportedOptions: SupportedOptions;
  onAdd: (config: AddNotificationConfigRequest) => Promise<void>;
  onClose: () => void;
}

export const AddConfigModal: React.FC<AddConfigModalProps> = ({
  supportedOptions,
  onAdd,
  onClose
}) => {
  const [formData, setFormData] = useState<AddNotificationConfigRequest>({
    platform: NotificationPlatform.DINGTALK,
    webhook: '',
    enabled: true,
    types: [NotificationType.NEW_EMAIL],
    filters: {
      keywords: [],
      senders: [],
      minPriority: 'medium',
      timeRange: {
        start: '09:00',
        end: '18:00'
      }
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onAdd(formData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addKeyword = () => {
    const keyword = prompt('请输入关键词:');
    if (keyword && keyword.trim()) {
      setFormData(prev => ({
        ...prev,
        filters: {
          ...prev.filters,
          keywords: [...(prev.filters?.keywords || []), keyword.trim()]
        }
      }));
    }
  };

  const removeKeyword = (index: number) => {
    setFormData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        keywords: prev.filters?.keywords?.filter((_, i) => i !== index) || []
      }
    }));
  };

  const addSender = () => {
    const sender = prompt('请输入发件人邮箱或关键词:');
    if (sender && sender.trim()) {
      setFormData(prev => ({
        ...prev,
        filters: {
          ...prev.filters,
          senders: [...(prev.filters?.senders || []), sender.trim()]
        }
      }));
    }
  };

  const removeSender = (index: number) => {
    setFormData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        senders: prev.filters?.senders?.filter((_, i) => i !== index) || []
      }
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">添加通知配置</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* 平台选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    通知平台 *
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value as NotificationPlatform }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {supportedOptions.platforms.map(platform => (
                      <option key={platform.value} value={platform.value}>
                        {platform.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Webhook URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook URL *
                  </label>
                  <input
                    type="url"
                    value={formData.webhook}
                    onChange={(e) => setFormData(prev => ({ ...prev, webhook: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                    required
                  />
                </div>

                {/* 通知类型 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    通知类型 *
                  </label>
                  <div className="space-y-2">
                    {supportedOptions.types.map(type => (
                      <label key={type.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.types.includes(type.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                types: [...prev.types, type.value]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                types: prev.types.filter(t => t !== type.value)
                              }));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 过滤条件 */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">过滤条件（可选）</h4>

                  {/* 关键词过滤 */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-600">关键词过滤</label>
                      <button
                        type="button"
                        onClick={addKeyword}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        <PlusIcon className="h-4 w-4 inline mr-1" />
                        添加
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.filters?.keywords?.map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-gray-100 text-sm rounded"
                        >
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeKeyword(index)}
                            className="ml-1 text-gray-400 hover:text-red-600"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 发件人过滤 */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-600">发件人过滤</label>
                      <button
                        type="button"
                        onClick={addSender}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        <PlusIcon className="h-4 w-4 inline mr-1" />
                        添加
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.filters?.senders?.map((sender, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-gray-100 text-sm rounded"
                        >
                          {sender}
                          <button
                            type="button"
                            onClick={() => removeSender(index)}
                            className="ml-1 text-gray-400 hover:text-red-600"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 优先级过滤 */}
                  <div className="mb-3">
                    <label className="block text-sm text-gray-600 mb-2">最低优先级</label>
                    <select
                      value={formData.filters?.minPriority || 'medium'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        filters: {
                          ...prev.filters,
                          minPriority: e.target.value as 'low' | 'medium' | 'high'
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">低</option>
                      <option value="medium">中</option>
                      <option value="high">高</option>
                    </select>
                  </div>

                  {/* 时间范围 */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">通知时间范围</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={formData.filters?.timeRange?.start || '09:00'}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          filters: {
                            ...prev.filters,
                            timeRange: {
                              ...prev.filters?.timeRange,
                              start: e.target.value,
                              end: prev.filters?.timeRange?.end || '18:00'
                            }
                          }
                        }))}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="time"
                        value={formData.filters?.timeRange?.end || '18:00'}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          filters: {
                            ...prev.filters,
                            timeRange: {
                              ...prev.filters?.timeRange,
                              start: prev.filters?.timeRange?.start || '09:00',
                              end: e.target.value
                            }
                          }
                        }))}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting || formData.types.length === 0}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? '添加中...' : '添加配置'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// 编辑配置模态框
interface EditConfigModalProps {
  config: NotificationConfig;
  supportedOptions: SupportedOptions;
  onUpdate: (configId: string, updates: UpdateNotificationConfigRequest) => Promise<void>;
  onClose: () => void;
}

export const EditConfigModal: React.FC<EditConfigModalProps> = ({
  config,
  supportedOptions,
  onUpdate,
  onClose
}) => {
  const [formData, setFormData] = useState<UpdateNotificationConfigRequest>({
    enabled: config.enabled,
    types: [...config.types],
    filters: config.filters ? { ...config.filters } : {}
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (config.id) {
        await onUpdate(config.id, formData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addKeyword = () => {
    const keyword = prompt('请输入关键词:');
    if (keyword && keyword.trim()) {
      setFormData(prev => ({
        ...prev,
        filters: {
          ...prev.filters,
          keywords: [...(prev.filters?.keywords || []), keyword.trim()]
        }
      }));
    }
  };

  const removeKeyword = (index: number) => {
    setFormData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        keywords: prev.filters?.keywords?.filter((_, i) => i !== index) || []
      }
    }));
  };

  const addSender = () => {
    const sender = prompt('请输入发件人邮箱或关键词:');
    if (sender && sender.trim()) {
      setFormData(prev => ({
        ...prev,
        filters: {
          ...prev.filters,
          senders: [...(prev.filters?.senders || []), sender.trim()]
        }
      }));
    }
  };

  const removeSender = (index: number) => {
    setFormData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        senders: prev.filters?.senders?.filter((_, i) => i !== index) || []
      }
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">编辑通知配置</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* 平台信息（只读） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    通知平台
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600">
                    {supportedOptions.platforms.find(p => p.value === config.platform)?.label}
                  </div>
                </div>

                {/* 启用状态 */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">启用此配置</span>
                  </label>
                </div>

                {/* 通知类型 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    通知类型 *
                  </label>
                  <div className="space-y-2">
                    {supportedOptions.types.map(type => (
                      <label key={type.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.types?.includes(type.value) || false}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                types: [...(prev.types || []), type.value]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                types: (prev.types || []).filter(t => t !== type.value)
                              }));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 过滤条件 */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">过滤条件</h4>

                  {/* 关键词过滤 */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-600">关键词过滤</label>
                      <button
                        type="button"
                        onClick={addKeyword}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        <PlusIcon className="h-4 w-4 inline mr-1" />
                        添加
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.filters?.keywords?.map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-gray-100 text-sm rounded"
                        >
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeKeyword(index)}
                            className="ml-1 text-gray-400 hover:text-red-600"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 发件人过滤 */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-600">发件人过滤</label>
                      <button
                        type="button"
                        onClick={addSender}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        <PlusIcon className="h-4 w-4 inline mr-1" />
                        添加
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.filters?.senders?.map((sender, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-gray-100 text-sm rounded"
                        >
                          {sender}
                          <button
                            type="button"
                            onClick={() => removeSender(index)}
                            className="ml-1 text-gray-400 hover:text-red-600"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 优先级过滤 */}
                  <div className="mb-3">
                    <label className="block text-sm text-gray-600 mb-2">最低优先级</label>
                    <select
                      value={formData.filters?.minPriority || 'medium'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        filters: {
                          ...prev.filters,
                          minPriority: e.target.value as 'low' | 'medium' | 'high'
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">低</option>
                      <option value="medium">中</option>
                      <option value="high">高</option>
                    </select>
                  </div>

                  {/* 时间范围 */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">通知时间范围</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={formData.filters?.timeRange?.start || '09:00'}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          filters: {
                            ...prev.filters,
                            timeRange: {
                              ...prev.filters?.timeRange,
                              start: e.target.value,
                              end: prev.filters?.timeRange?.end || '18:00'
                            }
                          }
                        }))}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="time"
                        value={formData.filters?.timeRange?.end || '18:00'}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          filters: {
                            ...prev.filters,
                            timeRange: {
                              ...prev.filters?.timeRange,
                              start: prev.filters?.timeRange?.start || '09:00',
                              end: e.target.value
                            }
                          }
                        }))}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting || !formData.types || formData.types.length === 0}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? '保存中...' : '保存更改'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};