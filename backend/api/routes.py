from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Dict, Any, Optional
import uuid
import random
from datetime import datetime
import json
import asyncio

from models.database import (
    get_db, User, DigitalPersona, Scenario, Conversation, ConversationMessage, 
    MessageFeedback, PromptOptimization, MarketAgent, MatchRelation, AutoConversation,
    AutoConversationMessage, RealTimeMessage
)
from services.ai_service import ai_service, scenario_service
from services.match_service import match_service
from services.chat_service import chat_service
from services.auth_service import auth_service
from services.task_service import task_service
from pydantic import BaseModel

# 创建路由
router = APIRouter()

# HTTP Bearer认证
security = HTTPBearer()

# Pydantic 模型
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str  # 可以是用户名或邮箱
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class DigitalPersonaCreate(BaseModel):
    name: str
    description: Optional[str] = None
    basic_info: Dict[str, Any] = {}

class DigitalPersonaResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    system_prompt: str
    optimization_count: int
    personality_score: float
    created_at: datetime

class ConversationCreate(BaseModel):
    digital_persona_id: str
    scenario_id: str
    title: Optional[str] = None

class ConversationResponse(BaseModel):
    id: str
    title: Optional[str]
    scenario: Dict[str, Any]
    digital_persona_id: str
    created_at: datetime

class ConversationWithStats(BaseModel):
    id: str
    title: Optional[str]
    scenario: Dict[str, Any]
    digital_persona_id: str
    created_at: datetime
    message_count: int
    last_message: Optional[str]
    duration: str

class PaginatedConversationsResponse(BaseModel):
    conversations: List[ConversationWithStats]
    total: int
    page: int
    size: int
    total_pages: int

class MessageCreate(BaseModel):
    conversation_id: str
    content: str

class MessageResponse(BaseModel):
    id: str
    sender_type: str
    content: str
    created_at: datetime
    message_index: int

class FeedbackCreate(BaseModel):
    conversation_id: str
    message_id: str
    feedback_type: str  # 'like', 'dislike', 'correction'
    feedback_content: Optional[str] = None

class PersonalityAnswer(BaseModel):
    question_id: str
    selected_option: str
    option_index: int

class PersonalityQuestionRequest(BaseModel):
    previous_answers: List[Dict[str, Any]] = []
    scenario: Dict[str, Any]

class MarketConversationCreate(BaseModel):
    target_persona_id: str
    title: Optional[str] = None

class RealTimeMessageResponse(BaseModel):
    id: str
    sender_user_id: str
    sender_name: str
    content: str
    message_type: str
    sequence_number: int
    created_at: datetime
    is_deleted: bool

# 用户认证依赖
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """获取当前认证用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 验证token
    user_id = auth_service.verify_token(credentials.credentials)
    if user_id is None:
        raise credentials_exception
    
    # 获取用户
    user = auth_service.get_user_by_id(db, user_id)
    if user is None:
        raise credentials_exception
    
    return user

# 用户认证相关路由

@router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """用户注册"""
    try:
        # 创建用户
        user = auth_service.create_user(
            db=db,
            username=user_data.username,
            email=user_data.email,
            password=user_data.password
        )
        
        # 生成访问token
        access_token = auth_service.create_access_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserResponse(
                id=str(user.id),
                username=user.username,
                email=user.email,
                created_at=user.created_at
            )
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"注册失败：{str(e)}"
        )

@router.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """用户登录"""
    try:
        # 验证用户凭证
        user = auth_service.authenticate_user(
            db=db,
            username=login_data.username,
            password=login_data.password
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码错误",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 生成访问token
        access_token = auth_service.create_access_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserResponse(
                id=str(user.id),
                username=user.username,
                email=user.email,
                created_at=user.created_at
            )
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"登录失败：{str(e)}"
        )

@router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    return UserResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        created_at=current_user.created_at
    )

@router.post("/users", response_model=UserResponse)
async def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """创建新用户"""
    try:
        # 检查用户是否已存在
        existing_user = db.query(User).filter(
            (User.username == user_data.username) | (User.email == user_data.email)
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名或邮箱已存在"
            )
        
        # 创建新用户（这里应该对密码进行哈希处理）
        user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=user_data.password  # 实际应用中需要哈希
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return UserResponse(
            id=str(user.id),
            username=user.username,
            email=user.email,
            created_at=user.created_at
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建用户失败：{str(e)}"
        )

@router.get("/scenarios", response_model=List[Dict[str, Any]])
async def get_scenarios(db: Session = Depends(get_db)):
    """获取所有场景"""
    try:
        # 先从数据库获取
        scenarios = db.query(Scenario).filter(Scenario.is_active == True).all()
        
        # 如果数据库为空，使用预定义场景并保存到数据库
        if not scenarios:
            predefined_scenarios = scenario_service.get_predefined_scenarios()
            for scenario_data in predefined_scenarios:
                scenario = Scenario(
                    name=scenario_data["name"],
                    description=scenario_data["description"],
                    context=scenario_data["context"],
                    category=scenario_data["category"],
                    difficulty_level=scenario_data["difficulty_level"]
                )
                db.add(scenario)
            
            db.commit()
            scenarios = db.query(Scenario).filter(Scenario.is_active == True).all()
        
        return [
            {
                "id": str(scenario.id),
                "name": scenario.name,
                "description": scenario.description,
                "context": scenario.context,
                "category": scenario.category,
                "difficulty_level": scenario.difficulty_level
            }
            for scenario in scenarios
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取场景失败：{str(e)}"
        )

@router.post("/digital-personas", response_model=DigitalPersonaResponse)
async def create_digital_persona(
    persona_data: DigitalPersonaCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建数字人格"""
    try:
        # 生成初始system prompt
        initial_prompt = await ai_service.generate_initial_prompt(persona_data.basic_info, persona_data.description)
        
        # 创建数字人格
        persona = DigitalPersona(
            user_id=current_user.id,
            name=persona_data.name,
            description=persona_data.description,
            system_prompt=initial_prompt,
            initial_prompt=initial_prompt
        )
        
        db.add(persona)
        db.commit()
        db.refresh(persona)
        
        return DigitalPersonaResponse(
            id=str(persona.id),
            name=persona.name,
            description=persona.description,
            system_prompt=persona.system_prompt,
            optimization_count=persona.optimization_count,
            personality_score=persona.personality_score,
            created_at=persona.created_at
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建数字人格失败：{str(e)}"
        )

