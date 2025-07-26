"""
情感匹配服务
处理数字人格匹配、自动对话、匹配度评估等功能
"""

import json
import random
from datetime import datetime, timedelta
from shutil import ExecError
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case

from models.database import (
    MarketAgent, MatchRelation, AutoConversation, AutoConversationMessage,
    MatchEvaluation, DigitalPersona, Scenario, User
)
from services.ai_service import AIService

class MatchService:
    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service

    async def evaluate_message_compatibility(
        self,
        message: str,
        sender_agent: MarketAgent,
        receiver_agent: MarketAgent,
        conversation_context: List[Dict[str, str]],
        match_type: str = "love"
    ) -> Tuple[float, float, str]:
        """
        评估单条消息的匹配度影响
        返回: (恋爱匹配度变化, 友谊匹配度变化, 评估原因)
        """
        
        # 构建评估提示词
        evaluation_prompt = f"""
你是一个专业的情感关系分析师。请分析以下对话中的一条消息对两个数字人格之间匹配度的影响。

发送者人格信息:
名称: {sender_agent.display_name}
描述: {sender_agent.display_description}

接收者人格信息:
名称: {receiver_agent.display_name}
描述: {receiver_agent.display_description}

对话历史:
{self._format_conversation_context(conversation_context)}

当前消息: "{message}"

请从以下维度分析这条消息的影响:
1. 情感共鸣程度
2. 价值观契合度
3. 交流舒适度
4. 话题兴趣匹配
5. 人格互补性

基于分析，给出匹配度分数变化:
- 恋爱匹配度变化: -1到+1的浮点数 (负数表示降低，正数表示提高)
- 友谊匹配度变化: -1到+1的浮点数

请用以下JSON格式回复:
{{
    "love_score_delta": 浮点数,
    "friendship_score_delta": 浮点数,
    "analysis": "详细分析原因",
    "key_factors": ["影响因素1", "影响因素2", "..."]
}}
"""

        try:
            # 调用AI进行评估
            response = self.ai_service.client.chat.completions.create(
                model=self.ai_service.model,
                messages=[
                    {"role": "system", "content": "你是专业的情感关系分析师，专门评估数字人格之间的匹配度。"},
                    {"role": "user", "content": evaluation_prompt}
                ],
                temperature=0.3
            )
            
            result_text = response.choices[0].message.content
            
            # 解析JSON结果
            try:
                result = json.loads(result_text)
                love_delta = float(result.get("love_score_delta", 0))
                friendship_delta = float(result.get("friendship_score_delta", 0))
                analysis = result.get("analysis", "无分析说明")
                
                # 限制分数变化范围
                love_delta = max(-10, min(10, love_delta))
                friendship_delta = max(-10, min(10, friendship_delta))
                
                return love_delta, friendship_delta, analysis
                
            except (json.JSONDecodeError, ValueError):
                # 如果JSON解析失败，返回默认值
                return 0.0, 0.0, "评估解析失败"
                
        except Exception as e:
            print(f"匹配度评估失败: {e}")
            return 0.0, 0.0, f"评估失败: {str(e)}"

    async def conduct_auto_conversation(
        self,
        match_relation: MatchRelation,
        scenario: Scenario,
        max_turns: int = 10,
        db: Session = None
    ) -> AutoConversation:
        """
        执行一轮自动对话
        """
        
        # 创建自动对话记录
        auto_conv = AutoConversation(
            match_relation_id=match_relation.id,
            scenario_id=scenario.id,
            max_turns=max_turns,
            status="running",
            started_at=datetime.utcnow()
        )
        db.add(auto_conv)
        db.commit()
        db.refresh(auto_conv)
        
        try:
            # 获取两个agent的数字人格
            agent1 = match_relation.initiator_agent
            agent2 = match_relation.target_agent
            persona1 = agent1.digital_persona
            persona2 = agent2.digital_persona
            
            conversation_context = []
            total_love_score = 0.0
            total_friendship_score = 0.0
            
            # 随机选择谁先开始对话
            current_sender = agent1 if random.choice([True, False]) else agent2
            current_receiver = agent2 if current_sender == agent1 else agent1
            
            for turn in range(max_turns):
                # 构建对话上下文
                context_messages = [
                    {"sender_type": "system", "content": f"场景: {scenario.name}\n{scenario.context}"},
                    {"sender_type": "system", "content": f"对话对象: {current_receiver.display_name}"}
                ]
                
                # 生成AI回复
                if current_sender == agent1:
                    sender_persona = persona1
                else:
                    sender_persona = persona2
                
                # 添加历史对话（仅当有历史记录时）
                if conversation_context:
                    # 只保留最近6条消息，但不包括最后一条（避免重复）
                    for msg in conversation_context[-6:]:
                        context_messages.append({
                            "sender_type": "user" if msg["sender"] == current_sender.display_name else "assistant",
                            "content": msg["content"]
                        })
                
                # 准备用户消息（第一轮对话时使用场景描述作为开场）
                if conversation_context:
                    user_message = conversation_context[-1]["content"]
                else:
                    # 第一轮对话时，使用场景描述作为开场提示
                    user_message = f"请根据场景'{scenario.name}'开始一段自然的对话。"
                
                response, metadata = await self.ai_service.generate_agent_response(
                    system_prompt=sender_persona.system_prompt,
                    conversation_history=context_messages,
                    scenario_context=scenario.context,
                    user_message=user_message,
                    # user_id=current_sender.user_id
                )
                
                # 保存消息
                message = AutoConversationMessage(
                    auto_conversation_id=auto_conv.id,
                    sender_agent_id=current_sender.id,
                    content=response,
                    message_index=turn,
                    prompt_used=sender_persona.system_prompt,
                    model_used=metadata.get("model_used", "gpt-4")
                )
                db.add(message)
                db.commit()
                db.refresh(message)
                
                # 添加到对话上下文
                conversation_context.append({
                    "sender": current_sender.display_name,
                    "content": response
                })
                
                # 评估匹配度
                love_delta, friendship_delta, analysis = await self.evaluate_message_compatibility(
                    message=response,
                    sender_agent=current_sender,
                    receiver_agent=current_receiver,
                    conversation_context=conversation_context,
                    match_type=match_relation.match_type
                )
                
                # 保存评估结果
                evaluation = MatchEvaluation(
                    auto_conversation_id=auto_conv.id,
                    message_id=message.id,
                    love_score_delta=love_delta,
                    friendship_score_delta=friendship_delta,
                    evaluation_reason=analysis,
                    evaluator_model=self.ai_service.model
                )
                db.add(evaluation)
                
                total_love_score += love_delta
                total_friendship_score += friendship_delta
                
                # 交换发言者
                current_sender, current_receiver = current_receiver, current_sender
                
                # 检查对话是否应该自然结束
                if await self._should_end_conversation(conversation_context, scenario):
                    auto_conv.termination_reason = "natural_end"
                    break
            
            # 完成对话
            auto_conv.status = "completed"
            auto_conv.ended_at = datetime.utcnow()
            auto_conv.actual_turns = len(conversation_context)
            auto_conv.round_love_score = total_love_score
            auto_conv.round_friendship_score = total_friendship_score
            
            if auto_conv.termination_reason is None:
                auto_conv.termination_reason = "max_turns"
            
            # 更新匹配关系的总分
            match_relation.love_compatibility_score += total_love_score
            match_relation.friendship_compatibility_score += total_friendship_score
            match_relation.total_interactions += 1
            match_relation.last_conversation_at = datetime.utcnow()
            
            # 安排下次对话（24-72小时后）
            next_hours = random.randint(24, 72)
            match_relation.next_scheduled_conversation = datetime.utcnow() + timedelta(hours=next_hours)
            
            db.commit()
            
            return auto_conv
            
        except Exception as e:
            auto_conv.status = "failed"
            auto_conv.ended_at = datetime.utcnow()
            auto_conv.termination_reason = f"error: {str(e)}"
            db.commit()
            raise e

    async def _should_end_conversation(
        self,
        conversation_context: List[Dict[str, str]],
        scenario: Scenario
    ) -> bool:
        """
        判断对话是否应该自然结束
        """
        if len(conversation_context) < 4:
            return False
        
        # 获取最后几条消息
        recent_messages = conversation_context[-3:]
        messages_text = "\n".join([f"{msg['sender']}: {msg['content']}" for msg in recent_messages])
        
        prompt = f"""
分析以下对话是否已经自然结束。场景：{scenario.name}

最近的对话:
{messages_text}

如果对话已经到了自然的结束点（比如告别、话题完结、达成共识等），回复"YES"。
如果对话还可以继续，回复"NO"。

只回复YES或NO。
"""
        
        try:
            response = await self.ai_service.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            
            result = response.choices[0].message.content.strip().upper()
            return result == "YES"
            
        except Exception:
            return False

    def _format_conversation_context(self, context: List[Dict[str, str]]) -> str:
        """格式化对话上下文"""
        if not context:
            return "暂无对话历史"
        
        formatted = []
        for msg in context[-5:]:  # 只显示最近5条
            formatted.append(f"{msg['sender']}: {msg['content']}")
        
        return "\n".join(formatted)

    def get_market_agents(
        self,
        db: Session,
        market_type: str = None,
        exclude_user_id: str = None,
        limit: int = 50
    ) -> List[MarketAgent]:
        """
        获取市场中的数字人格列表
        """
        query = db.query(MarketAgent).filter(MarketAgent.is_active == True)
        
        if market_type:
            query = query.filter(MarketAgent.market_type == market_type)
        
        if exclude_user_id:
            query = query.filter(MarketAgent.user_id != exclude_user_id)
        
        return query.order_by(MarketAgent.last_interaction.desc()).limit(limit).all()

    def create_market_agent(
        self,
        db: Session,
        user_id: str,
        digital_persona_id: str,
        market_type: str,
        display_name: str,
        display_description: str,
        tags: List[str] = None
    ) -> MarketAgent:
        """
        创建市场投放的数字人格
        """
        # 检查是否已经投放了相同类型的agent
        existing = db.query(MarketAgent).filter(
            and_(
                MarketAgent.user_id == user_id,
                MarketAgent.market_type == market_type,
                MarketAgent.is_active == True
            )
        ).first()
        
        if existing:
            # 更新现有的market agent
            existing.digital_persona_id = digital_persona_id
            existing.display_name = display_name
            existing.display_description = display_description
            existing.tags = json.dumps(tags or [], ensure_ascii=False)
            existing.updated_at = datetime.utcnow()
            db.commit()
            return existing
        else:
            # 创建新的market agent
            agent = MarketAgent(
                user_id=user_id,
                digital_persona_id=digital_persona_id,
                market_type=market_type,
                display_name=display_name,
                display_description=display_description,
                tags=json.dumps(tags or [], ensure_ascii=False)
            )
            db.add(agent)
            db.commit()
            db.refresh(agent)
            return agent

    def create_match_relation(
        self,
        db: Session,
        initiator_user_id: str,
        target_agent_id: str,
        match_type: str
    ) -> MatchRelation:
        """
        创建匹配关系
        """
        # 获取目标agent信息
        target_agent = db.query(MarketAgent).filter(MarketAgent.id == target_agent_id).first()
        if not target_agent:
            raise ValueError("目标数字人格不存在")
        
        # 获取发起者的market agent
        initiator_agent = db.query(MarketAgent).filter(
            and_(
                MarketAgent.user_id == initiator_user_id,
                MarketAgent.market_type == match_type,
                MarketAgent.is_active == True
            )
        ).first()
        
        if not initiator_agent:
            raise ValueError("请先投放数字人格到市场")
        
        # 检查是否已经存在匹配关系
        existing = db.query(MatchRelation).filter(
            and_(
                MatchRelation.initiator_user_id == initiator_user_id,
                MatchRelation.target_user_id == target_agent.user_id,
                MatchRelation.match_type == match_type,
                MatchRelation.status == "active"
            )
        ).first()
        
        if existing:
            return existing
        
        # 创建新的匹配关系
        match_relation = MatchRelation(
            initiator_user_id=initiator_user_id,
            target_user_id=target_agent.user_id,
            initiator_agent_id=initiator_agent.id,
            target_agent_id=target_agent.id,
            match_type=match_type,
            next_scheduled_conversation=datetime.utcnow() + timedelta(hours=1)  # 1小时后开始第一次对话
        )
        
        db.add(match_relation)
        db.commit()
        db.refresh(match_relation)
        
        return match_relation

    def get_user_matches(
        self,
        db: Session,
        user_id: str,
        match_type: str = None
    ) -> List[MatchRelation]:
        """
        获取用户的匹配关系列表
        """
        try:
            query = db.query(MatchRelation).filter(
                or_(
                    MatchRelation.initiator_user_id == user_id,
                    MatchRelation.target_user_id == user_id
                ),
                MatchRelation.status == "active"
            )

            if match_type:
                query = query.filter(MatchRelation.match_type == match_type)

            # 由于sqlite不支持greatest函数，这里用case表达式实现
            order_expr = case(
                (MatchRelation.love_compatibility_score >= MatchRelation.friendship_compatibility_score, MatchRelation.love_compatibility_score),
                else_=MatchRelation.friendship_compatibility_score
            ).desc()

            return query.order_by(order_expr).all()
        except Exception as e:
            print(f"获取匹配关系失败: {e}")
            return []

    def get_pending_conversations(self, db: Session) -> List[MatchRelation]:
        """
        获取需要触发对话的匹配关系
        """
        now = datetime.utcnow()
        return db.query(MatchRelation).filter(
            and_(
                MatchRelation.status == "active",
                MatchRelation.next_scheduled_conversation <= now
            )
        ).all()

# 创建全局实例
match_service = MatchService(ai_service=None)  # 在需要时注入ai_service 