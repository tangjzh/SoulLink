from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime
from typing import Optional, List
from models.database import ChatSession, RealTimeMessage, User, MatchRelation

class ChatService:
    """聊天会话服务"""
    
    def get_or_create_chat_session(
        self, 
        db: Session, 
        user_id1: str, 
        user_id2: str,
        related_match_relation_id: Optional[str] = None
    ) -> ChatSession:
        """
        获取或创建两个用户之间的聊天会话
        
        Args:
            db: 数据库会话
            user_id1: 用户1的ID
            user_id2: 用户2的ID
            related_match_relation_id: 关联的匹配关系ID（可选）
            
        Returns:
            ChatSession: 聊天会话对象
        """
        try:
            # 确保用户ID按字典序排列
            ordered_user1_id, ordered_user2_id = ChatSession.get_ordered_user_ids(user_id1, user_id2)
            
            # 查找现有会话
            chat_session = db.query(ChatSession).filter(
                and_(
                    ChatSession.user1_id == ordered_user1_id,
                    ChatSession.user2_id == ordered_user2_id
                )
            ).first()
            
            if chat_session:
                # 更新关联的匹配关系（如果提供了新的）
                if related_match_relation_id and not chat_session.related_match_relation_id:
                    chat_session.related_match_relation_id = related_match_relation_id
                    chat_session.updated_at = datetime.utcnow()
                    db.commit()
                
                return chat_session
            
            # 创建新会话
            chat_session = ChatSession(
                user1_id=ordered_user1_id,
                user2_id=ordered_user2_id,
                related_match_relation_id=related_match_relation_id,
                status="active"
            )
            
            db.add(chat_session)
            db.commit()
            db.refresh(chat_session)
            
            print(f"✅ 创建新聊天会话: {chat_session.id} 用户: {ordered_user1_id} <-> {ordered_user2_id}")
            return chat_session
            
        except Exception as e:
            print(f"❌ 获取或创建聊天会话失败: {e}")
            db.rollback()
            raise e
    
    def get_chat_session_by_id(self, db: Session, session_id: str) -> Optional[ChatSession]:
        """根据会话ID获取聊天会话"""
        try:
            return db.query(ChatSession).filter(ChatSession.id == session_id).first()
        except Exception as e:
            print(f"❌ 获取聊天会话失败: {e}")
            return None
    
    def get_user_chat_sessions(
        self, 
        db: Session, 
        user_id: str, 
        status: str = "active"
    ) -> List[ChatSession]:
        """
        获取用户的所有聊天会话
        
        Args:
            db: 数据库会话
            user_id: 用户ID
            status: 会话状态，默认为"active"
            
        Returns:
            List[ChatSession]: 用户的聊天会话列表
        """
        try:
            return db.query(ChatSession).filter(
                and_(
                    or_(
                        ChatSession.user1_id == user_id,
                        ChatSession.user2_id == user_id
                    ),
                    ChatSession.status == status
                )
            ).order_by(ChatSession.last_message_at.desc()).all()
            
        except Exception as e:
            print(f"❌ 获取用户聊天会话失败: {e}")
            return []
    
    def update_user_online_status(
        self, 
        db: Session, 
        session_id: str, 
        user_id: str, 
        is_online: bool
    ) -> bool:
        """
        更新用户在聊天会话中的在线状态
        
        Args:
            db: 数据库会话
            session_id: 聊天会话ID
            user_id: 用户ID
            is_online: 是否在线
            
        Returns:
            bool: 更新是否成功
        """
        try:
            chat_session = self.get_chat_session_by_id(db, session_id)
            if not chat_session:
                print(f"❌ 聊天会话不存在: {session_id}")
                return False
            
            if not chat_session.is_participant(user_id):
                print(f"❌ 用户 {user_id} 不是会话 {session_id} 的参与者")
                return False
            
            chat_session.update_user_online_status(user_id, is_online)
            db.commit()
            
            print(f"✅ 更新用户在线状态: {user_id} -> {'在线' if is_online else '离线'}")
            return True
            
        except Exception as e:
            print(f"❌ 更新用户在线状态失败: {e}")
            db.rollback()
            return False
    
    def send_message(
        self, 
        db: Session, 
        session_id: str, 
        sender_user_id: str, 
        content: str, 
        message_type: str = "text"
    ) -> Optional[RealTimeMessage]:
        """
        发送聊天消息
        
        Args:
            db: 数据库会话
            session_id: 聊天会话ID
            sender_user_id: 发送者用户ID
            content: 消息内容
            message_type: 消息类型，默认为"text"
            
        Returns:
            RealTimeMessage: 创建的消息对象，失败时返回None
        """
        try:
            chat_session = self.get_chat_session_by_id(db, session_id)
            if not chat_session:
                print(f"❌ 聊天会话不存在: {session_id}")
                return None
            
            if not chat_session.is_participant(sender_user_id):
                print(f"❌ 用户 {sender_user_id} 不是会话 {session_id} 的参与者")
                return None
            
            # 计算消息序号
            last_message = db.query(RealTimeMessage).filter(
                RealTimeMessage.chat_session_id == session_id
            ).order_by(RealTimeMessage.sequence_number.desc()).first()
            
            sequence_number = (last_message.sequence_number + 1) if last_message else 1
            
            # 创建消息
            message = RealTimeMessage(
                chat_session_id=session_id,
                sender_user_id=sender_user_id,
                content=content,
                message_type=message_type,
                sequence_number=sequence_number
            )
            
            db.add(message)
            
            # 更新会话信息
            chat_session.message_count += 1
            chat_session.last_message_at = datetime.utcnow()
            chat_session.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(message)
            
            print(f"✅ 发送消息成功: 会话 {session_id}, 发送者 {sender_user_id}")
            return message
            
        except Exception as e:
            print(f"❌ 发送消息失败: {e}")
            db.rollback()
            return None
    
    def get_messages(
        self, 
        db: Session, 
        session_id: str, 
        limit: int = 50, 
        offset: int = 0
    ) -> List[RealTimeMessage]:
        """
        获取聊天会话的消息列表
        
        Args:
            db: 数据库会话
            session_id: 聊天会话ID
            limit: 消息数量限制
            offset: 偏移量
            
        Returns:
            List[RealTimeMessage]: 消息列表
        """
        try:
            messages = db.query(RealTimeMessage).filter(
                and_(
                    RealTimeMessage.chat_session_id == session_id,
                    RealTimeMessage.is_deleted == False
                )
            ).order_by(
                RealTimeMessage.sequence_number.desc()
            ).offset(offset).limit(limit).all()
            
            # 返回时按正序排列（最老的消息在前）
            return list(reversed(messages))
            
        except Exception as e:
            print(f"❌ 获取消息失败: {e}")
            return []
    
    def mark_messages_as_read(
        self, 
        db: Session, 
        session_id: str, 
        user_id: str, 
        up_to_sequence: Optional[int] = None
    ) -> bool:
        """
        将消息标记为已读
        
        Args:
            db: 数据库会话
            session_id: 聊天会话ID
            user_id: 用户ID
            up_to_sequence: 标记到第几条消息为已读，None表示全部
            
        Returns:
            bool: 操作是否成功
        """
        try:
            chat_session = self.get_chat_session_by_id(db, session_id)
            if not chat_session or not chat_session.is_participant(user_id):
                return False
            
            # 构建查询条件
            query = db.query(RealTimeMessage).filter(
                and_(
                    RealTimeMessage.chat_session_id == session_id,
                    RealTimeMessage.sender_user_id != user_id,  # 不是自己发送的消息
                    RealTimeMessage.is_read == False
                )
            )
            
            if up_to_sequence:
                query = query.filter(RealTimeMessage.sequence_number <= up_to_sequence)
            
            # 批量更新
            read_time = datetime.utcnow()
            updated_count = query.update({
                'is_read': True,
                'read_at': read_time
            })
            
            db.commit()
            
            print(f"✅ 标记 {updated_count} 条消息为已读")
            return True
            
        except Exception as e:
            print(f"❌ 标记消息为已读失败: {e}")
            db.rollback()
            return False


# 全局服务实例
chat_service = ChatService() 