@router.get("/digital-personas", response_model=List[DigitalPersonaResponse])
async def get_digital_personas(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取用户的数字人格列表"""
    try:
        personas = db.query(DigitalPersona).filter(
            DigitalPersona.user_id == current_user.id,
            DigitalPersona.is_active == True
        ).all()
        
        return [
            DigitalPersonaResponse(
                id=str(persona.id),
                name=persona.name,
                description=persona.description,
                system_prompt=persona.system_prompt,
                optimization_count=persona.optimization_count,
                personality_score=persona.personality_score,
                created_at=persona.created_at
            )
            for persona in personas
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取数字人格列表失败：{str(e)}"
        )

@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    conv_data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建新对话"""
    try:
        # 验证数字人格和场景是否存在
        persona = db.query(DigitalPersona).filter(
            DigitalPersona.id == conv_data.digital_persona_id,
            DigitalPersona.user_id == current_user.id
        ).first()
        
        if not persona:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="数字人格不存在"
            )
        
        scenario = db.query(Scenario).filter(Scenario.id == conv_data.scenario_id).first()
        if not scenario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="场景不存在"
            )
        
        # 创建对话
        conversation = Conversation(
            user_id=current_user.id,
            digital_persona_id=persona.id,
            scenario_id=scenario.id,
            title=conv_data.title or f"与{persona.name}的对话"
        )
        
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        
        return ConversationResponse(
            id=str(conversation.id),
            title=conversation.title,
            scenario={
                "id": str(scenario.id),
                "name": scenario.name,
                "description": scenario.description,
                "context": scenario.context,
                "category": scenario.category,
                "difficulty_level": scenario.difficulty_level
            },
            digital_persona_id=str(persona.id),
            created_at=conversation.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建对话失败：{str(e)}"
        )

@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取用户的对话列表"""
    try:
        conversations = db.query(Conversation).filter(
            Conversation.user_id == current_user.id,
            Conversation.is_active == True
        ).order_by(Conversation.updated_at.desc()).all()
        
        result = []
        for conv in conversations:
            scenario = conv.scenario
            result.append(ConversationResponse(
                id=str(conv.id),
                title=conv.title,
                scenario={
                    "id": str(scenario.id),
                    "name": scenario.name,
                    "description": scenario.description,
                    "context": scenario.context,
                    "category": scenario.category,
                    "difficulty_level": scenario.difficulty_level
                },
                digital_persona_id=str(conv.digital_persona_id),
                created_at=conv.created_at
            ))
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取对话列表失败：{str(e)}"
        )

@router.get("/conversations/paginated", response_model=PaginatedConversationsResponse)
async def get_conversations_paginated(
    page: int = 1,
    size: int = 10,
    search: Optional[str] = None,
    category: Optional[str] = None,
    sort_by: str = "date_desc",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取用户的对话列表（分页）"""
    try:
        # 基础查询
        query = db.query(Conversation).filter(
            Conversation.user_id == current_user.id,
            Conversation.is_active == True
        )
        
        # 搜索筛选
        if search:
            search_term = f"%{search}%"
            query = query.join(Scenario).filter(
                or_(
                    Conversation.title.ilike(search_term),
                    Scenario.name.ilike(search_term),
                    Scenario.description.ilike(search_term)
                )
            )
        
        # 分类筛选
        if category and category != "all":
            query = query.join(Scenario).filter(Scenario.category == category)
        
        # 排序
        if sort_by == "date_desc":
            query = query.order_by(Conversation.updated_at.desc())
        elif sort_by == "date_asc":
            query = query.order_by(Conversation.updated_at.asc())
        elif sort_by == "title":
            query = query.order_by(Conversation.title.asc())
        else:
            query = query.order_by(Conversation.updated_at.desc())
        
        # 获取总数
        total = query.count()
        
        # 分页
        offset = (page - 1) * size
        conversations = query.offset(offset).limit(size).all()
        
        # 计算总页数
        total_pages = (total + size - 1) // size
        
        # 构建结果
        result_conversations = []
        for conv in conversations:
            # 获取消息统计
            message_count = db.query(ConversationMessage).filter(
                ConversationMessage.conversation_id == conv.id
            ).count()
            
            # 获取最后一条消息
            last_message_obj = db.query(ConversationMessage).filter(
                ConversationMessage.conversation_id == conv.id
            ).order_by(ConversationMessage.created_at.desc()).first()
            
            last_message = None
            if last_message_obj:
                content = last_message_obj.content
                if len(content) > 50:
                    last_message = content[:50] + "..."
                else:
                    last_message = content
            
            # 计算时间差
            duration = calculate_duration(conv.created_at)
            
            scenario = conv.scenario
            result_conversations.append(ConversationWithStats(
                id=str(conv.id),
                title=conv.title,
                scenario={
                    "id": str(scenario.id),
                    "name": scenario.name,
                    "description": scenario.description,
                    "context": scenario.context,
                    "category": scenario.category,
                    "difficulty_level": scenario.difficulty_level
                },
                digital_persona_id=str(conv.digital_persona_id),
                created_at=conv.created_at,
                message_count=message_count,
                last_message=last_message or "暂无消息",
                duration=duration
            ))
        
        return PaginatedConversationsResponse(
            conversations=result_conversations,
            total=total,
            page=page,
            size=size,
            total_pages=total_pages
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取对话列表失败：{str(e)}"
        )

