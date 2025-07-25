from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import uuid
import random
from datetime import datetime
import json
import asyncio

from models.database import (
    get_db, User, DigitalPersona, Scenario, Conversation, ConversationMessage, 
    MessageFeedback, PromptOptimization, MarketAgent, MatchRelation, AutoConversation,
    AutoConversationMessage
)
from services.ai_service import ai_service, scenario_service
from services.match_service import match_service
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
    created_at: datetime

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
                created_at=conv.created_at
            ))
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取对话列表失败：{str(e)}"
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
        
        agent_response, metadata = await ai_service.generate_agent_response(
            system_prompt=persona.system_prompt,
            conversation_history=conversation_history,
            scenario_context=scenario.context,
            user_message=message_data.content
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
    match_type: str
    love_compatibility_score: float
    friendship_compatibility_score: float
    total_interactions: int
    last_conversation_at: Optional[datetime]
    created_at: datetime

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
                "display_name": target_agent.display_name,
                "display_description": target_agent.display_description,
                "tags": json.loads(target_agent.tags or "[]")
            },
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
            # 确定目标agent（如果当前用户是发起者，目标是target_agent；否则是initiator_agent）
            if match.initiator_user_id == current_user.id:
                target_agent = match.target_agent
            else:
                target_agent = match.initiator_agent
            
            result.append(MatchRelationResponse(
                id=str(match.id),
                target_agent={
                    "id": str(target_agent.id),
                    "display_name": target_agent.display_name,
                    "display_description": target_agent.display_description,
                    "tags": json.loads(target_agent.tags or "[]")
                },
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

@router.post("/match-relations/{match_id}/trigger-conversation")
async def trigger_conversation(
    match_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """手动触发一轮自动对话（异步执行）"""
    try:
        # 验证匹配关系存在且用户有权限
        match_relation = db.query(MatchRelation).filter(
            MatchRelation.id == match_id,
            (MatchRelation.initiator_user_id == current_user.id) | 
            (MatchRelation.target_user_id == current_user.id),
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
        # 验证匹配关系存在且用户有权限
        match_relation = db.query(MatchRelation).filter(
            MatchRelation.id == match_id,
            (MatchRelation.initiator_user_id == current_user.id) | 
            (MatchRelation.target_user_id == current_user.id),
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