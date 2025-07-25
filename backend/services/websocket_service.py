import json
import logging
from typing import Dict, Set, Optional
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from models.database import MatchRelation, User, ConversationMessage, RealTimeMessage
import asyncio

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # 存储连接: {user_id: {match_id: websocket}}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        # 存储用户在线状态: {user_id: set of match_ids}
        self.user_online_status: Dict[str, Set[str]] = {}
        # 存储正在输入状态: {match_id: {user_id: timestamp}}
        self.typing_status: Dict[str, Dict[str, datetime]] = {}

    async def connect(self, websocket: WebSocket, user_id: str, match_id: str):
        """建立WebSocket连接"""
        await websocket.accept()
        
        # 初始化用户连接字典
        if user_id not in self.active_connections:
            self.active_connections[user_id] = {}
            self.user_online_status[user_id] = set()
        
        # 存储连接
        self.active_connections[user_id][match_id] = websocket
        self.user_online_status[user_id].add(match_id)
        
        logger.info(f"用户 {user_id} 在匹配 {match_id} 中上线")
        
        # 通知其他参与者该用户上线
        await self.broadcast_user_status(match_id, user_id, True)
        
        # 发送欢迎消息
        await self.send_system_message(websocket, "已连接到聊天服务器，可以开始聊天了！")

    async def disconnect(self, user_id: str, match_id: str):
        """断开WebSocket连接"""
        if user_id in self.active_connections and match_id in self.active_connections[user_id]:
            del self.active_connections[user_id][match_id]
            
        if user_id in self.user_online_status and match_id in self.user_online_status[user_id]:
            self.user_online_status[user_id].discard(match_id)
            
        # 清理空的用户记录
        if user_id in self.active_connections and not self.active_connections[user_id]:
            del self.active_connections[user_id]
            
        if user_id in self.user_online_status and not self.user_online_status[user_id]:
            del self.user_online_status[user_id]
            
        logger.info(f"用户 {user_id} 在匹配 {match_id} 中下线")
        
        # 通知其他参与者该用户下线
        await self.broadcast_user_status(match_id, user_id, False)

    async def send_personal_message(self, message: dict, user_id: str, match_id: str):
        """发送个人消息"""
        if user_id in self.active_connections and match_id in self.active_connections[user_id]:
            websocket = self.active_connections[user_id][match_id]
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"发送消息给用户 {user_id} 失败: {e}")
                # 连接可能已断开，清理连接
                await self.disconnect(user_id, match_id)

    async def broadcast_to_match(self, message: dict, match_id: str, exclude_user: Optional[str] = None):
        """向匹配中的所有用户广播消息（可排除指定用户）"""
        disconnected_users = []
        
        for user_id, connections in self.active_connections.items():
            if exclude_user and user_id == exclude_user:
                continue
                
            if match_id in connections:
                try:
                    await connections[match_id].send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"广播消息给用户 {user_id} 失败: {e}")
                    disconnected_users.append((user_id, match_id))
        
        # 清理断开的连接
        for user_id, match_id in disconnected_users:
            await self.disconnect(user_id, match_id)

    async def broadcast_user_status(self, match_id: str, user_id: str, is_online: bool):
        """广播用户在线状态"""
        status_message = {
            "type": "user_status",
            "userId": user_id,
            "isOnline": is_online,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_match(status_message, match_id, exclude_user=user_id)

    async def send_system_message(self, websocket: WebSocket, content: str):
        """发送系统消息"""
        system_message = {
            "type": "system",
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        }
        try:
            await websocket.send_text(json.dumps(system_message))
        except Exception as e:
            logger.error(f"发送系统消息失败: {e}")

    async def handle_typing_status(self, user_id: str, match_id: str, is_typing: bool):
        """处理正在输入状态"""
        if match_id not in self.typing_status:
            self.typing_status[match_id] = {}
            
        if is_typing:
            self.typing_status[match_id][user_id] = datetime.utcnow()
        else:
            self.typing_status[match_id].pop(user_id, None)
            
        # 广播输入状态
        typing_message = {
            "type": "typing",
            "userId": user_id,
            "isTyping": is_typing,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_match(typing_message, match_id, exclude_user=user_id)

    def get_online_users_in_match(self, match_id: str) -> Set[str]:
        """获取匹配中的在线用户"""
        online_users = set()
        for user_id, match_ids in self.user_online_status.items():
            if match_id in match_ids:
                online_users.add(user_id)
        return online_users

# 全局连接管理器实例
manager = ConnectionManager()

class WebSocketService:
    def __init__(self):
        self.manager = manager
    
    async def handle_websocket_connection(
        self, 
        websocket: WebSocket, 
        match_id: str, 
        user_id: str,
        db: Session
    ):
        """处理WebSocket连接的主要逻辑"""
        try:
            # 验证匹配关系和用户权限
            match_relation = db.query(MatchRelation).filter(
                MatchRelation.id == match_id,
                (MatchRelation.initiator_user_id == user_id) | 
                (MatchRelation.target_user_id == user_id),
                MatchRelation.status == "active"
            ).first()
            
            if not match_relation:
                await websocket.close(code=4004, reason="匹配关系不存在或无权限")
                return
            
            # 建立连接
            await self.manager.connect(websocket, user_id, match_id)
            
            try:
                while True:
                    # 接收消息
                    data = await websocket.receive_text()
                    message_data = json.loads(data)
                    
                    # 处理不同类型的消息
                    await self.handle_message(message_data, user_id, match_id, db)
                    
            except WebSocketDisconnect:
                logger.info(f"用户 {user_id} 主动断开连接")
            except Exception as e:
                logger.error(f"WebSocket处理过程中出错: {e}")
            finally:
                await self.manager.disconnect(user_id, match_id)
                
        except Exception as e:
            logger.error(f"WebSocket连接建立失败: {e}")
            await websocket.close(code=4000, reason="服务器内部错误")

    async def handle_message(self, message_data: dict, user_id: str, match_id: str, db: Session):
        """处理接收到的消息"""
        message_type = message_data.get("type")
        
        if message_type == "message":
            await self.handle_chat_message(message_data, user_id, match_id, db)
        elif message_type == "typing":
            await self.handle_typing_message(message_data, user_id, match_id)
        else:
            logger.warning(f"未知的消息类型: {message_type}")

    async def handle_chat_message(self, message_data: dict, user_id: str, match_id: str, db: Session):
        """处理聊天消息"""
        try:
            content = message_data.get("content", "").strip()
            if not content:
                return
                
            # 获取用户信息
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.warning(f"用户 {user_id} 不存在")
                return
                
            # 验证匹配关系
            match_relation = db.query(MatchRelation).filter(
                MatchRelation.id == match_id,
                (MatchRelation.initiator_user_id == user_id) | (MatchRelation.target_user_id == user_id)
            ).first()
            
            if not match_relation:
                logger.warning(f"用户 {user_id} 没有匹配关系 {match_id} 的权限")
                return
                
            # 获取下一个序号（基于该匹配关系的现有消息数量）
            message_count = db.query(RealTimeMessage).filter(
                RealTimeMessage.match_relation_id == match_id,
                RealTimeMessage.is_deleted == False
            ).count()
            
            next_sequence = message_count + 1
            
            # 保存消息到实时聊天消息表
            realtime_message = RealTimeMessage(
                match_relation_id=match_id,
                sender_user_id=user_id,
                content=content,
                message_type="text",
                sequence_number=next_sequence
            )
            
            db.add(realtime_message)
            db.commit()
            db.refresh(realtime_message)
            
            # 构建广播消息对象
            chat_message = {
                "type": "message",
                "id": str(realtime_message.id),
                "senderId": user_id,
                "senderName": user.username or "用户",
                "content": content,
                "timestamp": realtime_message.created_at.isoformat(),
                "matchId": match_id,
                "sequenceNumber": next_sequence
            }
            
            # 广播消息给匹配中的所有用户
            await self.manager.broadcast_to_match(chat_message, match_id)
            
            logger.info(f"用户 {user_id} 在匹配 {match_id} 中发送消息 (序号: {next_sequence}): {content}")
            
        except Exception as e:
            logger.error(f"处理聊天消息失败: {e}")
            db.rollback()

    async def handle_typing_message(self, message_data: dict, user_id: str, match_id: str):
        """处理正在输入消息"""
        try:
            is_typing = message_data.get("isTyping", False)
            await self.manager.handle_typing_status(user_id, match_id, is_typing)
        except Exception as e:
            logger.error(f"处理输入状态失败: {e}")

# 清理任务，定期清理过期的输入状态
async def cleanup_typing_status():
    """清理过期的输入状态"""
    while True:
        try:
            current_time = datetime.utcnow()
            for match_id, typing_users in list(manager.typing_status.items()):
                for user_id, timestamp in list(typing_users.items()):
                    # 如果输入状态超过30秒，则清理
                    if (current_time - timestamp).total_seconds() > 30:
                        typing_users.pop(user_id, None)
                        
                        # 发送停止输入的消息
                        typing_message = {
                            "type": "typing",
                            "userId": user_id,
                            "isTyping": False,
                            "timestamp": current_time.isoformat()
                        }
                        await manager.broadcast_to_match(typing_message, match_id, exclude_user=user_id)
                        
                # 清理空的匹配记录
                if not typing_users:
                    manager.typing_status.pop(match_id, None)
                    
            await asyncio.sleep(30)  # 每30秒执行一次清理
        except Exception as e:
            logger.error(f"清理输入状态时出错: {e}")
            await asyncio.sleep(30)

# 创建全局服务实例
websocket_service = WebSocketService() 