def calculate_duration(created_at: datetime) -> str:
    """计算时间差"""
    from datetime import datetime as dt, timezone
    
    now = dt.now(timezone.utc)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    
    diff = now - created_at
    
    days = diff.days
    hours = diff.seconds // 3600
    minutes = (diff.seconds % 3600) // 60
    
    if days > 0:
        return f"{days}天前"
    elif hours > 0:
        return f"{hours}小时前"
    elif minutes > 0:
        return f"{minutes}分钟前"
    else:
        return "刚刚"

@router.post("/market-conversations", response_model=ConversationResponse)
async def create_market_conversation(
    conv_data: MarketConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建市场聊天对话（与其他用户的数字人格聊天）"""
    try:
        # 验证目标数字人格是否存在且在市场中
        target_persona = db.query(DigitalPersona).filter(
            DigitalPersona.id == conv_data.target_persona_id,
            DigitalPersona.is_active == True
        ).first()
        
        if not target_persona:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="目标数字人格不存在"
            )
        
        # 检查目标数字人格是否在市场中（有对应的MarketAgent）
        market_agent = db.query(MarketAgent).filter(
            MarketAgent.digital_persona_id == conv_data.target_persona_id,
            MarketAgent.is_active == True
        ).first()
        
        if not market_agent:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="该数字人格未在市场中投放，无法聊天"
            )
        
        # 获取默认场景（初次见面）
        scenario = db.query(Scenario).filter(
            Scenario.category == "初次见面",
            Scenario.is_active == True
        ).first()
        
        if not scenario:
            # 如果没有初次见面场景，使用第一个可用场景
            scenario = db.query(Scenario).filter(Scenario.is_active == True).first()
            
        if not scenario:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="没有可用的对话场景"
            )
        
        # 创建市场对话
        conversation = Conversation(
            user_id=current_user.id,
            digital_persona_id=target_persona.id,  # 使用目标数字人格
            scenario_id=scenario.id,
            title=conv_data.title or f"与{target_persona.name}的市场聊天"
        )
        
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        
        return ConversationResponse(
            id=str(conversation.id),
            title=conversation.title,
            scenario={
                "id": str(scenario.id),
                "name": scenario.name,
                "description": scenario.description,
                "context": scenario.context,
                "category": scenario.category,
                "difficulty_level": scenario.difficulty_level
            },
            digital_persona_id=str(target_persona.id),
            created_at=conversation.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建市场对话失败：{str(e)}"
        )

@router.post("/messages", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """发送消息并获取AI回复"""
    try:
        # 验证对话是否存在
        conversation = db.query(Conversation).filter(
            Conversation.id == message_data.conversation_id,
            Conversation.user_id == current_user.id
        ).first()
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="对话不存在"
            )
        
        # 获取对话历史
        existing_messages = db.query(ConversationMessage).filter(
            ConversationMessage.conversation_id == conversation.id
        ).order_by(ConversationMessage.message_index).all()
        
        # 保存用户消息
        user_message = ConversationMessage(
            conversation_id=conversation.id,
            sender_type="user",
            content=message_data.content,
            message_index=len(existing_messages)
        )
        
        db.add(user_message)
        db.commit()
        
        # 准备对话历史
        conversation_history = [
            {
                "sender_type": msg.sender_type,
                "content": msg.content
            }
            for msg in existing_messages
        ]
        
        # 生成AI回复
        persona = conversation.digital_persona
        scenario = conversation.scenario
        
        # 检查是否是市场对话（与其他用户的数字人格聊天）
        is_market_chat = persona.user_id != current_user.id
        
        agent_response, metadata = await ai_service.generate_agent_response(
            system_prompt=persona.system_prompt,
            conversation_history=conversation_history,
            scenario_context=scenario.context,
            user_message=message_data.content,
            is_market_chat=is_market_chat
        )
        
        # 保存AI回复
        ai_message = ConversationMessage(
            conversation_id=conversation.id,
            sender_type="agent",
            content=agent_response,
            message_index=len(existing_messages) + 1,
            prompt_used=metadata.get("prompt_used"),
            model_used=metadata.get("model_used"),
            tokens_used=metadata.get("tokens_used")
        )
        
        db.add(ai_message)
        
        # 更新对话时间
        conversation.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(ai_message)
        
        return MessageResponse(
            id=str(ai_message.id),
            sender_type=ai_message.sender_type,
            content=ai_message.content,
            created_at=ai_message.created_at,
            message_index=ai_message.message_index
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"发送消息失败：{str(e)}"
        )

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取对话的所有消息"""
    try:
        # 验证对话是否存在
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        ).first()
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="对话不存在"
            )
        
        messages = db.query(ConversationMessage).filter(
            ConversationMessage.conversation_id == conversation_id
        ).order_by(ConversationMessage.message_index).all()
        
        return [
            MessageResponse(
                id=str(msg.id),
                sender_type=msg.sender_type,
                content=msg.content,
                created_at=msg.created_at,
                message_index=msg.message_index
            )
            for msg in messages
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取对话消息失败：{str(e)}"
        )

@router.post("/feedback")
async def submit_feedback(
    feedback_data: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """提交反馈"""
    try:
        # 验证对话和消息是否存在
        conversation = db.query(Conversation).filter(
            Conversation.id == feedback_data.conversation_id,
            Conversation.user_id == current_user.id
        ).first()
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="对话不存在"
            )
        
        message = db.query(ConversationMessage).filter(
            ConversationMessage.id == feedback_data.message_id,
            ConversationMessage.conversation_id == conversation.id
        ).first()
        
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="消息不存在"
            )
        
        # 保存反馈
        feedback = MessageFeedback(
            conversation_id=conversation.id,
            message_id=message.id,
            feedback_type=feedback_data.feedback_type,
            feedback_content=feedback_data.feedback_content
        )
        
        db.add(feedback)
        db.commit()
        
        # 检查是否需要优化prompt
        optimization_result = await check_and_optimize_prompt(conversation.digital_persona_id, db)
        
        if optimization_result:
            return {
                "message": optimization_result["message"],
                "optimization_performed": True,
                "optimization_details": optimization_result.get("details")
            }
        else:
            return {
                "message": "反馈已记录，将用于后续优化",
                "optimization_performed": False
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"提交反馈失败：{str(e)}"
        )

async def check_and_optimize_prompt(persona_id: str, db: Session):
    """检查并优化prompt"""
    try:
        # 获取最近的反馈
        recent_feedbacks = db.query(MessageFeedback).join(Conversation).filter(
            Conversation.digital_persona_id == persona_id
        ).order_by(MessageFeedback.created_at.desc()).limit(10).all()
        
        # 如果有足够的反馈（特别是负面反馈或矫正），触发优化
        negative_feedbacks = [f for f in recent_feedbacks if f.feedback_type in ['dislike', 'correction']]
        
        if len(negative_feedbacks) >= 2:  # 有2个或以上负面反馈时触发优化
            persona = db.query(DigitalPersona).filter(DigitalPersona.id == persona_id).first()
            if not persona:
                return None
            
            # 获取对话上下文
            recent_conversations = db.query(ConversationMessage).join(Conversation).filter(
                Conversation.digital_persona_id == persona_id
            ).order_by(ConversationMessage.created_at.desc()).limit(20).all()
            
            conversation_context = [
                {
                    "sender_type": msg.sender_type,
                    "content": msg.content
                }
                for msg in reversed(recent_conversations)
            ]
            
            # 准备反馈数据
            feedback_data = [
                {
                    "feedback_type": f.feedback_type,
                    "feedback_content": f.feedback_content,
                    "created_at": f.created_at.isoformat()
                }
                for f in recent_feedbacks
            ]
            
            # 调用AI优化prompt
            new_prompt, optimization_reason, improvement_score = await ai_service.optimize_system_prompt(
                current_prompt=persona.system_prompt,
                feedback_data=feedback_data,
                conversation_context=conversation_context
            )
            
            if new_prompt != persona.system_prompt:
                # 保存优化记录
                optimization = PromptOptimization(
                    digital_persona_id=persona.id,
                    old_prompt=persona.system_prompt,
                    new_prompt=new_prompt,
                    optimization_reason=optimization_reason,
                    feedback_data=json.dumps(feedback_data),
                    improvement_score=improvement_score
                )
                
                db.add(optimization)
                
                # 更新persona
                persona.system_prompt = new_prompt
                persona.optimization_count += 1
                persona.personality_score = min(persona.personality_score + improvement_score * 0.1, 1.0)
                
                db.commit()
                
                print(f"Prompt optimized for persona {persona_id}: {optimization_reason}")
                
                return {
                    "message": f"数字人格已基于反馈进行优化！{optimization_reason[:50]}...",
                    "details": {
                        "optimization_reason": optimization_reason,
                        "improvement_score": improvement_score,
                        "optimization_count": persona.optimization_count
                    }
                }
        
        return None
        
    except Exception as e:
        print(f"Error in prompt optimization: {e}")
        return None

@router.get("/digital-personas/{persona_id}/optimization-history")
async def get_optimization_history(
    persona_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取数字人格的优化历史"""
    try:
        # 验证persona是否属于当前用户
        persona = db.query(DigitalPersona).filter(
            DigitalPersona.id == persona_id,
            DigitalPersona.user_id == current_user.id
        ).first()
        
        if not persona:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="数字人格不存在"
            )
        
        optimizations = db.query(PromptOptimization).filter(
            PromptOptimization.digital_persona_id == persona_id
        ).order_by(PromptOptimization.created_at.desc()).all()
        
        return [
            {
                "id": str(opt.id),
                "old_prompt": opt.old_prompt,
                "new_prompt": opt.new_prompt,
                "optimization_reason": opt.optimization_reason,
                "improvement_score": opt.improvement_score,
                "created_at": opt.created_at
            }
            for opt in optimizations
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取优化历史失败：{str(e)}"
        )

@router.post("/digital-personas/{persona_id}/personality-question")
async def get_personality_question(
    persona_id: str,
    request_data: PersonalityQuestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取下一个人格测评问题"""
    try:
        # 验证persona是否属于当前用户
        persona = db.query(DigitalPersona).filter(
            DigitalPersona.id == persona_id,
            DigitalPersona.user_id == current_user.id
        ).first()
        
        if not persona:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="数字人格不存在"
            )
        
        # 生成下一个问题
        question_data = await ai_service.generate_personality_question(
            persona=persona,
            previous_answers=request_data.previous_answers,
            scenario=request_data.scenario
        )
        
        return question_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"生成问题失败：{str(e)}"
        )

@router.post("/digital-personas/{persona_id}/personality-answer")
async def submit_personality_answer(
    persona_id: str,
    answer_data: PersonalityAnswer,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """提交人格测评答案并优化prompt"""
    try:
        # 验证persona是否属于当前用户
        persona = db.query(DigitalPersona).filter(
            DigitalPersona.id == persona_id,
            DigitalPersona.user_id == current_user.id
        ).first()
        
        if not persona:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="数字人格不存在"
            )
        
        # 处理答案并优化prompt
        result = await ai_service.process_personality_answer(
            persona=persona,
            answer=answer_data.dict(),
            db=db
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"处理答案失败：{str(e)}"
        )

# 情感匹配相关的Pydantic模型
class MarketAgentCreate(BaseModel):
    digital_persona_id: str
    market_type: str  # 'love' or 'friendship'
    display_name: str
    display_description: str
    tags: Optional[List[str]] = []

class MarketAgentResponse(BaseModel):
    id: str
    user_id: str
    digital_persona_id: str
    market_type: str
    display_name: str
    display_description: str
    tags: List[str]
    last_interaction: datetime
    created_at: datetime

class MatchRelationCreate(BaseModel):
    target_agent_id: str
    match_type: str  # 'love' or 'friendship'

class MatchRelationResponse(BaseModel):
    id: str
    target_agent: Dict[str, Any]
    target_user_id: Optional[str]
    match_type: str
    love_compatibility_score: float
    friendship_compatibility_score: float
    total_interactions: int
    last_conversation_at: Optional[datetime]
    created_at: datetime
    has_realtime_messages: Optional[bool] = False  # 是否有实时聊天消息

# 情感匹配相关路由

@router.post("/market-agents", response_model=MarketAgentResponse)
async def create_market_agent(
    agent_data: MarketAgentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """投放数字人格到情感匹配市场"""
    try:
        # 验证数字人格存在且属于当前用户
        persona = db.query(DigitalPersona).filter(
            DigitalPersona.id == agent_data.digital_persona_id,
            DigitalPersona.user_id == current_user.id,
            DigitalPersona.is_active == True
        ).first()
        
        if not persona:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="数字人格不存在或不属于您"
            )
        
        # 创建市场agent
        market_agent = match_service.create_market_agent(
            db=db,
            user_id=current_user.id,
            digital_persona_id=agent_data.digital_persona_id,
            market_type=agent_data.market_type,
            display_name=agent_data.display_name,
            display_description=agent_data.display_description,
            tags=agent_data.tags
        )
        
        return MarketAgentResponse(
            id=str(market_agent.id),
            user_id=str(market_agent.user_id),
            digital_persona_id=str(market_agent.digital_persona_id),
            market_type=market_agent.market_type,
            display_name=market_agent.display_name,
            display_description=market_agent.display_description,
            tags=json.loads(market_agent.tags or "[]"),
            last_interaction=market_agent.last_interaction,
            created_at=market_agent.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"投放数字人格失败：{str(e)}"
        )

