from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# 数据库配置：默认使用SQLite，可配置PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # 默认使用SQLite数据库
    import sqlite3
    DATABASE_URL = "sqlite:///./soullink.db"
    print("📊 使用SQLite数据库")
else:
    print("📊 使用PostgreSQL数据库")

# 根据数据库类型选择引擎参数
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# 为了兼容SQLite，使用String类型替代UUID
def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    digital_personas = relationship("DigitalPersona", back_populates="user")
    conversations = relationship("Conversation", back_populates="user")

class DigitalPersona(Base):
    __tablename__ = "digital_personas"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    system_prompt = Column(Text, nullable=False)
    initial_prompt = Column(Text, nullable=False)  # 保存初始prompt用于对比
    optimization_count = Column(Integer, default=0)  # 优化次数
    personality_score = Column(Float, default=0.0)  # 人格匹配度评分
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("User", back_populates="digital_personas")
    conversations = relationship("Conversation", back_populates="digital_persona")
    prompt_optimizations = relationship("PromptOptimization", back_populates="digital_persona")

class Scenario(Base):
    __tablename__ = "scenarios"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    context = Column(Text, nullable=False)  # 场景上下文
    category = Column(String(50), nullable=False)  # 场景分类
    difficulty_level = Column(String(20), default="medium")  # easy, medium, hard
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    conversations = relationship("Conversation", back_populates="scenario")

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    digital_persona_id = Column(String, ForeignKey("digital_personas.id"), nullable=False)
    scenario_id = Column(String, ForeignKey("scenarios.id"), nullable=False)
    title = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("User", back_populates="conversations")
    digital_persona = relationship("DigitalPersona", back_populates="conversations")
    scenario = relationship("Scenario", back_populates="conversations")
    messages = relationship("ConversationMessage", back_populates="conversation")
    feedbacks = relationship("MessageFeedback", back_populates="conversation")

class ConversationMessage(Base):
    __tablename__ = "conversation_messages"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    sender_type = Column(String(20), nullable=False)  # 'user' or 'agent'
    content = Column(Text, nullable=False)
    message_index = Column(Integer, nullable=False)  # 消息在对话中的顺序
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # AI相关字段
    prompt_used = Column(Text)  # agent消息使用的prompt
    model_used = Column(String(50))  # 使用的模型
    tokens_used = Column(Integer)  # 使用的token数
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    feedbacks = relationship("MessageFeedback", back_populates="message")

class MessageFeedback(Base):
    __tablename__ = "message_feedbacks"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    message_id = Column(String, ForeignKey("conversation_messages.id"), nullable=False)
    feedback_type = Column(String(20), nullable=False)  # 'like', 'dislike', 'correction'
    feedback_content = Column(Text)  # 文字反馈内容
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="feedbacks")
    message = relationship("ConversationMessage", back_populates="feedbacks")

class PromptOptimization(Base):
    __tablename__ = "prompt_optimizations"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    digital_persona_id = Column(String, ForeignKey("digital_personas.id"), nullable=False)
    old_prompt = Column(Text, nullable=False)
    new_prompt = Column(Text, nullable=False)
    optimization_reason = Column(Text, nullable=False)  # 优化原因
    feedback_data = Column(Text)  # 导致优化的反馈数据（JSON格式）
    improvement_score = Column(Float)  # 改进评分
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    digital_persona = relationship("DigitalPersona", back_populates="prompt_optimizations")

# 情感匹配相关模型
class MarketAgent(Base):
    """投放到情感匹配市场的数字人格"""
    __tablename__ = "market_agents"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    digital_persona_id = Column(String, ForeignKey("digital_personas.id"), nullable=False)
    market_type = Column(String(20), nullable=False)  # 'love' 或 'friendship'
    display_name = Column(String(100), nullable=False)  # 市场显示名称
    display_description = Column(Text, nullable=False)  # 市场显示描述
    tags = Column(Text)  # 标签，JSON格式存储
    is_active = Column(Boolean, default=True)
    last_interaction = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    digital_persona = relationship("DigitalPersona")
    initiated_matches = relationship("MatchRelation", foreign_keys="MatchRelation.initiator_agent_id", back_populates="initiator_agent")
    received_matches = relationship("MatchRelation", foreign_keys="MatchRelation.target_agent_id", back_populates="target_agent")

