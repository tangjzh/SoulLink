import openai
import os
import json
import httpx
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import re
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")
openai.base_url = os.getenv("OPENAI_BASE_URL")

class AIService:
    def __init__(self):
        # AI服务提供商选择 (openai 或 dify)
        self.ai_provider = os.getenv("AI_PROVIDER", "openai").lower()
        
        # OpenAI配置
        self.model = os.getenv("OPENAI_MODEL", "gpt-4-turbo-preview")
        self.client = openai.OpenAI()
        
        # Dify配置
        self.dify_api_key = os.getenv("DIFY_API_KEY")
        self.dify_base_url = os.getenv("DIFY_BASE_URL", "https://api.dify.ai/v1")
        self.dify_app_id = os.getenv("DIFY_APP_ID")
        
        # HTTP客户端用于Dify API调用
        self.http_client = httpx.AsyncClient()
    
    async def _call_dify_api(
        self,
        prompt: str,
        self_awareness: str = "",
        conversation_id: Optional[str] = None,
        user_id: str = "default_user"
    ) -> Tuple[str, Dict[str, Any]]:
        """
        调用Dify API
        
        Args:
            prompt: 完整的提示内容
            conversation_id: 对话ID（可选）
            user_id: 用户ID
            
        Returns:
            Tuple[response_content, metadata]
        """
        try:
            headers = {
                "Authorization": f"Bearer {self.dify_api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "inputs": {
                    "self_awareness": self_awareness
                },
                "query": prompt,
                "user": user_id,
                "response_mode": "blocking"
            }
            
            # 如果有conversation_id，添加到请求中
            if conversation_id:
                data["conversation_id"] = conversation_id
            
            response = await self.http_client.post(
                f"{self.dify_base_url}/chat-messages",
                headers=headers,
                json=data,
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise Exception(f"Dify API error: {response.status_code} - {response.text}")
            
            result = response.json()
            
            metadata = {
                "provider": "dify",
                "conversation_id": result.get("conversation_id"),
                "message_id": result.get("id"),
                "timestamp": datetime.utcnow().isoformat(),
                "dify_metadata": result.get("metadata", {})
            }
            
            return result.get("answer", "抱歉，我现在无法回复。"), metadata
            
        except Exception as e:
            print(f"Error calling Dify API: {e}")
            return "抱歉，我现在无法回复。", {"error": str(e), "provider": "dify"}
    
    async def _call_openai_api(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.8,
        max_tokens: int = 512
    ) -> Tuple[str, Dict[str, Any]]:
        """
        调用OpenAI API
        
        Args:
            messages: 消息列表
            temperature: 温度参数
            max_tokens: 最大token数
            
        Returns:
            Tuple[response_content, metadata]
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            agent_response = response.choices[0].message.content
            
            metadata = {
                "provider": "openai",
                "model_used": self.model,
                "tokens_used": response.usage.total_tokens,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            return agent_response, metadata
            
        except Exception as e:
            print(f"Error calling OpenAI API: {e}")
            return "抱歉，我现在无法回复。", {"error": str(e), "provider": "openai"}
        
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
**必须遵守**：除非必要或用户明确要求，保持回复长度在10个字左右，保持口语表达，就像真人在敲键盘打字。
"""
            
            # 根据AI服务提供商选择调用方式
            if self.ai_provider == "dify":
                # 使用Dify API
                # 对于Dify，我们需要将对话历史和用户消息组合成一个完整的prompt
                conversation_text = ""
                for msg in conversation_history:
                    sender = "用户" if msg["sender_type"] == "user" else "助手"
                    conversation_text += f"{sender}：{msg['content']}\n"
                
                # 构建完整的prompt
                complete_prompt = f"""
对话历史：
{conversation_text}

用户：{user_message}

请以数字人格身份回复："""
                
                agent_response, metadata = await self._call_dify_api(
                    self_awareness=full_system_prompt,
                    prompt=complete_prompt,
                    user_id="soullink_user"
                )
                
                # 添加额外的元数据
                metadata.update({
                    "prompt_used": full_system_prompt,
                    "conversation_length": len(conversation_history)
                })
                
            else:
                # 使用OpenAI API
                # 构建消息历史
                messages = [{"role": "system", "content": full_system_prompt}]
                
                # 添加对话历史
                for msg in conversation_history:
                    role = "user" if msg["sender_type"] == "user" else "assistant"
                    messages.append({"role": role, "content": msg["content"]})
                
                # 添加当前用户消息
                messages.append({"role": "user", "content": user_message})
                
                agent_response, metadata = await self._call_openai_api(
                    messages=messages,
                    temperature=0.8,
                    max_tokens=512
                )
                
                # 添加额外的元数据
                metadata.update({
                    "prompt_used": full_system_prompt,
                    "conversation_length": len(conversation_history)
                })
            
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
            
            if self.ai_provider == "dify":
                # 使用Dify API
                agent_response, _ = await self._call_dify_api(
                    prompt=optimization_prompt,
                    user_id="system_optimizer"
                )
                result = json.loads(agent_response)
            else:
                # 使用OpenAI API
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
            
            if self.ai_provider == "dify":
                # 使用Dify API
                agent_response, _ = await self._call_dify_api(
                    prompt=prompt_generation_request,
                    user_id="prompt_generator"
                )
                return agent_response.strip()
            else:
                # 使用OpenAI API
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
            
            if self.ai_provider == "dify":
                # 使用Dify API
                agent_response, _ = await self._call_dify_api(
                    prompt=question_prompt,
                    user_id="question_generator"
                )
                result = json.loads(agent_response)
            else:
                # 使用OpenAI API
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
            
            if self.ai_provider == "dify":
                # 使用Dify API
                agent_response, _ = await self._call_dify_api(
                    prompt=judgment_prompt,
                    user_id="assessment_judge"
                )
                result = json.loads(agent_response)
            else:
                # 使用OpenAI API
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
            
            if self.ai_provider == "dify":
                # 使用Dify API
                agent_response, _ = await self._call_dify_api(
                    prompt=optimization_prompt,
                    user_id="answer_processor"
                )
                new_prompt = agent_response.strip()
            else:
                # 使用OpenAI API
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
    
    async def cleanup(self):
        """清理资源"""
        if hasattr(self, 'http_client'):
            await self.http_client.aclose()

class ScenarioService:
    """场景服务"""
    
    @staticmethod
    def get_predefined_scenarios() -> List[Dict[str, Any]]:
        """获取预定义场景"""
        return [
            {
                "name": "咖啡厅的午后邂逅",
                "description": "在一家文艺的独立咖啡馆里，你们第一次见面。阳光、咖啡香和轻音乐营造出温暖而不失格调的氛围。",
                "context": "你坐在靠窗的位置,面前是一杯冒着热气的拿铁。阳光透过法式窗洒在木质桌面上,形成斑驳的光影。背景音乐放着轻柔的爵士乐。当另一个人走进来时,你能感受到些许紧张和期待。这是一个适合展现个人品味、谈吐和第一印象的场景。",
                "category": "初次见面",
                "difficulty_level": "easy"
            },
            {
                "name": "凌晨的心灵独白",
                "description": "在城市安静下来的深夜,你们通过视频进行一次毫无保留的深度对话。",
                "context": "凌晨两点,城市喧嚣褪去。你躺在床上,房间里只开着一盏暖色小灯。此时的你卸下所有防备,准备和对方分享那些平时难以启齿的想法、困扰、梦想与脆弱。这是一个考验真诚度与情感连接的时刻。",
                "category": "深度交流", 
                "difficulty_level": "hard"
            },
            {
                "name": "价值观的碰撞与融合",
                "description": "你们在社会热点话题上产生了重大分歧,需要理性沟通并寻求理解。",
                "context": "你们正在讨论一个充满争议的社会话题(如教育方式、工作与生活平衡等)。双方都有强烈的个人观点和情感投入,但同时也希望能够理解对方的立场。这是一个展现三观、沟通方式和包容度的场景。",
                "category": "冲突处理",
                "difficulty_level": "hard"
            },
            {
                "name": "一场说走就走的旅行",
                "description": "你们突发奇想要一起策划一次说走就走的旅行,需要在短时间内达成共识。",
                "context": "周五晚上,你们都因为工作疲惫,突然萌生出周末来次短途旅行的想法。在讨论目的地、预算、行程时,你们的决策方式、冒险精神和生活态度都会自然流露。这是一个考验默契度和决断力的场景。",
                "category": "共同决策",
                "difficulty_level": "medium"
            },
            {
                "name": "职场困境求解",
                "description": "你正面临职业生涯的重要抉择,需要倾诉和建议。",
                "context": "你刚收到一个薪资更高但工作强度更大的offer,陷入是否要离开现有舒适圈的纠结。在倾诉过程中,你的价值取向、野心和顾虑都会显露。这是一个测试同理心和建议质量的场景。",
                "category": "情感支持",
                "difficulty_level": "medium"
            },
            {
                "name": "人生重要里程碑",
                "description": "你刚刚实现了人生一个重要目标,想要分享这份喜悦。",
                "context": "你终于完成了筹备已久的个人项目(创业、考证、技能突破等)。在分享的过程中,你会不自觉地回顾这段经历中的酸甜苦辣,展现出个人的奋斗历程和价值观。这是一个体现分享方式和共情能力的场景。",
                "category": "情感支持",
                "difficulty_level": "easy"
            }
        ]

# 全局AI服务实例
ai_service = AIService()
scenario_service = ScenarioService()

"""
环境变量配置说明：

选择AI服务提供商：
AI_PROVIDER=openai  # 使用OpenAI (默认)
AI_PROVIDER=dify    # 使用Dify

OpenAI配置：
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1  # 可选，默认官方API
OPENAI_MODEL=gpt-4-turbo-preview  # 可选，默认模型

Dify配置：
DIFY_API_KEY=your_dify_api_key
DIFY_BASE_URL=https://api.dify.ai/v1  # 可选，默认官方API
DIFY_APP_ID=your_dify_app_id  # 可选，某些Dify版本可能需要

在.env文件中设置这些环境变量即可切换AI服务提供商。
""" 