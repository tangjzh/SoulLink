"""
后台任务服务
用于异步处理耗时的AI对话生成任务
"""

import asyncio
import uuid
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor
from enum import Enum

class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class TaskResult:
    def __init__(self, task_id: str):
        self.task_id = task_id
        self.status = TaskStatus.PENDING
        self.result = None
        self.error = None
        self.created_at = datetime.utcnow()
        self.started_at = None
        self.completed_at = None
        self.progress = 0

class TaskService:
    def __init__(self):
        self.tasks: Dict[str, TaskResult] = {}
        self.executor = ThreadPoolExecutor(max_workers=3)  # 限制并发数避免API过载
        
    def create_task(self, task_type: str, **kwargs) -> str:
        """创建新任务"""
        task_id = str(uuid.uuid4())
        task_result = TaskResult(task_id)
        self.tasks[task_id] = task_result
        
        # 清理超过1小时的旧任务
        self._cleanup_old_tasks()
        
        return task_id
    
    async def execute_conversation_task(
        self, 
        task_id: str, 
        match_relation_id: str, 
        scenario_id: str,
        max_turns: int = 8
    ):
        """异步执行对话任务"""
        if task_id not in self.tasks:
            return
            
        task_result = self.tasks[task_id]
        task_result.status = TaskStatus.RUNNING
        task_result.started_at = datetime.utcnow()
        
        try:
            # 在线程池中执行同步的对话生成
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                self.executor,
                self._execute_conversation_sync,
                match_relation_id,
                scenario_id,
                max_turns,
                task_id
            )
            
            task_result.status = TaskStatus.COMPLETED
            task_result.result = result
            task_result.progress = 100
            task_result.completed_at = datetime.utcnow()
            
        except Exception as e:
            task_result.status = TaskStatus.FAILED
            task_result.error = str(e)
            task_result.completed_at = datetime.utcnow()
            print(f"❌ 任务 {task_id} 执行失败: {e}")
    
    def _execute_conversation_sync(
        self, 
        match_relation_id: str, 
        scenario_id: str, 
        max_turns: int,
        task_id: str
    ) -> Dict[str, Any]:
        """在线程池中同步执行对话生成"""
        from models.database import SessionLocal, MatchRelation, Scenario
        from services.match_service import match_service
        
        db = SessionLocal()
        try:
            # 获取匹配关系和场景
            match_relation = db.query(MatchRelation).filter(
                MatchRelation.id == match_relation_id
            ).first()
            
            scenario = db.query(Scenario).filter(
                Scenario.id == scenario_id
            ).first()
            
            if not match_relation or not scenario:
                raise ValueError("匹配关系或场景不存在")
            
            # 更新任务进度
            if task_id in self.tasks:
                self.tasks[task_id].progress = 20
            
            # 执行对话（这里会调用同步的OpenAI API）
            auto_conv = asyncio.run(match_service.conduct_auto_conversation(
                match_relation=match_relation,
                scenario=scenario,
                max_turns=max_turns,
                db=db
            ))
            
            return {
                "auto_conversation_id": str(auto_conv.id),
                "scenario_name": scenario.name,
                "love_score_change": auto_conv.round_love_score,
                "friendship_score_change": auto_conv.round_friendship_score,
                "actual_turns": auto_conv.actual_turns,
                "termination_reason": auto_conv.termination_reason
            }
            
        finally:
            db.close()
    
    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """获取任务状态"""
        if task_id not in self.tasks:
            return None
            
        task_result = self.tasks[task_id]
        return {
            "task_id": task_id,
            "status": task_result.status.value,
            "progress": task_result.progress,
            "result": task_result.result,
            "error": task_result.error,
            "created_at": task_result.created_at.isoformat(),
            "started_at": task_result.started_at.isoformat() if task_result.started_at else None,
            "completed_at": task_result.completed_at.isoformat() if task_result.completed_at else None
        }
    
    def _cleanup_old_tasks(self):
        """清理超过1小时的旧任务"""
        cutoff_time = datetime.utcnow() - timedelta(hours=1)
        old_task_ids = [
            task_id for task_id, task_result in self.tasks.items()
            if task_result.created_at < cutoff_time
        ]
        
        for task_id in old_task_ids:
            del self.tasks[task_id]
    
    def get_all_tasks(self) -> Dict[str, Dict[str, Any]]:
        """获取所有任务状态（用于调试）"""
        return {
            task_id: self.get_task_status(task_id)
            for task_id in self.tasks.keys()
        }

# 创建全局任务服务实例
task_service = TaskService() 