from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean, Float, ForeignKey, Index, UniqueConstraint
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

class ChatSession(Base):
    """聊天会话 - 维护两个用户之间的实时聊天会话"""
    __tablename__ = "chat_sessions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user1_id = Column(String, ForeignKey("users.id"), nullable=False)  # 用户1（按字典序较小的ID）
    user2_id = Column(String, ForeignKey("users.id"), nullable=False)  # 用户2（按字典序较大的ID）
    
    # 会话状态
    status = Column(String(20), default="active")  # active, archived, blocked
    last_message_at = Column(DateTime)  # 最后消息时间
    message_count = Column(Integer, default=0)  # 消息总数
    
    # 用户在线状态（用于WebSocket连接管理）
    user1_online = Column(Boolean, default=False)
    user2_online = Column(Boolean, default=False)
    user1_last_seen = Column(DateTime)
    user2_last_seen = Column(DateTime)
    
    # 创建和更新时间
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 可选：关联的匹配关系（如果通过匹配开始聊天）
    related_match_relation_id = Column(String, ForeignKey("match_relations.id"), nullable=True)
    
    # 表约束：确保用户对唯一，且user1_id < user2_id
    __table_args__ = (
        UniqueConstraint('user1_id', 'user2_id', name='unique_user_pair'),
        Index('idx_chat_session_users', 'user1_id', 'user2_id'),
        Index('idx_chat_session_status', 'status'),
        Index('idx_chat_session_last_message', 'last_message_at'),
    )
    
    # Relationships
    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])
    related_match_relation = relationship("MatchRelation")
    messages = relationship("RealTimeMessage", back_populates="chat_session", order_by="RealTimeMessage.sequence_number")
    
    @staticmethod
    def get_ordered_user_ids(user_id1: str, user_id2: str) -> tuple[str, str]:
        """
        返回按字典序排序的用户ID对，确保user1_id < user2_id
        """
        if user_id1 < user_id2:
            return user_id1, user_id2
        else:
            return user_id2, user_id1
    
    @classmethod
    def get_session_id(cls, user_id1: str, user_id2: str) -> str:
        """
        根据两个用户ID生成唯一的会话标识符
        """
        ordered_ids = cls.get_ordered_user_ids(user_id1, user_id2)
        return f"chat_{ordered_ids[0]}_{ordered_ids[1]}"
    
    def is_participant(self, user_id: str) -> bool:
        """
        检查用户是否是此会话的参与者
        """
        return user_id in [self.user1_id, self.user2_id]
    
    def get_other_user_id(self, user_id: str) -> str:
        """
        获取会话中另一个用户的ID
        """
        if user_id == self.user1_id:
            return self.user2_id
        elif user_id == self.user2_id:
            return self.user1_id
        else:
            raise ValueError(f"User {user_id} is not a participant in this chat session")
    
    def update_user_online_status(self, user_id: str, is_online: bool):
        """
        更新用户在线状态
        """
        now = datetime.utcnow()
        if user_id == self.user1_id:
            self.user1_online = is_online
            if not is_online:
                self.user1_last_seen = now
        elif user_id == self.user2_id:
            self.user2_online = is_online
            if not is_online:
                self.user2_last_seen = now
        else:
            raise ValueError(f"User {user_id} is not a participant in this chat session")
        
        self.updated_at = now

class RealTimeMessage(Base):
    """实时聊天消息"""
    __tablename__ = "realtime_messages"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    chat_session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=False)
    sender_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String(20), default="text")  # text, system, image, etc.
    
    # 消息状态
    is_deleted = Column(Boolean, default=False)
    edited_at = Column(DateTime)  # 编辑时间
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 消息序号（用于排序和分页）
    sequence_number = Column(Integer, nullable=False)
    
    # 消息状态跟踪
    is_read = Column(Boolean, default=False)  # 是否已读
    read_at = Column(DateTime)  # 读取时间
    
    # 表约束和索引
    __table_args__ = (
        Index('idx_realtime_message_session_seq', 'chat_session_id', 'sequence_number'),
        Index('idx_realtime_message_session_time', 'chat_session_id', 'created_at'),
        Index('idx_realtime_message_sender', 'sender_user_id'),
        Index('idx_realtime_message_read_status', 'is_read'),
        UniqueConstraint('chat_session_id', 'sequence_number', name='unique_message_sequence'),
    )
    
    # Relationships
    chat_session = relationship("ChatSession", back_populates="messages")
    sender_user = relationship("User")

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

# 导出所有模型，便于其他模块导入
__all__ = [
    'User',
    'DigitalPersona', 
    'Scenario',
    'Conversation',
    'ConversationMessage',
    'MessageFeedback',
    'PromptOptimization',
    'MarketAgent',
    'MatchRelation',
    'ChatSession',  # 新增的聊天会话模型
    'RealTimeMessage',
    'AutoConversation',
    'AutoConversationMessage',
    'MatchEvaluation',
    'Base',
    'engine',
    'SessionLocal',
    'get_db',
    'create_tables',
    'init_database'
]

if __name__ == "__main__":
    init_database() 