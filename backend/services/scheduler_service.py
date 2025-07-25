"""
定时任务调度服务
用于自动触发情感匹配的对话
"""

import asyncio
import random
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import and_

from models.database import SessionLocal, MatchRelation, Scenario
from services.match_service import match_service
from services.task_service import task_service

class SchedulerService:
    def __init__(self):
        self.running = False
        self.task = None

    async def start(self):
        """启动定时任务"""
        if self.running:
            print("⏰ 调度服务已在运行")
            return
        
        self.running = True
        self.task = asyncio.create_task(self._run_scheduler())
        print("🚀 定时对话调度服务启动")

    async def stop(self):
        """停止定时任务"""
        if not self.running:
            return
        
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        print("⏹️ 定时对话调度服务停止")

    async def _run_scheduler(self):
        """运行调度器主循环"""
        while self.running:
            try:
                await self._process_pending_conversations()
                # 每5分钟检查一次
                await asyncio.sleep(300)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"❌ 调度器执行错误: {e}")
                await asyncio.sleep(60)  # 出错后等待1分钟再重试

    async def _process_pending_conversations(self):
        """处理待执行的对话"""
        db = SessionLocal()
        try:
            # 获取需要对话的匹配关系
            pending_matches = match_service.get_pending_conversations(db)
            
            if not pending_matches:
                return
            
            print(f"📋 发现 {len(pending_matches)} 个待处理的匹配关系")
            
            # 获取可用场景
            scenarios = db.query(Scenario).filter(Scenario.is_active == True).all()
            if not scenarios:
                print("⚠️ 没有可用的对话场景")
                return
            
            # 处理每个匹配关系
            for match_relation in pending_matches:
                try:
                    # 随机选择场景
                    scenario = random.choice(scenarios)
                    
                    print(f"🎭 创建自动对话任务: {match_relation.initiator_agent.display_name} 与 {match_relation.target_agent.display_name}")
                    print(f"   场景: {scenario.name}")
                    
                    # 创建异步任务
                    task_id = task_service.create_task(
                        task_type="auto_conversation",
                        match_relation_id=str(match_relation.id),
                        scenario_id=str(scenario.id)
                    )
                    
                    # 异步执行对话任务（不等待完成）
                    asyncio.create_task(
                        task_service.execute_conversation_task(
                            task_id=task_id,
                            match_relation_id=str(match_relation.id),
                            scenario_id=str(scenario.id),
                            max_turns=random.randint(6, 12)
                        )
                    )
                    
                    print(f"✅ 对话任务已创建: {task_id}")
                    
                except Exception as e:
                    print(f"❌ 创建自动对话任务失败: {e}")
                    
                # 处理间隔，避免创建太多并发任务
                await asyncio.sleep(1)
                
        except Exception as e:
            print(f"❌ 处理待执行对话时出错: {e}")
        finally:
            db.close()

    async def trigger_immediate_conversation(self, match_relation_id: str) -> str:
        """立即触发指定匹配关系的对话，返回任务ID"""
        db = SessionLocal()
        try:
            # 获取匹配关系
            match_relation = db.query(MatchRelation).filter(
                MatchRelation.id == match_relation_id,
                MatchRelation.status == "active"
            ).first()
            
            if not match_relation:
                raise ValueError("匹配关系不存在或不活跃")
            
            # 获取随机场景
            scenarios = db.query(Scenario).filter(Scenario.is_active == True).all()
            if not scenarios:
                raise ValueError("没有可用的对话场景")
            
            scenario = random.choice(scenarios)
            
            # 创建异步任务
            task_id = task_service.create_task(
                task_type="immediate_conversation",
                match_relation_id=match_relation_id,
                scenario_id=str(scenario.id)
            )
            
            # 异步执行对话任务
            asyncio.create_task(
                task_service.execute_conversation_task(
                    task_id=task_id,
                    match_relation_id=match_relation_id,
                    scenario_id=str(scenario.id),
                    max_turns=random.randint(6, 12)
                )
            )
            
            return task_id
            
        except Exception as e:
            print(f"❌ 立即触发对话失败: {e}")
            raise
        finally:
            db.close()

    def get_status(self) -> dict:
        """获取调度服务状态"""
        return {
            "running": self.running,
            "task_id": id(self.task) if self.task else None,
            "started_at": datetime.utcnow().isoformat() if self.running else None
        }

# 创建全局调度器实例
scheduler_service = SchedulerService() 