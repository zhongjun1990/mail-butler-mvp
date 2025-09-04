# AI 服务配置文件
import os
from typing import Optional

class AIServiceConfig:
    """AI服务配置类"""
    
    # OpenAI 配置
    OPENAI_API_KEY: Optional[str] = os.getenv('OPENAI_API_KEY')
    OPENAI_MODEL: str = os.getenv('OPENAI_MODEL', 'gpt-3.5-turbo')
    OPENAI_MAX_TOKENS: int = int(os.getenv('OPENAI_MAX_TOKENS', '500'))
    OPENAI_TEMPERATURE: float = float(os.getenv('OPENAI_TEMPERATURE', '0.3'))
    
    # 服务配置
    AI_SERVICE_PORT: int = int(os.getenv('AI_SERVICE_PORT', '8001'))
    AI_SERVICE_HOST: str = os.getenv('AI_SERVICE_HOST', '0.0.0.0')
    
    # 数据库配置
    DATABASE_URL: Optional[str] = os.getenv('DATABASE_URL')
    REDIS_URL: Optional[str] = os.getenv('REDIS_URL')
    
    # 日志配置
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    
    # 分析配置
    BATCH_SIZE_LIMIT: int = int(os.getenv('BATCH_SIZE_LIMIT', '50'))
    ANALYSIS_TIMEOUT: int = int(os.getenv('ANALYSIS_TIMEOUT', '30'))
    
    # 缓存配置
    CACHE_TTL: int = int(os.getenv('CACHE_TTL', '3600'))  # 1小时
    
    @classmethod
    def is_openai_available(cls) -> bool:
        """检查OpenAI API是否可用"""
        return cls.OPENAI_API_KEY is not None and cls.OPENAI_API_KEY.startswith('sk-')
    
    @classmethod
    def get_system_prompts(cls) -> dict:
        """获取系统提示词"""
        return {
            "email_analysis": """你是一个专业的邮件分析助手，能够准确分析邮件内容并提供有用的建议。
            请分析邮件的重要性、情感倾向、关键信息，并提供合理的处理建议。
            请用JSON格式返回分析结果，包括摘要、优先级、情感、标签和关键要点。""",
            
            "chat_assistant": """你是一个专业的邮件管理助手，可以帮助用户分析邮件、提供建议和回答相关问题。
            请用中文回复，语气友好专业。能够理解用户的需求并提供实用的建议。""",
            
            "reply_generator": """你是一个专业的邮件回复助手，能够生成合适的邮件回复内容。
            请根据原邮件的内容和语调，生成得体、专业的回复，考虑商务礼仪和沟通效果。"""
        }

# 全局配置实例
config = AIServiceConfig()