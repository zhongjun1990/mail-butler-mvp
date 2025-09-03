from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from datetime import datetime

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
    priority: str
    sentiment: str
    suggested_reply: Optional[str] = None
    tags: List[str] = []

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

@app.post("/analyze/email", response_model=EmailAnalysisResponse)
async def analyze_email(request: EmailAnalysisRequest):
    """分析邮件内容"""
    try:
        # 模拟AI分析（后续集成真实的OpenAI API）
        analysis = EmailAnalysisResponse(
            email_id=request.email_id,
            summary=f"这是一封关于 '{request.subject}' 的邮件，来自 {request.sender}",
            priority="medium",
            sentiment="neutral",
            suggested_reply="谢谢您的邮件，我会仔细阅读并回复。",
            tags=["工作", "待回复"]
        )
        
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"分析邮件时出错: {str(e)}")

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
        }
    }

@app.post("/ai/chat")
async def ai_chat(message: dict):
    """AI聊天接口"""
    user_message = message.get("message", "")
    
    # 模拟AI回复
    if "邮件" in user_message:
        reply = "我可以帮您分析和管理邮件。您想了解什么具体信息？"
    elif "统计" in user_message:
        reply = "根据最新数据，您有25封未读邮件，其中5封是高优先级的。"
    else:
        reply = "我是您的AI邮件助手，可以帮您管理邮件、分析内容和提供建议。"
    
    return {
        "reply": reply,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)