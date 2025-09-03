#!/bin/bash

echo "🛑 停止邮箱管家开发环境..."

cd infrastructure
docker-compose down

echo "✅ 所有服务已停止"
