import React from 'react';

const LoginPage: React.FC = () => {
  const handleGoogleLogin = () => {
    // 重定向到后端的Google OAuth登录
    window.location.href = 'http://localhost:8000/api/auth/google';
  };

  const handleDemoLogin = () => {
    // 演示登录，直接生成一个模拟 token
    const demoToken = 'demo-token-' + Date.now();
    localStorage.setItem('auth_token', demoToken);
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-blue-100">
            <span className="text-4xl">📧</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登录邮箱管家
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            智能AI邮件管理平台
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {/* 演示登录按钮 */}
          <button
            onClick={handleDemoLogin}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <span className="text-lg">🚀</span>
            </span>
            体验演示版 (无需认证)
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">或</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </span>
            使用 Google 账号登录
          </button>

          <button
            disabled
            className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-500 bg-gray-100 cursor-not-allowed"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M23.8 12.3v-.2c0-.5 0-1.1-.1-1.6H12.2v3h6.6c-.3 1.6-1.2 2.9-2.5 3.8v3.1h4c2.4-2.2 3.8-5.4 3.8-9.1z"
                />
                <path
                  fill="currentColor"
                  d="M12.2 24c3.2 0 5.9-1.1 7.9-2.9l-4-3.1c-1.1.7-2.5 1.2-3.9 1.2-3 0-5.5-2-6.4-4.7H1.7v3.1c2 4 6.1 6.4 10.5 6.4z"
                />
                <path
                  fill="currentColor"
                  d="M5.8 14.5c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V7H1.7c-.8 1.5-1.2 3.2-1.2 5s.4 3.5 1.2 5l4.1-2.5z"
                />
                <path
                  fill="currentColor"
                  d="M12.2 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.9 1.2 15.2 0 12.2 0 7.8 0 3.7 2.4 1.7 6l4.1 3.2c.9-2.7 3.4-4.4 6.4-4.4z"
                />
              </svg>
            </span>
            使用 Microsoft 账号登录 (即将支持)
          </button>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              登录即表示您同意我们的
              <a href="#" className="text-blue-600 hover:text-blue-500">
                服务条款
              </a>
              和
              <a href="#" className="text-blue-600 hover:text-blue-500">
                隐私政策
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;