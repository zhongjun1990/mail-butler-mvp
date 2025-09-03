#!/bin/bash

# GitHub 自动部署脚本
# 使用方法: ./github-deploy.sh YOUR_GITHUB_USERNAME

set -e  # 出错时停止脚本

# 检查参数
if [ $# -eq 0 ]; then
    echo "❌ 请提供 GitHub 用户名"
    echo "使用方法: ./github-deploy.sh YOUR_GITHUB_USERNAME"
    exit 1
fi

GITHUB_USERNAME="$1"
REPO_NAME="mail-butler-mvp"
REPO_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

echo "🚀 开始部署邮箱管家项目到 GitHub..."
echo "📁 用户名: ${GITHUB_USERNAME}"
echo "📦 仓库名: ${REPO_NAME}"
echo "🔗 仓库地址: ${REPO_URL}"
echo ""

# 检查是否在正确的目录
if [ ! -f "README.md" ] || [ ! -d ".git" ]; then
    echo "❌ 错误：请在 mail-butler-mvp 项目根目录运行此脚本"
    exit 1
fi

# 检查 Git 状态
echo "📋 检查 Git 状态..."
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ 工作目录干净，所有文件已提交"
else
    echo "⚠️  工作目录有未提交的更改，正在添加并提交..."
    git add .
    git commit -m "Update: 准备推送到 GitHub"
fi

# 检查是否已经配置了远程仓库
if git remote get-url origin >/dev/null 2>&1; then
    CURRENT_ORIGIN=$(git remote get-url origin)
    echo "⚠️  已存在远程仓库: ${CURRENT_ORIGIN}"
    
    if [ "$CURRENT_ORIGIN" != "$REPO_URL" ]; then
        echo "🔄 更新远程仓库地址..."
        git remote set-url origin "$REPO_URL"
    fi
else
    echo "➕ 添加远程仓库..."
    git remote add origin "$REPO_URL"
fi

# 设置主分支
echo "🌟 确保在 main 分支..."
git branch -M main

# 推送到 GitHub
echo "⬆️  推送代码到 GitHub..."
echo ""
echo "📝 如果这是第一次推送，你需要："
echo "   1. 先在 GitHub 上创建仓库 https://github.com/new"
echo "   2. 仓库名称设为：${REPO_NAME}"
echo "   3. 不要初始化 README (我们已经有了)"
echo ""

# 尝试推送
if git push -u origin main; then
    echo ""
    echo "🎉 成功！项目已推送到 GitHub!"
    echo ""
    echo "🔗 访问你的项目："
    echo "   ${REPO_URL%.*}"
    echo ""
    echo "📊 项目统计："
    echo "   - 文件数量: $(git ls-files | wc -l | xargs)"
    echo "   - 代码行数: $(git ls-files | xargs wc -l | tail -1 | awk '{print $1}' | xargs)"
    echo "   - 最新提交: $(git log -1 --format='%h - %s')"
    echo ""
    echo "🎯 下一步你可以："
    echo "   1. 在 GitHub 上查看项目"
    echo "   2. 设置项目描述和标签"  
    echo "   3. 邀请协作者"
    echo "   4. 继续开发新功能"
    echo ""
else
    echo ""
    echo "❌ 推送失败！"
    echo ""
    echo "🔧 可能的解决方案："
    echo "   1. 确保你有 GitHub 仓库的访问权限"
    echo "   2. 检查网络连接"
    echo "   3. 验证 GitHub 用户名是否正确"
    echo "   4. 确保已经在 GitHub 上创建了仓库"
    echo ""
    echo "📋 手动步骤："
    echo "   1. 访问 https://github.com/new"
    echo "   2. 创建名为 '${REPO_NAME}' 的仓库"
    echo "   3. 重新运行此脚本"
    echo ""
    exit 1
fi