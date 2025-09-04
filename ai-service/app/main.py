from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from datetime import datetime
import openai
import logging
from dotenv import load_dotenv
import json
import asyncio

# 加载环境变量
load_dotenv()

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 配置OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')
if not openai.api_key:
    logger.warning("⚠️ OPENAI_API_KEY 未设置，使用模拟模式")

app = FastAPI(
    title="邮箱管家 AI 服务",
    description="智能邮件分析和AI助手服务",
    version="1.0.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据模型
class EmailAnalysisRequest(BaseModel):
    email_id: str
    subject: str
    content: str
    sender: str

class EmailAnalysisResponse(BaseModel):
    email_id: str
    summary: str
    priority: str  # high, medium, low
    sentiment: str  # positive, neutral, negative
    suggested_reply: Optional[str] = None
    tags: List[str] = []
    confidence: float = 0.0
    key_points: List[str] = []
    action_required: bool = False

class ChatMessage(BaseModel):
    message: str
    context: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    timestamp: str
    suggestions: List[str] = []

class EmailBatch(BaseModel):
    emails: List[EmailAnalysisRequest]

class BatchAnalysisResponse(BaseModel):
    results: List[EmailAnalysisResponse]
    summary_stats: dict

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str

@app.get("/", response_model=dict)
async def root():
    """根路径，返回服务信息"""
    return {
        "message": "📧 邮箱管家 AI 服务",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """健康检查端点"""
    return HealthResponse(
        status="ok",
        timestamp=datetime.now().isoformat(),
        version="1.0.0"
    )

# AI助手功能
async def get_openai_analysis(subject: str, content: str, sender: str) -> dict:
    """使用OpenAI分析邮件内容"""
    if not openai.api_key:
        # 模拟响应
        return {
            "summary": f"这是一封关于 '{subject}' 的邮件，来自 {sender}",
            "priority": "medium",
            "sentiment": "neutral",
            "suggested_reply": "谢谢您的邮件，我会仔细阅读并回复。",
            "tags": ["工作", "待回复"],
            "confidence": 0.7,
            "key_points": ["需要回复", "查看详情"],
            "action_required": True
        }
    
    try:
        # 构建提示词
        prompt = f"""
        请分析以下邮件内容并提供结构化分析：
        
        发件人：{sender}
        主题：{subject}
        内容：{content}
        
        请提供以下分析（用JSON格式返回）：
        1. summary: 邮件内容摘要（50字以内）
        2. priority: 优先级（high/medium/low）
        3. sentiment: 情感分析（positive/neutral/negative）
        4. suggested_reply: 建议回复内容（可选）
        5. tags: 相关标签（最多5个）
        6. confidence: 分析置信度（0-1）
        7. key_points: 关键要点（最多3个）
        8. action_required: 是否需要行动（true/false）
        """
        
        response = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "你是一个专业的邮件分析助手，能够准确分析邮件内容并提供有用的建议。请用JSON格式返回分析结果。"},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.3
            )
        )
        
        result = response.choices[0].message.content
        # 尝试解析JSON响应
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            # 如果解析失败，返回默认结构
            return {
                "summary": f"邮件主题：{subject}",
                "priority": "medium",
                "sentiment": "neutral",
                "suggested_reply": None,
                "tags": ["AI分析"],
                "confidence": 0.5,
                "key_points": ["需要人工审查"],
                "action_required": False
            }
    except Exception as e:
        logger.error(f"OpenAI API调用失败: {str(e)}")
        return {
            "summary": f"邮件来自{sender}，主题：{subject}",
            "priority": "medium",
            "sentiment": "neutral",
            "suggested_reply": None,
            "tags": ["分析失败"],
            "confidence": 0.0,
            "key_points": ["AI分析不可用"],
            "action_required": False
        }

