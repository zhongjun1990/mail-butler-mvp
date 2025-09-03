# 🤖 邮箱管家 (Mail Butler)

> 智能AI邮箱管理平台 - 让邮件管理像聊天一样简单

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)

## 🌟 项目简介

邮箱管家是一个现代化的智能邮件管理平台，集成AI助手功能，帮助用户更高效地管理多个邮箱账户。通过AI技术实现邮件智能分析、自动分类、智能回复建议等功能，让邮件管理变得简单高效。

### ✨ 核心特性

- 📧 **多邮箱集成** - 统一管理Gmail、Outlook等多个邮箱账户
- 🤖 **AI智能助手** - 自动分析邮件内容，提供智能回复建议  
- 🏷️ **智能分类** - AI自动标记和分类邮件，支持自定义规则
- 🔔 **跨平台通知** - 集成钉钉、飞书、微信等企业工具
- 💬 **对话式管理** - 通过AI对话轻松管理邮件
- 🎨 **现代化界面** - 响应式设计，支持暗色模式，移动端友好
- 🔐 **安全认证** - 支持OAuth 2.0，保障账户安全

## 🛠️ 技术架构

### 前端技术栈
- **React 18** + **TypeScript** + **Tailwind CSS**
- **React Router** - 路由管理
- **Headless UI** - 无障碍UI组件
- **React Hook Form** - 表单管理
- **Zustand** - 状态管理

### 后端技术栈
- **Node.js** + **Express** + **TypeScript**
- **Prisma ORM** - 类型安全的数据库操作
- **JWT** + **Passport.js** - 用户认证和OAuth集成
- **Nodemailer** - 邮件服务

### AI服务
- **Python 3.9+** + **FastAPI**
- **OpenAI GPT** - 智能邮件分析
- **异步处理** - 高性能AI分析

### 数据库
- **PostgreSQL 15** - 主数据库，存储用户和邮件数据
- **Redis 7** - 缓存和会话存储

### 基础设施
- **Docker** + **Docker Compose** - 容器化部署
- **Nginx** - 反向代理（生产环境）

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Python 3.9+  
- Docker & Docker Compose
- PostgreSQL 15+ (或使用Docker)

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/YOUR_USERNAME/mail-butler-mvp.git
cd mail-butler-mvp
```

2. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置以下重要参数：
# - DATABASE_URL: PostgreSQL连接字符串
# - OPENAI_API_KEY: OpenAI API密钥
# - GOOGLE_CLIENT_ID: Google OAuth客户端ID
# - JWT_SECRET: JWT签名密钥
```

3. **启动数据库服务**
```bash
docker-compose -f infrastructure/docker-compose.yml up postgres redis -d
```

4. **安装依赖**
```bash
# 后端依赖
cd backend && npm install && cd ..

# 前端依赖  
cd frontend && npm install && cd ..

# AI服务依赖
cd ai-service && pip install -r requirements.txt && cd ..
```

5. **启动服务**
```bash
# 方式1: 使用便捷脚本
./dev-start.sh

# 方式2: 手动启动各服务
# 后端服务
cd backend && npm run dev &

# 前端服务
cd frontend && npm run dev &

# AI服务
cd ai-service && uvicorn app.main:app --reload --port 8001 &
```

6. **访问应用**
- 🌐 前端应用: http://localhost:3000
- 🔧 后端API: http://localhost:8000  
- 🤖 AI服务: http://localhost:8001
- 📚 API文档: http://localhost:8001/docs

## 📁 项目结构

