import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BellIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface EmailStats {
  totalEmails: number;
  unreadEmails: number;
  readEmails: number;
  repliedEmails: number;
  todayEmails: number;
  weeklyChange: number;
  avgResponseTime: number; // 小时
  categories: {
    [key: string]: number;
  };
  priorities: {
    high: number;
    medium: number;
    low: number;
  };
  timeStats: {
    labels: string[];
    data: number[];
  };
}

interface AnalysisCard {
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  action?: string;
}

const AIDashboardPage: React.FC = () => {
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  
  const [stats, setStats] = useState<EmailStats>({
    totalEmails: 1247,
    unreadEmails: 23,
    readEmails: 1224,
    repliedEmails: 856,
    todayEmails: 15,
    weeklyChange: 12.5,
    avgResponseTime: 4.2,
    categories: {
      '工作': 567,
      '个人': 234,
      '通知': 189,
      '营销': 156,
      '垃圾邮件': 101
    },
    priorities: {
      high: 8,
      medium: 32,
      low: 67
    },
    timeStats: {
      labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      data: [25, 32, 18, 24, 41, 15, 8]
    }
  });

  const [analysisCards, setAnalysisCards] = useState<AnalysisCard[]>([
    {
      title: '重要邮件待处理',
      description: '您有 3 封标记为高优先级的邮件超过 24 小时未回复',
      type: 'urgent',
      action: '立即处理'
    },
    {
      title: '回复效率提升',
      description: '本周平均回复时间比上周缩短了 1.5 小时，表现优秀！',
      type: 'success'
    },
    {
      title: '营销邮件增多',
      description: '检测到营销邮件数量增加 35%，建议优化过滤规则',
      type: 'warning',
      action: '设置过滤器'
    },
    {
      title: '工作邮件集中',
      description: '周三和周五是工作邮件的高峰期，建议合理安排时间',
      type: 'info'
    }
  ]);

  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ai/dashboard?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setAnalysisCards(data.analysis);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // AI对话处理函数
  const handleAskQuestion = async () => {
    if (!currentQuestion.trim() || isAsking) return;
    
    setIsAsking(true);
    setShowChat(true);
    
    // 添加用户消息
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentQuestion,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    
    try {
      // 模拟AI回复（实际项目中调用AI API）
      setTimeout(() => {
        const aiResponse = generateAIResponse(currentQuestion);
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: aiResponse,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiMessage]);
        setIsAsking(false);
      }, 1500);
      
    } catch (error) {
      console.error('AI回复失败:', error);
      setIsAsking(false);
    }
    
    setCurrentQuestion('');
  };

  // 生成AI回复（模拟）
  const generateAIResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('未读') || lowerQuestion.includes('unread')) {
      return `您目前有 ${stats.unreadEmails} 封未读邮件。其中包含 ${stats.priorities.high} 封高优先级邮件需要优先处理。建议您先查看来自重要发件人的邮件。`;
    }
    
    if (lowerQuestion.includes('统计') || lowerQuestion.includes('数据')) {
      return `根据最新统计，您总共有 ${stats.totalEmails} 封邮件，已回复 ${stats.repliedEmails} 封（回复率 ${((stats.repliedEmails / stats.readEmails) * 100).toFixed(1)}%）。平均回复时间为 ${stats.avgResponseTime.toFixed(1)} 小时。`;
    }
    
    if (lowerQuestion.includes('建议') || lowerQuestion.includes('优化')) {
      return '基于您的邮件使用情况，我建议：1) 设置自动回复模板提高效率；2) 使用智能分类减少整理时间；3) 启用重要邮件提醒功能。需要我帮您配置这些功能吗？';
    }
    
    if (lowerQuestion.includes('工作') || lowerQuestion.includes('效率')) {
      return `您的工作邮件占总邮件的 ${((stats.categories['工作'] / stats.totalEmails) * 100).toFixed(1)}%。工作日邮件处理效率较高，建议继续保持规律的邮件处理时间。`;
    }
    
    return '我是您的邮箱智能助手。我可以帮您分析邮件统计、提供处理建议、设置提醒规则等。您可以问我关于邮件管理、统计分析或效率优化的任何问题。';
  };

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <ExclamationCircleIcon className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <BellIcon className="h-6 w-6 text-yellow-500" />;
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      default:
        return <ChartBarIcon className="h-6 w-6 text-blue-500" />;
    }
  };

  const getCardBorderColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('zh-CN');
  };

  const calculatePercentage = (value: number, total: number) => {
    return ((value / total) * 100).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 主内容区域 */}
        <div className="w-full">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">智能管家驾驶舱</h1>
                <p className="text-gray-600">邮件统计分析和智能洞察</p>
              </div>
            </div>
            
            {/* 时间范围选择器 */}
            <div className="flex items-center space-x-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="week">最近一周</option>
                <option value="month">最近一月</option>
                <option value="quarter">最近三月</option>
              </select>
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '刷新中...' : '刷新'}
              </button>
            </div>
          </div>
          
          {/* AI对话框 */}
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                  placeholder="问我任何关于您邮箱的问题..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={isAsking}
                />
              </div>
              <button
                onClick={handleAskQuestion}
                disabled={!currentQuestion.trim() || isAsking}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                <span>{isAsking ? '思考中...' : '发送'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 核心指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <EnvelopeIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      总邮件数
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {formatNumber(stats.totalEmails)}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm">
                        {stats.weeklyChange > 0 ? (
                          <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`ml-1 ${stats.weeklyChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {Math.abs(stats.weeklyChange)}%
                        </span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationCircleIcon className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      未读邮件
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {formatNumber(stats.unreadEmails)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      已回复
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {formatNumber(stats.repliedEmails)}
                      </div>
                      <div className="ml-2 text-sm text-gray-500">
                        ({calculatePercentage(stats.repliedEmails, stats.readEmails)}%)
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-purple-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      平均响应时间
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.avgResponseTime.toFixed(1)}h
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 智能分析卡片 */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">智能分析</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysisCards.map((card, index) => (
              <div
                key={index}
                className={`border-l-4 p-4 rounded-r-lg ${getCardBorderColor(card.type)}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {getCardIcon(card.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-700 mt-1">
                      {card.description}
                    </p>
                    {card.action && (
                      <button className="text-sm text-blue-600 hover:text-blue-800 mt-2">
                        {card.action} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 邮件分类统计 */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">邮件分类</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(stats.categories).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                      <span className="text-sm text-gray-700">{category}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatNumber(count)}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({calculatePercentage(count, stats.totalEmails)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 优先级分布 */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">优先级分布</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-3"></div>
                    <span className="text-sm text-gray-700">高优先级</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {stats.priorities.high}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({calculatePercentage(stats.priorities.high, stats.unreadEmails)}%)
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-3"></div>
                    <span className="text-sm text-gray-700">中优先级</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {stats.priorities.medium}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({calculatePercentage(stats.priorities.medium, stats.unreadEmails)}%)
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                    <span className="text-sm text-gray-700">低优先级</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {stats.priorities.low}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({calculatePercentage(stats.priorities.low, stats.unreadEmails)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 邮件趋势图 */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">邮件趋势</h3>
          </div>
          <div className="p-6">
            <div className="h-64 flex items-end justify-between space-x-2">
              {stats.timeStats.data.map((value, index) => {
                const maxValue = Math.max(...stats.timeStats.data);
                const height = (value / maxValue) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-500 rounded-t-sm flex items-end justify-center text-white text-xs pb-1"
                      style={{ height: `${Math.max(height, 10)}%` }}
                    >
                      {value > 0 && value}
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      {stats.timeStats.labels[index]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">快捷操作</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                <StarIcon className="h-4 w-4 mr-2" />
                处理重要邮件
              </button>
              <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                <BellIcon className="h-4 w-4 mr-2" />
                设置智能提醒
              </button>
              <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                <ChartBarIcon className="h-4 w-4 mr-2" />
                导出报告
              </button>
              <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                批量操作
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
        
      {/* AI聊天悬浮窗 */}
      {showChat && (
        <div className="fixed inset-0 z-50">
          {/* 背景遮罩 */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-20" 
            onClick={() => setShowChat(false)}
          ></div>
          
          {/* 聊天窗口 */}
          <div className={`absolute top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
            showChat ? 'translate-x-0' : 'translate-x-full'
          } flex flex-col`}>
            {/* 聊天标题 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
              <div className="flex items-center space-x-2">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                <h3 className="text-lg font-semibold text-white">AI 智能助手</h3>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="p-1 text-white hover:text-gray-200 rounded transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* 聊天消息区域 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {chatMessages.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-700 mb-2">欢迎使用AI助手</h4>
                  <p className="text-sm text-gray-500">我可以帮您分析邮箱数据、提供管理建议</p>
                  <p className="text-sm text-gray-400 mt-1">问一些关于您邮箱的问题吧！</p>
                </div>
              )}
              
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs px-4 py-3 rounded-2xl shadow-sm ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === 'ai' && (
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">🤖</span>
                          </div>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className={`text-xs mt-2 ${
                          message.type === 'user' ? 'text-blue-100' : 'text-gray-400'
                        }`}>
                          {message.timestamp.toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {message.type === 'user' && (
                        <div className="flex-shrink-0 mt-1">
                          <UserIcon className="w-5 h-5 text-blue-100" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* 加载状态 */}
              {isAsking && (
                <div className="flex justify-start">
                  <div className="max-w-xs px-4 py-3 rounded-2xl rounded-bl-md bg-white text-gray-900 border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-sm text-gray-600">AI正在思考...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* 聊天输入框 */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                  placeholder="继续问问题..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
                  disabled={isAsking}
                />
                <button
                  onClick={handleAskQuestion}
                  disabled={!currentQuestion.trim() || isAsking}
                  className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIDashboardPage;