import React, { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const mockAccounts = [
  {
    id: 1,
    email: 'work@company.com',
    name: '工作邮箱',
    provider: 'google',
    unreadCount: 5,
    isActive: true
  },
  {
    id: 2,
    email: 'personal@gmail.com',
    name: '个人邮箱',
    provider: 'google',
    unreadCount: 2,
    isActive: false
  },
  {
    id: 3,
    email: 'dev@example.com',
    name: '开发邮箱',
    provider: 'microsoft',
    unreadCount: 0,
    isActive: false
  }
];

const AccountSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAccount, setActiveAccount] = useState(mockAccounts[0]);

  const handleAccountSwitch = (account: typeof mockAccounts[0]) => {
    setActiveAccount(account);
    setIsOpen(false);
    // 这里可以添加切换账户的逻辑
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full p-3 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {activeAccount.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {activeAccount.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {activeAccount.email}
              </p>
            </div>
            {activeAccount.unreadCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                {activeAccount.unreadCount}
              </span>
            )}
          </div>
        </div>
        <ChevronDownIcon 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="py-1">
              {mockAccounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => handleAccountSwitch(account)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 ${
                    account.id === activeAccount.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    account.provider === 'google' ? 'bg-red-500' : 'bg-blue-500'
                  }`}>
                    <span className="text-white text-xs font-medium">
                      {account.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {account.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {account.email}
                    </p>
                  </div>
                  {account.unreadCount > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
                      {account.unreadCount}
                    </span>
                  )}
                </button>
              ))}
              
              <div className="border-t border-gray-200 my-1" />
              
              <button className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-blue-600">
                <div className="w-6 h-6 rounded-full border-2 border-dashed border-blue-300 flex items-center justify-center">
                  <span className="text-blue-500 text-lg">+</span>
                </div>
                <span className="text-sm font-medium">添加新邮箱账户</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountSwitcher;