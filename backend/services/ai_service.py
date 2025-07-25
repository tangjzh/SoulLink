import openai
import os
import json
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import re
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")
openai.base_url = os.getenv("OPENAI_BASE_URL")

class AIService:
    def __init__(self):
        self.model = os.getenv("OPENAI_MODEL", "gpt-4-turbo-preview")
        self.client = openai.OpenAI()
        
    async def generate_agent_response(
        self, 
        system_prompt: str, 
        conversation_history: List[Dict[str, str]], 
        scenario_context: str,
        user_message: str,
        is_market_chat: bool = False
    ) -> Tuple[str, Dict[str, Any]]:
        """
        生成agent回复
        
        Args:
            system_prompt: 当前的system prompt
            conversation_history: 对话历史
            scenario_context: 场景上下文
            user_message: 用户消息
            is_market_chat: 是否是市场聊天（与其他用户对话）
            
        Returns:
            Tuple[agent_response, metadata]
        """
        try:
            # 构建完整的系统提示
            market_chat_instruction = ""
            if is_market_chat:
                market_chat_instruction = """

重要提示：你现在正在与一个用户进行聊天，对方通过情感匹配市场发现了你。
- 这不是和你的创造者的对话，而是和一个想要了解你的用户进行对话
- 可以适当展示你的个性特点，但不要过于亲密或透露过多私人信息
- 保持自然的交流节奏，不要显得过于主动或被动
"""
            
            full_system_prompt = f"""
{system_prompt}

场景背景：
{scenario_context}
{market_chat_instruction}

请根据你的人格特征，在当前场景下自然地回应用户。保持角色一致性，回复应该符合你的性格特点。
"""
            
            # 构建消息历史
            messages = [{"role": "system", "content": full_system_prompt}]
            
            # 添加对话历史
            for msg in conversation_history:
                role = "user" if msg["sender_type"] == "user" else "assistant"
                messages.append({"role": role, "content": msg["content"]})
            
            # 添加当前用户消息
            messages.append({"role": "user", "content": user_message})
            
            # 调用LLM
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.8,
                max_tokens=512
            )
            
            agent_response = response.choices[0].message.content
            
            metadata = {
                "model_used": self.model,
                "tokens_used": response.usage.total_tokens,
                "prompt_used": full_system_prompt,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            return agent_response, metadata
            
        except Exception as e:
            print(f"Error generating agent response: {e}")
            return "抱歉，我现在无法回复。", {"error": str(e)}
    
    async def optimize_system_prompt(
        self, 
        current_prompt: str, 
        feedback_data: List[Dict[str, Any]],
        conversation_context: List[Dict[str, str]]
    ) -> Tuple[str, str, float]:
        """
        基于反馈优化system prompt（类似TextGrad方式）
        
        Args:
            current_prompt: 当前的system prompt
            feedback_data: 用户反馈数据
            conversation_context: 对话上下文
            
        Returns:
            Tuple[new_prompt, optimization_reason, improvement_score]
        """
        try:
            # 分析反馈数据
            feedback_analysis = self._analyze_feedback(feedback_data)
            
            # 构建优化提示
            optimization_prompt = f"""
你是一个专业的AI提示词优化专家。你的任务是根据用户反馈来改进一个数字人格的system prompt。

当前的system prompt：
```
{current_prompt}
```

用户反馈分析：
{feedback_analysis}

最近的对话上下文：
{self._format_conversation_context(conversation_context)}

请根据以上信息，生成一个改进后的system prompt。要求：

1. 保持核心人格特征的一致性
2. 根据用户反馈调整表达方式、态度或行为模式
3. 确保新prompt更准确地反映用户期望的人格特征，不要添加额外的解释和前后缀
4. 保持自然和人性化的表达

请以JSON格式回复，不要包含```json```：
{{
    "new_prompt": "改进后的system prompt（不要添加额外的解释）",
    "optimization_reason": "详细解释为什么做出这些改变",
    "improvement_areas": ["改进的具体方面1", "改进的具体方面2"],
    "improvement_score": 0.xx（如0.85）
}}
"""
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": optimization_prompt}],
                temperature=0.3
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return (
                result["new_prompt"],
                result["optimization_reason"],
                result["improvement_score"]
            )
            
        except Exception as e:
            print(f"Error optimizing prompt: {e}")
            return current_prompt, f"优化失败：{str(e)}", 0.0
    
    def _analyze_feedback(self, feedback_data: List[Dict[str, Any]]) -> str:
        """分析用户反馈"""
        if not feedback_data:
            return "暂无用户反馈"
        
        likes = sum(1 for f in feedback_data if f["feedback_type"] == "like")
        dislikes = sum(1 for f in feedback_data if f["feedback_type"] == "dislike")
        corrections = [f for f in feedback_data if f["feedback_type"] == "correction"]
        
        analysis = f"""
反馈统计：
- 点赞数量：{likes}
- 点踩数量：{dislikes}
- 矫正反馈数量：{len(corrections)}

"""
        
        if corrections:
            analysis += "具体矫正意见：\n"
            for i, correction in enumerate(corrections, 1):
                analysis += f"{i}. {correction.get('feedback_content', '')}\n"
        
        # 分析反馈模式
        if dislikes > likes:
            analysis += "\n用户对当前回复风格整体不满意，需要调整。"
        elif len(corrections) > 0:
            analysis += "\n用户提供了具体的改进建议，需要针对性调整。"
        else:
            analysis += "\n用户对当前表现较为满意，可以继续保持并微调。"
        
        return analysis
    
    def _format_conversation_context(self, conversation_context: List[Dict[str, str]]) -> str:
        """格式化对话上下文"""
        if not conversation_context:
            return "暂无对话上下文"
        
        context = ""
        for msg in conversation_context[-6:]:  # 只取最近6条消息
            sender = "用户" if msg["sender_type"] == "user" else "AI助手"
            context += f"{sender}：{msg['content']}\n"
        
        return context
    
    async def generate_initial_prompt(self, user_basic_info: Dict[str, Any], user_description: str = "") -> str:
        """
        为新用户生成初始的system prompt
        
        Args:
            user_basic_info: 用户基础信息
            user_description: 用户提供的人格描述
            
        Returns:
            初始的system prompt
        """
        try:
            prompt_generation_request = f"""
请为一个数字人格agent生成初始的system prompt。这个agent将代表一个真实的人在各种场景中进行对话。

用户基础信息：
- 用户名：{user_basic_info.get('username', '未知')}
- 人格描述：{user_description if user_description else '未指定'}
- 年龄范围：{user_basic_info.get('age_range', '20-30岁')}
- 性别：{user_basic_info.get('gender', '未指定')}
- 兴趣爱好：{user_basic_info.get('interests', '待发现')}

请生成一个通用但个性化的system prompt，要求：
1. 建立基本的人格框架，但保持灵活性以便后续优化，不要过于刻板
2. 包含基本的交流风格和价值观倾向，要有活人感
3. 设置交流风格需要日常化、生活化、口语化，不要过于正式
4. 长度适中，约200-300字

请直接返回system prompt内容，不需要额外说明。
"""
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt_generation_request}],
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"Error generating initial prompt: {e}")
            # 返回默认prompt
            return """
我是一个友善、真诚的人工智能助手，致力于与你进行自然、有意义的对话。我具有以下特征：

性格特点：
- 开放包容，善于倾听
- 理性思考，但也有情感温度
- 诚实直接，不会刻意迎合
- 对新事物保持好奇心

交流风格：
- 用词自然，语气亲切
- 根据对话氛围调整正式程度
- 善于提问，引导深入交流
- 在分歧时保持尊重和理性

价值观：
- 重视真诚的人际关系
- 相信持续学习和成长
- 尊重他人的不同观点
- 追求生活的平衡与意义

我会根据具体场景调整我的回应方式，始终保持这些核心特征。
"""
    
    async def generate_personality_question(
        self, 
        persona: Any,
        previous_answers: List[Dict[str, Any]],
        scenario: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        生成下一个人格测评问题
        
        Args:
            persona: 数字人格对象
            previous_answers: 之前的答案列表
            scenario: 固定的测评场景
            
        Returns:
            包含问题、选项等信息的字典
        """
        try:
            current_round = len(previous_answers) + 1
            max_rounds = 10
            
            # 检查是否应该结束测评
            if current_round > max_rounds:
                return {"completed": True}
            
            # 如果有之前的答案，判断是否可以提前结束
            if len(previous_answers) >= 5:
                # 调用LLM判断是否可以结束
                should_continue = await self._should_continue_assessment(persona, previous_answers, scenario)
                if not should_continue:
                    return {"completed": True}
            
            # 构建问题生成prompt
            question_prompt = f"""
你是一个专业的心理学家，正在为一个数字人格进行个性化测评。请根据以下信息生成下一个测评问题。

数字人格基本信息：
- 姓名：{persona.name}
- 描述：{persona.description or '未提供'}
- 当前系统提示：{persona.system_prompt}

固定测评场景：
- 场景名称：{scenario.get('name', '未知场景')}
- 场景描述：{scenario.get('description', '')}
- 场景背景：{scenario.get('context', '')}

"""
            
            if previous_answers:
                question_prompt += "之前的问答记录：\n"
                for i, answer in enumerate(previous_answers, 1):
                    question_prompt += f"问题{i}：{answer.get('question', '未知')}\n"
                    question_prompt += f"选择：{answer.get('selected_option', '未知')}\n\n"
            
            question_prompt += f"""
请生成第{current_round}个测评问题，要求：

1. 必须基于上述固定的测评场景，不要改变场景背景
2. 在这个场景下提出一个关于行为选择或价值判断的问题
3. 提供3-5个具体的选项，每个选项代表不同的人格特征或行为模式
4. 问题应该能够揭示用户在该场景下的性格、价值观、行为模式等
5. 避免重复之前问过的主题，但要保持场景的一致性
6. 问题应该自然、具体、贴近该场景的实际情况

请以JSON格式返回，不要包含```json```：
{{
    "question_id": "q_{current_round}_scenario_{scenario.get('id', 'unknown')}",
    "scenario": "{scenario.get('context', '')}",
    "question": "在这个场景下的具体问题",
    "options": ["选项1", "选项2", "选项3", "选项4"],
    "current_round": {current_round},
    "total_estimated_rounds": {max_rounds}
}}
"""
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": question_prompt}],
                temperature=0.8
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            print(f"Error generating personality question: {e}")
            # 返回默认问题（基于提供的场景）
            return {
                "question_id": f"default_q_{current_round}_scenario_{scenario.get('id', 'unknown')}",
                "scenario": scenario.get('context', '在一个普通的日常环境中'),
                "question": "在这个情境下，当你面临一个需要快速决策的情况时，你的第一反应通常是什么？",
                "options": [
                    "仔细分析各种可能的结果后再做决定",
                    "根据直觉和经验快速做出选择",
                    "先征求他人的意见和建议",
                    "寻找更多信息确保决策的准确性"
                ],
                "current_round": current_round,
                "total_estimated_rounds": max_rounds
            }
    
    async def _should_continue_assessment(
        self, 
        persona: Any, 
        previous_answers: List[Dict[str, Any]],
        scenario: Dict[str, Any]
    ) -> bool:
        """判断是否应该继续测评"""
        try:
            judgment_prompt = f"""
根据以下信息，判断是否需要继续人格测评：

测评场景：{scenario.get('name', '未知场景')} - {scenario.get('context', '')}

已完成{len(previous_answers)}轮问答：
"""
            for i, answer in enumerate(previous_answers, 1):
                judgment_prompt += f"第{i}轮：{answer.get('selected_option', '未知')}\n"
            
            judgment_prompt += """
请判断是否已经收集到足够的信息来准确描述用户在该场景下的行为模式和人格特征。

如果已经足够，返回：{"continue": false, "reason": "收集到足够信息的原因"}
如果需要继续，返回：{"continue": true, "reason": "需要继续的原因"}
"""
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": judgment_prompt}],
                temperature=0.3
            )
            
            result = json.loads(response.choices[0].message.content)
            return result.get("continue", True)
            
        except Exception as e:
            print(f"Error in assessment judgment: {e}")
            return True  # 出错时继续测评
    
    async def process_personality_answer(
        self, 
        persona: Any, 
        answer: Dict[str, Any],
        db: Any
    ) -> Dict[str, Any]:
        """
        处理人格测评答案并优化prompt
        
        Args:
            persona: 数字人格对象
            answer: 用户答案
            db: 数据库会话
            
        Returns:
            处理结果
        """
        try:
            # 保存答案到数据库（这里简化，实际可能需要新的数据库表）
            
            # 获取所有答案历史（这里简化处理）
            # 在实际实现中，应该从数据库获取完整的答案历史
            
            # 基于当前答案优化prompt
            optimization_prompt = f"""
你是一个专业的AI prompt工程师。请根据用户的测评答案来优化数字人格的system prompt。

当前数字人格信息：
- 姓名：{persona.name}
- 当前system prompt：{persona.system_prompt}

最新回答：
问题ID：{answer.get('question_id', '')}
选择：{answer.get('selected_option', '')}

请基于这个回答，微调system prompt使其更符合用户展现出的人格特征。要求：

1. 保持原有prompt的基本结构和风格
2. 根据用户的选择调整相应的人格特征描述
3. 让调整后的prompt更加个性化和准确
4. 不要过度修改，保持自然和连贯

请返回优化后的system prompt，不要添加额外的解释，只输出system prompt：
"""
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": optimization_prompt}],
                temperature=0.6
            )
            
            new_prompt = response.choices[0].message.content.strip()
            
            # 更新数据库中的system prompt
            persona.system_prompt = new_prompt
            # persona.optimization_count += 1
            db.commit()
            
            return {
                "completed": False,
                "optimization_applied": True,
                "message": "答案已处理，数字人格特征已优化"
            }
            
        except Exception as e:
            print(f"Error processing personality answer: {e}")
            return {
                "completed": False,
                "optimization_applied": False,
                "message": f"处理答案时出错：{str(e)}"
            }

class ScenarioService:
    """场景服务"""
    
    @staticmethod
    def get_predefined_scenarios() -> List[Dict[str, Any]]:
        """获取预定义场景"""
        return [
            {
                "name": "咖啡厅初次见面",
                "description": "在一家温馨的咖啡厅里，你们第一次见面，准备开始一段对话",
                "context": "环境：安静的咖啡厅，下午时光，阳光透过窗户洒在桌上。你们刚刚坐下，点好了咖啡，准备开始交流。气氛轻松但略带紧张，因为这是第一次见面。",
                "category": "初次见面",
                "difficulty_level": "easy"
            },
            {
                "name": "深夜的心灵对话",
                "description": "深夜时分，你们在安静的空间里进行深入的心灵交流",
                "context": "时间：深夜11点，环境安静祥和。你们都处于放松的状态，愿意分享更深层的想法和感受。这是一个适合探讨人生、梦想、恐惧的时刻。",
                "category": "深度交流",
                "difficulty_level": "medium"
            },
            {
                "name": "意见分歧的讨论",
                "description": "你们在某个话题上有不同的看法，需要进行理性的讨论",
                "context": "你们发现在某个重要话题上持有不同观点。这是一个考验沟通技巧和处理分歧能力的场景。需要保持尊重，理性表达，寻求理解。",
                "category": "冲突处理",
                "difficulty_level": "hard"
            },
            {
                "name": "计划未来的旅行",
                "description": "你们正在一起计划一次旅行，讨论目的地、行程和预算",
                "context": "你们决定一起去旅行，现在需要讨论各种细节：去哪里、住什么样的酒店、预算多少、想要什么样的体验。这是一个展现价值观和生活方式的好机会。",
                "category": "共同决策",
                "difficulty_level": "medium"
            },
            {
                "name": "工作压力的倾诉",
                "description": "其中一方遇到工作上的困难，需要支持和建议",
                "context": "工作中遇到了挫折或压力，感到沮丧或焦虑。这时候需要的是理解、支持和可能的建议。这是一个展现同理心和支持能力的场景。",
                "category": "情感支持",
                "difficulty_level": "medium"
            },
            {
                "name": "庆祝重要成就",
                "description": "一起庆祝某个重要的成就或里程碑",
                "context": "刚刚获得了一个重要的成就（升职、完成项目、达成目标等），心情很好，想要分享这份喜悦。这是一个展现如何分享快乐和给予祝福的场景。",
                "category": "情感支持",
                "difficulty_level": "easy"
            }
        ]

# 全局AI服务实例
ai_service = AIService()
scenario_service = ScenarioService() 