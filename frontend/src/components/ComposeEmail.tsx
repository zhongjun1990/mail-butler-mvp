import React, { useState, useEffect } from 'react';
import { PaperClipIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { emailService } from '../services/emailService';
import { EmailAccount } from '../types/email';

interface AttachmentData {
  file: File;
  name: string;
  size: number;
}

interface ComposeEmailProps {
  isOpen: boolean;
  onClose: () => void;
  replyTo?: {
    id: string;
    subject: string;
    sender: string;
  };
}

export default function ComposeEmail({ isOpen, onClose, replyTo }: ComposeEmailProps) {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<AttachmentData[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isUsingHtml, setIsUsingHtml] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingAISuggestion, setIsLoadingAISuggestion] = useState(false);

  // 获取用户邮箱账户
  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
      
      // 如果是回复邮件，预填充内容
      if (replyTo) {
        setTo(replyTo.sender);
        setSubject(replyTo.subject.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`);
      }
    }
  }, [isOpen, replyTo]);

  const fetchAccounts = async () => {
    try {
      const accountsData = await emailService.getAccounts();
      setAccounts(accountsData);
      if (accountsData.length > 0 && !selectedAccount) {
        setSelectedAccount(accountsData[0].id);
      }
    } catch (error) {
      console.error('获取邮箱账户失败:', error);
      alert('获取邮箱账户失败，请刷新页面重试');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newAttachments: AttachmentData[] = Array.from(files).map((file: File) => ({
        file,
        name: file.name,
        size: file.size
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const generateAISuggestion = async () => {
    if (!content.trim()) {
      alert('请先输入一些邮件内容，AI将帮助您完善。');
      return;
    }

    setIsLoadingAISuggestion(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: `请帮我完善这封邮件的内容，使其更加专业和完整。当前内容：${content}`,
          context: {
            subject: subject,
            recipient: to
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setContent(data.response);
      } else {
        alert('AI建议生成失败，请稍后重试。');
      }
    } catch (error) {
      console.error('生成AI建议失败:', error);
      alert('AI建议生成失败，请稍后重试。');
    } finally {
      setIsLoadingAISuggestion(false);
    }
  };

  const sendEmail = async () => {
    if (!selectedAccount || !to.trim() || !subject.trim() || !content.trim()) {
      alert('请填写必需字段：发件账户、收件人、主题和内容');
      return;
    }

    setIsSending(true);
    try {
      // 准备附件数据
      const attachmentData = await Promise.all(
        attachments.map(async (att) => {
          return new Promise<any>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                filename: att.name,
                content: reader.result,
                contentType: att.file.type
              });
            };
            reader.readAsDataURL(att.file);
          });
        })
      );

      const emailData = {
        accountId: selectedAccount,
        to: to.split(',').map(email => email.trim()).filter(email => email),
        cc: showCc && cc ? cc.split(',').map(email => email.trim()).filter(email => email) : undefined,
        bcc: showBcc && bcc ? bcc.split(',').map(email => email.trim()).filter(email => email) : undefined,
        subject,
        [isUsingHtml ? 'html' : 'text']: content,
        attachments: attachmentData.length > 0 ? attachmentData : undefined
      };

      await emailService.sendEmail(emailData);
      
      alert('邮件发送成功！');
      onClose();
      // 重置表单
      resetForm();
    } catch (error: any) {
      console.error('发送邮件失败:', error);
      alert(`发送失败: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setTo('');
    setCc('');
    setBcc('');
    setSubject('');
    setContent('');
    setAttachments([]);
    setShowCc(false);
    setShowBcc(false);
    setIsUsingHtml(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {replyTo ? '回复邮件' : '撰写邮件'}
          </h2>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">关闭</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* 发件账户选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              发件账户
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">选择发件账户</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.email})
                </option>
              ))}
            </select>
          </div>

          {/* 收件人 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              收件人 *
            </label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="mt-1 flex space-x-4">
              <button
                onClick={() => setShowCc(!showCc)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showCc ? '隐藏抄送' : '添加抄送'}
              </button>
              <button
                onClick={() => setShowBcc(!showBcc)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showBcc ? '隐藏密送' : '添加密送'}
              </button>
            </div>
          </div>

          {/* 抄送 */}
          {showCc && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                抄送 (CC)
              </label>
              <input
                type="email"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* 密送 */}
          {showBcc && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密送 (BCC)
              </label>
              <input
                type="email"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="bcc@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* 主题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              主题 *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="邮件主题"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 内容编辑工具栏 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isUsingHtml}
                  onChange={(e) => setIsUsingHtml(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">HTML格式</span>
              </label>
            </div>
            <button
              onClick={generateAISuggestion}
              disabled={isLoadingAISuggestion}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <SparklesIcon className="h-4 w-4 mr-1" />
              {isLoadingAISuggestion ? 'AI优化中...' : 'AI优化内容'}
            </button>
          </div>

          {/* 邮件内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮件内容 *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入邮件内容..."
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* 附件 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                附件
              </label>
              <label className="cursor-pointer inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <PaperClipIcon className="h-4 w-4 mr-1" />
                添加附件
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded-md">
                    <div className="flex items-center">
                      <PaperClipIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-700">{attachment.name}</span>
                      <span className="text-sm text-gray-400 ml-2">({formatFileSize(attachment.size)})</span>
                    </div>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            * 为必填项
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              取消
            </button>
            <button
              onClick={sendEmail}
              disabled={isSending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSending ? '发送中...' : '发送'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}