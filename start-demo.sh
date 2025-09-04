#!/bin/bash

echo "🚀 启动邮箱管家演示..."

# 检查后端是否运行
echo "🔍 检查后端服务状态..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ 后端服务正在运行 (http://localhost:8000)"
else
    echo "❌ 后端服务未运行，请先启动后端"
    echo "💡 运行命令: cd backend && npx ts-node src/index-simple.ts"
    exit 1
fi

# 启动前端
echo "🌐 启动前端应用..."
cd frontend
npm run dev

echo "📝 访问应用:"
echo "   前端: http://localhost:3000"
echo "   后端: http://localhost:8000"