async def get_ai_chat_response(message: str, context: str = None) -> dict:
    """AI聊天功能"""
    if not openai.api_key:
        # 模拟AI回复
        if "邮件" in message:
            return {
                "reply": "我可以帮您分析和管理邮件。您想了解什么具体信息？",
                "suggestions": ["查看未读邮件", "邮件统计", "优先级邮件"]
            }
        elif "统计" in message:
            return {
                "reply": "根据最新数据，您有25封未读邮件，其中5封是高优先级的。",
                "suggestions": ["查看高优先级", "批量处理", "设置提醒"]
            }
        else:
            return {
                "reply": "我是您的AI邮件助手，可以帮您管理邮件、分析内容和提供建议。",
                "suggestions": ["邮件分析", "智能回复", "邮件统计"]
            }
    
    try:
        system_message = "你是一个专业的邮件管理助手，可以帮助用户分析邮件、提供建议和回答相关问题。请用中文回复，语气友好专业。"
        if context:
            system_message += f" 上下文信息：{context}"
        
        response = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": message}
                ],
                max_tokens=300,
                temperature=0.7
            )
        )
        
        reply = response.choices[0].message.content
        
        # 生成相关建议
        suggestions = []
        if "邮件" in message.lower():
            suggestions = ["查看邮件列表", "分析邮件内容", "设置邮件规则"]
        elif "统计" in message.lower():
            suggestions = ["详细统计", "趋势分析", "导出报告"]
        else:
            suggestions = ["邮件管理", "AI分析", "帮助文档"]
        
        return {
            "reply": reply,
            "suggestions": suggestions
        }
    except Exception as e:
        logger.error(f"AI聊天失败: {str(e)}")
        return {
            "reply": "抱歉，AI服务暂时不可用，请稍后再试。",
            "suggestions": ["重试", "查看帮助", "联系支持"]
        }
@app.post("/analyze/email", response_model=EmailAnalysisResponse)
async def analyze_email(request: EmailAnalysisRequest):
    """分析邮件内容"""
    try:
        logger.info(f"开始分析邮件: {request.email_id}")
        
        # 使用AI分析邮件
        ai_result = await get_openai_analysis(
            request.subject, 
            request.content, 
            request.sender
        )
        
        # 构建响应
        analysis = EmailAnalysisResponse(
            email_id=request.email_id,
            summary=ai_result.get("summary", "未知内容"),
            priority=ai_result.get("priority", "medium"),
            sentiment=ai_result.get("sentiment", "neutral"),
            suggested_reply=ai_result.get("suggested_reply"),
            tags=ai_result.get("tags", []),
            confidence=ai_result.get("confidence", 0.0),
            key_points=ai_result.get("key_points", []),
            action_required=ai_result.get("action_required", False)
        )
        
        logger.info(f"邮件分析完成: {request.email_id}, 优先级: {analysis.priority}")
        return analysis
        
    except Exception as e:
        logger.error(f"分析邮件时出错: {str(e)}")
        raise HTTPException(status_code=500, detail=f"分析邮件时出错: {str(e)}")