class MatchRelation(Base):
    """用户之间的匹配关系"""
    __tablename__ = "match_relations"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    initiator_user_id = Column(String, ForeignKey("users.id"), nullable=False)  # 发起匹配的用户
    target_user_id = Column(String, ForeignKey("users.id"), nullable=False)  # 目标用户
    initiator_agent_id = Column(String, ForeignKey("market_agents.id"), nullable=False)  # 发起者的数字人格
    target_agent_id = Column(String, ForeignKey("market_agents.id"), nullable=False)  # 目标数字人格
    match_type = Column(String(20), nullable=False)  # 'love' 或 'friendship'
    
    # 匹配度分数
    love_compatibility_score = Column(Float, default=0.0)  # 恋爱匹配度
    friendship_compatibility_score = Column(Float, default=0.0)  # 友谊匹配度
    total_interactions = Column(Integer, default=0)  # 总交互次数
    
    # 状态和时间
    status = Column(String(20), default="active")  # active, paused, ended
    last_conversation_at = Column(DateTime)
    next_scheduled_conversation = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    initiator_user = relationship("User", foreign_keys=[initiator_user_id])
    target_user = relationship("User", foreign_keys=[target_user_id])
    initiator_agent = relationship("MarketAgent", foreign_keys=[initiator_agent_id], back_populates="initiated_matches")
    target_agent = relationship("MarketAgent", foreign_keys=[target_agent_id], back_populates="received_matches")
    auto_conversations = relationship("AutoConversation", back_populates="match_relation")

class AutoConversation(Base):
    """自动对话记录"""
    __tablename__ = "auto_conversations"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    match_relation_id = Column(String, ForeignKey("match_relations.id"), nullable=False)
    scenario_id = Column(String, ForeignKey("scenarios.id"), nullable=False)
    
    # 对话配置
    max_turns = Column(Integer, default=10)  # 最大轮数
    actual_turns = Column(Integer, default=0)  # 实际轮数
    termination_reason = Column(String(50))  # 终止原因: max_turns, natural_end, conflict, etc.
    
    # 对话状态
    status = Column(String(20), default="pending")  # pending, running, completed, failed
    started_at = Column(DateTime)
    ended_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 本轮匹配度评估结果
    round_love_score = Column(Float, default=0.0)  # 本轮恋爱匹配度变化
    round_friendship_score = Column(Float, default=0.0)  # 本轮友谊匹配度变化
    
    # Relationships
    match_relation = relationship("MatchRelation", back_populates="auto_conversations")
    scenario = relationship("Scenario")
    messages = relationship("AutoConversationMessage", back_populates="auto_conversation")
    evaluations = relationship("MatchEvaluation", back_populates="auto_conversation")

class AutoConversationMessage(Base):
    """自动对话消息"""
    __tablename__ = "auto_conversation_messages"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    auto_conversation_id = Column(String, ForeignKey("auto_conversations.id"), nullable=False)
    sender_agent_id = Column(String, ForeignKey("market_agents.id"), nullable=False)  # 发送者数字人格
    content = Column(Text, nullable=False)
    message_index = Column(Integer, nullable=False)  # 消息顺序
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # AI生成相关
    prompt_used = Column(Text)
    model_used = Column(String(50))
    tokens_used = Column(Integer)
    
    # Relationships
    auto_conversation = relationship("AutoConversation", back_populates="messages")
    sender_agent = relationship("MarketAgent")

class MatchEvaluation(Base):
    """匹配度评估记录"""
    __tablename__ = "match_evaluations"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    auto_conversation_id = Column(String, ForeignKey("auto_conversations.id"), nullable=False)
    message_id = Column(String, ForeignKey("auto_conversation_messages.id"), nullable=False)
    
    # 评估结果
    love_score_delta = Column(Float, default=0.0)  # 恋爱匹配度变化
    friendship_score_delta = Column(Float, default=0.0)  # 友谊匹配度变化
    evaluation_reason = Column(Text)  # 评估原因
    
    # 评估元数据
    evaluator_model = Column(String(50))  # 评估使用的模型
    evaluation_prompt = Column(Text)  # 评估使用的提示词
    tokens_used = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    auto_conversation = relationship("AutoConversation", back_populates="evaluations")
    message = relationship("AutoConversationMessage")

# 创建所有表
def create_tables():
    Base.metadata.create_all(bind=engine)
    print("✅ 数据库表创建完成")

# 获取数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 初始化数据库
def init_database():
    """初始化数据库，创建表格和插入初始数据"""
    create_tables()
    
    # 可以在这里添加初始数据
    print("🎯 数据库初始化完成")

if __name__ == "__main__":
    init_database() 