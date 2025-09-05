import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 从URL参数中获取token
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      // 保存token到localStorage
      localStorage.setItem('token', token);
      // 重定向到主页面
      navigate('/dashboard');
    } else {
      // 如果没有token，重定向到登录页面
      navigate('/login?error=auth_failed');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">正在登录...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;