@app.post("/analyze/batch", response_model=BatchAnalysisResponse)
async def analyze_batch_emails(batch: EmailBatch):
    """批量分析邮件"""
    try:
        logger.info(f"开始批量分析 {len(batch.emails)} 封邮件")
        
        results = []
        priorities = {"high": 0, "medium": 0, "low": 0}
        sentiments = {"positive": 0, "neutral": 0, "negative": 0}
        
        # 并发处理多封邮件
        tasks = []
        for email_req in batch.emails:
            task = get_openai_analysis(email_req.subject, email_req.content, email_req.sender)
            tasks.append((email_req.email_id, task))
        
        # 等待所有分析完成
        for email_id, task in tasks:
            ai_result = await task
            
            analysis = EmailAnalysisResponse(
                email_id=email_id,
                summary=ai_result.get("summary", "未知内容"),
                priority=ai_result.get("priority", "medium"),
                sentiment=ai_result.get("sentiment", "neutral"),
                suggested_reply=ai_result.get("suggested_reply"),
                tags=ai_result.get("tags", []),
                confidence=ai_result.get("confidence", 0.0),
                key_points=ai_result.get("key_points", []),
                action_required=ai_result.get("action_required", False)
            )
            
            results.append(analysis)
            
            # 统计信息
            priorities[analysis.priority] += 1
            sentiments[analysis.sentiment] += 1
        
        summary_stats = {
            "total_emails": len(results),
            "priority_distribution": priorities,
            "sentiment_distribution": sentiments,
            "action_required_count": sum(1 for r in results if r.action_required),
            "avg_confidence": sum(r.confidence for r in results) / len(results) if results else 0
        }
        
        logger.info(f"批量分析完成: {len(results)} 封邮件")
        return BatchAnalysisResponse(results=results, summary_stats=summary_stats)
        
    except Exception as e:
        logger.error(f"批量分析失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"批量分析失败: {str(e)}")
@app.get("/stats/summary")
async def get_email_stats():
    """获取邮件统计信息"""
    return {
        "total_emails": 150,
        "unread_emails": 25,
        "high_priority": 5,
        "medium_priority": 15,
        "low_priority": 5,
        "sentiment_distribution": {
            "positive": 40,
            "neutral": 50,
            "negative": 10
        },
        "ai_analysis_status": "active" if openai.api_key else "mock_mode"
    }

@app.post("/ai/chat", response_model=ChatResponse)
async def ai_chat(message: ChatMessage):
    """AI聊天接口"""
    try:
        logger.info(f"AI聊天请求: {message.message[:50]}...")
        
        # 使用AI生成回复
        chat_result = await get_ai_chat_response(message.message, message.context)
        
        response = ChatResponse(
            reply=chat_result["reply"],
            timestamp=datetime.now().isoformat(),
            suggestions=chat_result.get("suggestions", [])
        )
        
        logger.info(f"AI回复生成成功")
        return response
        
    except Exception as e:
        logger.error(f"AI聊天失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI聊天失败: {str(e)}")

@app.post("/generate/reply")
async def generate_reply_suggestion(email_data: EmailAnalysisRequest):
    """生成邮件回复建议"""
    try:
        if not openai.api_key:
            return {
                "suggested_reply": f"谢谢您关于'{email_data.subject}'的邮件。我会仔细阅读并尽快回复您。",
                "tone": "professional",
                "alternatives": [
                    "收到您的邮件，我会认真处理。",
                    "感谢您的信息，我们会及时跟进。"
                ]
            }
        
        prompt = f"""
        请为以下邮件生成一个专业、得体的回复：
        
        发件人：{email_data.sender}
        主题：{email_data.subject}
        内容：{email_data.content}
        
        请提供：
        1. 一个主要的回复建议（100-200字）
        2. 语调风格（professional/friendly/formal）
        3. 2-3个替代回复选项
        
        用JSON格式返回。
        """
        
        response = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "你是一个专业的邮件回复助手，能够生成合适的回复内容。"},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=400,
                temperature=0.5
            )
        )
        
        result = response.choices[0].message.content
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            return {
                "suggested_reply": "谢谢您的邮件，我会及时回复。",
                "tone": "professional",
                "alternatives": []
            }
            
    except Exception as e:
        logger.error(f"生成回复失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"生成回复失败: {str(e)}")

@app.post("/classify/email")
async def classify_email(email_data: EmailAnalysisRequest):
    """邮件分类功能"""
    try:
        # 基于关键词的简单分类
        subject_lower = email_data.subject.lower()
        content_lower = email_data.content.lower()
        
        categories = []
        if any(word in subject_lower or word in content_lower for word in ["工作", "项目", "会议", "meeting"]):
            categories.append("工作")
        if any(word in subject_lower or word in content_lower for word in ["通知", "公告", "notice"]):
            categories.append("通知")
        if any(word in subject_lower or word in content_lower for word in ["紧急", "加急", "urgent"]):
            categories.append("紧急")
        if any(word in subject_lower or word in content_lower for word in ["财务", "报销", "finance"]):
            categories.append("财务")
        
        if not categories:
            categories = ["一般"]
        
        return {
            "categories": categories,
            "suggested_folder": categories[0] if categories else "其他",
            "confidence": 0.8 if len(categories) == 1 else 0.6
        }
        
    except Exception as e:
        logger.error(f"邮件分类失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"邮件分类失败: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv('AI_SERVICE_PORT', 8001))
    logger.info(f"启动AI服务，端口: {port}")
    logger.info(f"OpenAI API: {'\u5df2\u914d\u7f6e' if openai.api_key else '\u672a\u914d\u7f6e\uff08\u4f7f\u7528\u6a21\u62df\u6a21\u5f0f\uff09'}")
    uvicorn.run(app, host="0.0.0.0", port=port)