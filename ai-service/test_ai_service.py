#!/usr/bin/env python3
"""
AI服务测试脚本
测试OpenAI API集成和各个功能端点
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime

# AI服务地址
AI_SERVICE_URL = "http://localhost:8001"

async def test_health_check():
    """测试健康检查"""
    print("🔍 测试健康检查...")
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{AI_SERVICE_URL}/health") as response:
            if response.status == 200:
                data = await response.json()
                print(f"✅ 健康检查通过: {data}")
                return True
            else:
                print(f"❌ 健康检查失败: {response.status}")
                return False

async def test_root_endpoint():
    """测试根端点"""
    print("🔍 测试根端点...")
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{AI_SERVICE_URL}/") as response:
            if response.status == 200:
                data = await response.json()
                print(f"✅ 根端点正常: {data}")
                return True
            else:
                print(f"❌ 根端点异常: {response.status}")
                return False

async def test_email_analysis():
    """测试邮件分析功能"""
    print("🔍 测试邮件分析...")
    
    # 测试邮件数据
    test_email = {
        "email_id": "test-001",
        "subject": "紧急：项目进度汇报",
        "content": "您好，需要您在今天下午5点前提交项目进度报告。这个报告对我们的季度评估很重要，请务必按时完成。如有问题请及时联系我。谢谢！",
        "sender": "manager@company.com"
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{AI_SERVICE_URL}/analyze/email",
            json=test_email,
            headers={'Content-Type': 'application/json'}
        ) as response:
            if response.status == 200:
                data = await response.json()
                print(f"✅ 邮件分析成功:")
                print(f"   摘要: {data.get('summary')}")
                print(f"   优先级: {data.get('priority')}")
                print(f"   情感: {data.get('sentiment')}")
                print(f"   标签: {data.get('tags')}")
                print(f"   置信度: {data.get('confidence')}")
                print(f"   需要行动: {data.get('action_required')}")
                return True
            else:
                error = await response.text()
                print(f"❌ 邮件分析失败: {response.status}, {error}")
                return False

async def test_ai_chat():
    """测试AI聊天功能"""
    print("🔍 测试AI聊天...")
    
    test_messages = [
        {"message": "我有25封未读邮件，有什么建议吗？"},
        {"message": "帮我分析一下邮件的优先级"},
        {"message": "如何快速处理大量邮件？"}
    ]
    
    async with aiohttp.ClientSession() as session:
        for i, msg in enumerate(test_messages):
            async with session.post(
                f"{AI_SERVICE_URL}/ai/chat",
                json=msg,
                headers={'Content-Type': 'application/json'}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ 聊天测试 {i+1}:")
                    print(f"   问题: {msg['message']}")
                    print(f"   回复: {data.get('reply')}")
                    print(f"   建议: {data.get('suggestions')}")
                else:
                    error = await response.text()
                    print(f"❌ 聊天测试 {i+1} 失败: {response.status}, {error}")
                    return False
    return True

async def test_reply_generation():
    """测试回复生成功能"""
    print("🔍 测试回复生成...")
    
    test_email = {
        "email_id": "test-002",
        "subject": "关于明天会议的确认",
        "content": "您好，明天下午2点的项目讨论会议，您能参加吗？会议地点在会议室A，大概需要1小时。请确认一下，谢谢！",
        "sender": "colleague@company.com"
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{AI_SERVICE_URL}/generate/reply",
            json=test_email,
            headers={'Content-Type': 'application/json'}
        ) as response:
            if response.status == 200:
                data = await response.json()
                print(f"✅ 回复生成成功:")
                print(f"   建议回复: {data.get('suggested_reply')}")
                print(f"   语调: {data.get('tone')}")
                print(f"   替代选项: {data.get('alternatives')}")
                return True
            else:
                error = await response.text()
                print(f"❌ 回复生成失败: {response.status}, {error}")
                return False

async def test_email_classification():
    """测试邮件分类功能"""
    print("🔍 测试邮件分类...")
    
    test_emails = [
        {
            "email_id": "test-003",
            "subject": "紧急：系统故障报告",
            "content": "系统出现严重故障，需要立即处理",
            "sender": "ops@company.com"
        },
        {
            "email_id": "test-004", 
            "subject": "财务报销申请",
            "content": "请审核我的差旅费报销申请",
            "sender": "finance@company.com"
        }
    ]
    
    async with aiohttp.ClientSession() as session:
        for i, email in enumerate(test_emails):
            async with session.post(
                f"{AI_SERVICE_URL}/classify/email",
                json=email,
                headers={'Content-Type': 'application/json'}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ 分类测试 {i+1}:")
                    print(f"   邮件: {email['subject']}")
                    print(f"   分类: {data.get('categories')}")
                    print(f"   建议文件夹: {data.get('suggested_folder')}")
                    print(f"   置信度: {data.get('confidence')}")
                else:
                    error = await response.text()
                    print(f"❌ 分类测试 {i+1} 失败: {response.status}, {error}")
                    return False
    return True

async def test_stats():
    """测试统计信息"""
    print("🔍 测试统计信息...")
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{AI_SERVICE_URL}/stats/summary") as response:
            if response.status == 200:
                data = await response.json()
                print(f"✅ 统计信息获取成功:")
                print(f"   总邮件数: {data.get('total_emails')}")
                print(f"   未读邮件: {data.get('unread_emails')}")
                print(f"   AI状态: {data.get('ai_analysis_status')}")
                return True
            else:
                error = await response.text()
                print(f"❌ 统计信息获取失败: {response.status}, {error}")
                return False

async def main():
    """主测试函数"""
    print("🚀 开始AI服务功能测试")
    print(f"🔗 测试目标: {AI_SERVICE_URL}")
    print("=" * 50)
    
    # 检查环境变量
    openai_key = os.getenv('OPENAI_API_KEY')
    if openai_key and openai_key.startswith('sk-'):
        print("✅ OpenAI API Key 已配置")
    else:
        print("⚠️ OpenAI API Key 未配置，将使用模拟模式")
    
    print()
    
    # 执行测试
    tests = [
        ("基础连接", test_health_check),
        ("根端点", test_root_endpoint),
        ("邮件分析", test_email_analysis),
        ("AI聊天", test_ai_chat),
        ("回复生成", test_reply_generation),
        ("邮件分类", test_email_classification),
        ("统计信息", test_stats),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n📝 {test_name}测试:")
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name}测试异常: {str(e)}")
            results.append((test_name, False))
        print("-" * 30)
    
    # 汇总结果
    print(f"\n📊 测试结果汇总:")
    print("=" * 50)
    passed = 0
    for test_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{test_name:12} | {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 总体结果: {passed}/{len(results)} 项测试通过")
    
    if passed == len(results):
        print("🎉 所有测试通过！AI服务功能正常")
    else:
        print("⚠️ 部分测试失败，请检查服务配置")

if __name__ == "__main__":
    # 运行测试
    asyncio.run(main())