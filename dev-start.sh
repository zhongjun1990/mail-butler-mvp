#!/bin/bash

echo "🚀 启动邮箱管家开发环境..."

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

# 启动所有服务
echo "📦 启动 Docker 服务..."
cd infrastructure
docker-compose up -d

echo "⏳ 等待服务启动..."
sleep 10

echo "✅ 服务启动完成！"
echo ""
echo "🌐 访问地址："
echo "   前端应用: http://localhost:3000"
echo "   后端 API: http://localhost:8000"
echo "   AI 服务: http://localhost:8001"
echo "   数据库: localhost:5432"
echo ""
echo "📝 查看日志: docker-compose logs -f"
echo "🛑 停止服务: docker-compose down"