@router.get("/market-agents", response_model=List[MarketAgentResponse])
async def get_market_agents(
    market_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取情感匹配市场中的数字人格列表"""
    try:
        agents = match_service.get_market_agents(
            db=db,
            market_type=market_type,
            exclude_user_id=current_user.id  # 排除自己的数字人格
        )
        
        return [
            MarketAgentResponse(
                id=str(agent.id),
                user_id=str(agent.user_id),
                digital_persona_id=str(agent.digital_persona_id),
                market_type=agent.market_type,
                display_name=agent.display_name,
                display_description=agent.display_description,
                tags=json.loads(agent.tags or "[]"),
                last_interaction=agent.last_interaction,
                created_at=agent.created_at
            )
            for agent in agents
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取市场列表失败：{str(e)}"
        )

@router.get("/market-agents/my", response_model=List[MarketAgentResponse])
async def get_my_market_agents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取用户投放的数字人格列表"""
    try:
        agents = db.query(MarketAgent).filter(
            MarketAgent.user_id == current_user.id,
            MarketAgent.is_active == True
        ).all()
        
        return [
            MarketAgentResponse(
                id=str(agent.id),
                user_id=str(agent.user_id),
                digital_persona_id=str(agent.digital_persona_id),
                market_type=agent.market_type,
                display_name=agent.display_name,
                display_description=agent.display_description,
                tags=json.loads(agent.tags or "[]"),
                last_interaction=agent.last_interaction,
                created_at=agent.created_at
            )
            for agent in agents
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取我的市场数字人格失败：{str(e)}"
        )

@router.post("/match-relations", response_model=MatchRelationResponse)
async def create_match_relation(
    match_data: MatchRelationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建匹配关系（添加其他用户的agent到匹配列表）"""
    try:
        match_relation = match_service.create_match_relation(
            db=db,
            initiator_user_id=current_user.id,
            target_agent_id=match_data.target_agent_id,
            match_type=match_data.match_type
        )
        
        # 获取目标agent信息用于响应
        target_agent = db.query(MarketAgent).filter(MarketAgent.id == match_data.target_agent_id).first()
        
        return MatchRelationResponse(
            id=str(match_relation.id),
            target_agent={
                "id": str(target_agent.id),
                "digital_persona_id": str(target_agent.digital_persona_id),
                "display_name": target_agent.display_name,
                "display_description": target_agent.display_description,
                "tags": json.loads(target_agent.tags or "[]")
            },
            target_user_id=str(match_relation.target_user_id),
            match_type=match_relation.match_type,
            love_compatibility_score=match_relation.love_compatibility_score,
            friendship_compatibility_score=match_relation.friendship_compatibility_score,
            total_interactions=match_relation.total_interactions,
            last_conversation_at=match_relation.last_conversation_at,
            created_at=match_relation.created_at
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建匹配关系失败：{str(e)}"
        )

@router.get("/match-relations", response_model=List[MatchRelationResponse])
async def get_match_relations(
    match_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取用户的匹配关系列表"""
    try:
        matches = match_service.get_user_matches(
            db=db,
            user_id=current_user.id,
            match_type=match_type
        )
        
        result = []
        for match in matches:
            # 现在只返回用户作为发起者的匹配，所以target_agent就是目标agent
            target_agent = match.target_agent
            target_user_id = match.target_user_id
            
            result.append(MatchRelationResponse(
                id=str(match.id),
                target_agent={
                    "id": str(target_agent.id),
                    "digital_persona_id": str(target_agent.digital_persona_id),
                    "display_name": target_agent.display_name,
                    "display_description": target_agent.display_description,
                    "tags": json.loads(target_agent.tags or "[]")
                },
                target_user_id=str(target_user_id),
                match_type=match.match_type,
                love_compatibility_score=match.love_compatibility_score,
                friendship_compatibility_score=match.friendship_compatibility_score,
                total_interactions=match.total_interactions,
                last_conversation_at=match.last_conversation_at,
                created_at=match.created_at
            ))
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取匹配关系失败：{str(e)}"
        )

@router.get("/followers", response_model=List[MatchRelationResponse])
async def get_followers(
    match_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取关注你的用户列表（别人匹配了你但你没有匹配他们）"""
    try:
        from models.database import RealTimeMessage
        
        followers = match_service.get_followers(
            db=db,
            user_id=current_user.id,
            match_type=match_type
        )
        
        result = []
        for relation in followers:
            # 获取发起者的agent信息
            initiator_agent = relation.initiator_agent
            
            # 检查是否有实时聊天消息
            has_realtime_messages = db.query(RealTimeMessage).filter(
                RealTimeMessage.match_relation_id == relation.id,
                RealTimeMessage.is_deleted == False
            ).first() is not None
            
            # 构建响应，这里target_agent实际是initiator_agent（关注者的agent）
            result.append(MatchRelationResponse(
                id=str(relation.id),
                target_agent={
                    "id": str(initiator_agent.id),
                    "digital_persona_id": str(initiator_agent.digital_persona_id),
                    "display_name": initiator_agent.display_name,
                    "display_description": initiator_agent.display_description,
                    "tags": json.loads(initiator_agent.tags or "[]")
                },
                target_user_id=str(relation.initiator_user_id),
                match_type=relation.match_type,
                love_compatibility_score=relation.love_compatibility_score,
                friendship_compatibility_score=relation.friendship_compatibility_score,
                total_interactions=relation.total_interactions,
                last_conversation_at=relation.last_conversation_at,
                created_at=relation.created_at,
                has_realtime_messages=has_realtime_messages
            ))
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取关注者失败：{str(e)}"
        )

@router.delete("/match-relations/{match_id}")
async def cancel_match_relation(
    match_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """取消匹配关系"""
    try:
        success = match_service.cancel_match_relation(
            db=db,
            match_id=match_id,
            user_id=current_user.id
        )
        
        if success:
            return {"message": "匹配关系已取消", "match_id": match_id}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="取消匹配失败"
            )
            
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"取消匹配失败：{str(e)}"
        )

@router.post("/match-relations/{match_id}/trigger-conversation")
async def trigger_conversation(
    match_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """手动触发一轮自动对话（异步执行）"""
    try:
        # 验证匹配关系存在且用户有权限（只有发起者可以触发对话）
        match_relation = db.query(MatchRelation).filter(
            MatchRelation.id == match_id,
            MatchRelation.initiator_user_id == current_user.id,
            MatchRelation.status == "active"
        ).first()
        
        if not match_relation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="匹配关系不存在或无权限"
            )
        
        # 随机选择一个场景
        scenarios = db.query(Scenario).filter(Scenario.is_active == True).all()
        if not scenarios:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="没有可用的对话场景"
            )
        
        scenario = random.choice(scenarios)
        
        # 创建后台任务
        task_id = task_service.create_task(
            task_type="conversation",
            match_relation_id=match_id,
            scenario_id=str(scenario.id)
        )
        
        # 异步执行对话任务
        asyncio.create_task(
            task_service.execute_conversation_task(
                task_id=task_id,
                match_relation_id=match_id,
                scenario_id=str(scenario.id),
                max_turns=random.randint(6, 12)
            )
        )
        
        return {
            "message": "对话任务已创建，正在后台处理",
            "task_id": task_id,
            "scenario": scenario.name,
            "status": "pending"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建对话任务失败：{str(e)}"
        )

@router.get("/tasks/{task_id}/status")
async def get_task_status(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """获取任务状态"""
    try:
        task_status = task_service.get_task_status(task_id)
        
        if not task_status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="任务不存在"
            )
        
        return task_status
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取任务状态失败：{str(e)}"
        )

@router.get("/match-relations/{match_id}/conversations")
async def get_match_conversations(
    match_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取匹配关系的对话历史"""
    try:
        # 验证匹配关系存在且用户有权限（只有发起者可以查看对话历史）
        match_relation = db.query(MatchRelation).filter(
            MatchRelation.id == match_id,
            MatchRelation.initiator_user_id == current_user.id,
            MatchRelation.status == "active"
        ).first()
        
        if not match_relation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="匹配关系不存在或无权限"
            )
        
        # 获取所有对话记录
        auto_conversations = db.query(AutoConversation).filter(
            AutoConversation.match_relation_id == match_id,
            AutoConversation.status == "completed"
        ).order_by(AutoConversation.created_at.desc()).limit(10).all()  # 限制最近10次对话
        
        result = []
        for auto_conv in auto_conversations:
            # 获取对话消息
            messages = db.query(AutoConversationMessage).filter(
                AutoConversationMessage.auto_conversation_id == auto_conv.id
            ).order_by(AutoConversationMessage.message_index).all()
            
            result.append({
                "id": str(auto_conv.id),
                "scenario": {
                    "id": str(auto_conv.scenario.id),
                    "name": auto_conv.scenario.name,
                    "description": auto_conv.scenario.description
                },
                "started_at": auto_conv.started_at,
                "ended_at": auto_conv.ended_at,
                "actual_turns": auto_conv.actual_turns,
                "love_score_change": auto_conv.round_love_score,
                "friendship_score_change": auto_conv.round_friendship_score,
                "termination_reason": auto_conv.termination_reason,
                "messages": [
                    {
                        "id": str(msg.id),
                        "sender_agent_name": msg.sender_agent.display_name,
                        "content": msg.content,
                        "message_index": msg.message_index,
                        "created_at": msg.created_at
                    }
                    for msg in messages
                ]
            })
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取对话历史失败：{str(e)}"
        )

@router.get("/match-relations/{match_id}/realtime-messages", response_model=List[RealTimeMessageResponse])
async def get_realtime_messages(
    match_id: str,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取实时聊天消息历史"""
    try:
        # 验证匹配关系存在且用户有权限
        match_relation = db.query(MatchRelation).filter(
            MatchRelation.id == match_id,
            (MatchRelation.initiator_user_id == current_user.id) | 
            (MatchRelation.target_user_id == current_user.id)
        ).first()
        
        if not match_relation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="匹配关系不存在或无权限"
            )
        
        # 获取实时聊天消息
        messages = db.query(RealTimeMessage).filter(
            RealTimeMessage.match_relation_id == match_id,
            RealTimeMessage.is_deleted == False
        ).order_by(RealTimeMessage.sequence_number.desc()).offset(offset).limit(limit).all()
        
        # 构建响应
        result = []
        for msg in reversed(messages):  # 反转以获得正确的时间顺序
            sender_user = db.query(User).filter(User.id == msg.sender_user_id).first()
            result.append(RealTimeMessageResponse(
                id=str(msg.id),
                sender_user_id=str(msg.sender_user_id),
                sender_name=sender_user.username if sender_user else "未知用户",
                content=msg.content,
                message_type=msg.message_type,
                sequence_number=msg.sequence_number,
                created_at=msg.created_at,
                is_deleted=msg.is_deleted
            ))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取实时聊天消息失败：{str(e)}"
        )

# 新的基于ChatSession的聊天API

class ChatSessionResponse(BaseModel):
    id: str
    user1_id: str
    user2_id: str
    status: str
    message_count: int
    last_message_at: Optional[datetime]
    created_at: datetime
    
class ChatMessageResponse(BaseModel):
    id: str
    sender_user_id: str
    sender_name: str
    content: str
    message_type: str
    sequence_number: int
    is_read: bool
    created_at: datetime

class ChatMessageCreate(BaseModel):
    other_user_id: str
    content: str
    message_type: str = "text"

@router.get("/chat-sessions", response_model=List[ChatSessionResponse])
async def get_user_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取用户的所有聊天会话"""
    try:
        sessions = chat_service.get_user_chat_sessions(
            db=db,
            user_id=current_user.id,
            status="active"
        )
        
        return [
            ChatSessionResponse(
                id=str(session.id),
                user1_id=str(session.user1_id),
                user2_id=str(session.user2_id),
                status=session.status,
                message_count=session.message_count,
                last_message_at=session.last_message_at,
                created_at=session.created_at
            )
            for session in sessions
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取聊天会话列表失败：{str(e)}"
        )

@router.post("/chat-sessions", response_model=ChatSessionResponse)
async def create_or_get_chat_session(
    other_user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建或获取与指定用户的聊天会话"""
    try:
        # 验证对方用户是否存在
        other_user = db.query(User).filter(User.id == other_user_id).first()
        if not other_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="目标用户不存在"
            )
        
        # 不能与自己聊天
        if other_user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="不能与自己聊天"
            )
        
        session = chat_service.get_or_create_chat_session(
            db=db,
            user_id1=current_user.id,
            user_id2=other_user_id
        )
        
        return ChatSessionResponse(
            id=str(session.id),
            user1_id=str(session.user1_id),
            user2_id=str(session.user2_id),
            status=session.status,
            message_count=session.message_count,
            last_message_at=session.last_message_at,
            created_at=session.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建聊天会话失败：{str(e)}"
        )

@router.get("/chat-sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
async def get_chat_messages(
    session_id: str,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取聊天会话的消息列表"""
    try:
        # 验证用户是否有权限访问此会话
        session = chat_service.get_chat_session_by_id(db, session_id)
        if not session or not session.is_participant(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="无权限访问此聊天会话"
            )
        
        messages = chat_service.get_messages(
            db=db,
            session_id=session_id,
            limit=limit,
            offset=offset
        )
        
        result = []
        for msg in messages:
            sender_user = db.query(User).filter(User.id == msg.sender_user_id).first()
            result.append(ChatMessageResponse(
                id=str(msg.id),
                sender_user_id=str(msg.sender_user_id),
                sender_name=sender_user.username if sender_user else "未知用户",
                content=msg.content,
                message_type=msg.message_type,
                sequence_number=msg.sequence_number,
                is_read=msg.is_read,
                created_at=msg.created_at
            ))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取聊天消息失败：{str(e)}"
        )

@router.post("/chat-sessions/{session_id}/messages", response_model=ChatMessageResponse)
async def send_chat_message(
    session_id: str,
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """发送聊天消息"""
    try:
        # 验证用户是否有权限访问此会话
        session = chat_service.get_chat_session_by_id(db, session_id)
        if not session or not session.is_participant(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="无权限访问此聊天会话"
            )
        
        message = chat_service.send_message(
            db=db,
            session_id=session_id,
            sender_user_id=current_user.id,
            content=message_data.content,
            message_type=message_data.message_type
        )
        
        if not message:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="发送消息失败"
            )
        
        return ChatMessageResponse(
            id=str(message.id),
            sender_user_id=str(message.sender_user_id),
            sender_name=current_user.username,
            content=message.content,
            message_type=message.message_type,
            sequence_number=message.sequence_number,
            is_read=message.is_read,
            created_at=message.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"发送消息失败：{str(e)}"
        )

@router.put("/chat-sessions/{session_id}/messages/mark-read")
async def mark_messages_as_read(
    session_id: str,
    up_to_sequence: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """标记消息为已读"""
    try:
        # 验证用户是否有权限访问此会话
        session = chat_service.get_chat_session_by_id(db, session_id)
        if not session or not session.is_participant(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="无权限访问此聊天会话"
            )
        
        success = chat_service.mark_messages_as_read(
            db=db,
            session_id=session_id,
            user_id=current_user.id,
            up_to_sequence=up_to_sequence
        )
        
        if success:
            return {"message": "消息已标记为已读"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="标记消息失败"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"标记消息失败：{str(e)}"
        )