```
mail-butler-mvp/
├── frontend/              # React前端应用
│   ├── src/
│   │   ├── components/    # UI组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API服务
│   │   └── types/         # TypeScript类型
│   └── package.json
├── backend/               # Node.js后端API
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── services/      # 业务逻辑
│   │   ├── config/        # 配置文件
│   │   └── routes/        # 路由定义
│   ├── prisma/           # Prisma数据库schema
│   └── package.json
├── ai-service/           # Python AI服务
│   ├── app/
│   │   ├── main.py       # FastAPI主文件
│   │   └── services/     # AI服务逻辑
│   └── requirements.txt
├── infrastructure/       # 基础设施配置
│   ├── docker-compose.yml
│   └── docker/
├── docs/                # 项目文档
└── config/             # 全局配置
```

## 📊 开发进度

### ✅ 已完成功能
- [x] 项目基础架构搭建
- [x] 数据库设计和持久化存储 (PostgreSQL + Prisma ORM)
- [x] OAuth认证系统完善 (支持Google OAuth)
- [x] 用户管理和会话保护
- [x] 邮箱管理界面组件 (React + TypeScript + Tailwind)
- [x] 账户切换功能
- [x] 响应式界面设计

### 🚧 正在开发
- [ ] OpenAI API集成 - 智能邮件分析
- [ ] 真实邮件服务集成 (IMAP/SMTP协议)
- [ ] AI对话式邮件管理

### 📋 待开发功能
- [ ] 邮件撰写和发送功能
- [ ] 高级邮件搜索和筛选
- [ ] 跨平台通知集成 (钉钉、飞书、微信)
- [ ] 邮件规则引擎
- [ ] 性能监控和错误处理
- [ ] 生产环境部署优化

## 🔧 开发指南

### 前端开发
```bash
cd frontend
npm install
npm run dev        # 启动开发服务器
npm run build      # 构建生产版本
npm run lint       # 代码检查
```

### 后端开发 
```bash
cd backend
npm install
npm run dev        # 启动开发服务器
npm run build      # TypeScript编译
npm test           # 运行测试
npx prisma generate # 生成Prisma客户端
```

### AI服务开发
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001  # 启动开发服务器
pytest            # 运行测试
```

### 数据库管理
```bash
# 查看数据库状态
docker-compose -f infrastructure/docker-compose.yml ps

# 连接数据库
docker exec -it infrastructure-postgres-1 psql -U user -d mailbutler

# 查看日志
docker-compose -f infrastructure/docker-compose.yml logs -f postgres
```

## 🧪 测试

### 运行测试
```bash
# 后端测试
cd backend && npm test

# 前端测试  
cd frontend && npm test

# AI服务测试
cd ai-service && pytest
```

### API测试
```bash
# 健康检查
curl http://localhost:8000/health

# 用户信息API (需要认证)
curl -H "Authorization: Bearer your-token" http://localhost:8000/api/auth/me
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！请阅读以下指南：

1. **Fork 项目** 并创建你的分支
2. **创建功能分支** (`git checkout -b feature/amazing-feature`)
3. **编写代码** 并确保通过测试
4. **提交更改** (`git commit -m '✨ Add amazing feature'`)
5. **推送分支** (`git push origin feature/amazing-feature`)
6. **创建 Pull Request**

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 ESLint 配置的代码规范
- 编写有意义的提交信息
- 为新功能添加测试

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) - 查看 LICENSE 文件了解详情

## 📞 联系方式

- 📧 邮箱: [your-email@example.com]
- 🐛 问题反馈: [GitHub Issues](https://github.com/YOUR_USERNAME/mail-butler-mvp/issues)
- 💬 讨论: [GitHub Discussions](https://github.com/YOUR_USERNAME/mail-butler-mvp/discussions)

## 🙏 致谢

感谢所有贡献者和以下开源项目：
- [React](https://reactjs.org/) - 用户界面库
- [Node.js](https://nodejs.org/) - JavaScript运行时
- [FastAPI](https://fastapi.tiangolo.com/) - 现代Python API框架
- [PostgreSQL](https://www.postgresql.org/) - 关系型数据库
- [Prisma](https://www.prisma.io/) - 数据库ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架

---

⭐ 如果这个项目对你有帮助，请给我们一个星标！
