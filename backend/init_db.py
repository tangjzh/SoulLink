#!/usr/bin/env python3
"""
SoulLink 数据库初始化脚本
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.database import init_database, engine, SessionLocal
from services.ai_service import scenario_service
from models.database import Scenario

def init_default_scenarios():
    """初始化默认场景数据"""
    db = SessionLocal()
    try:
        # 检查是否已有场景数据
        existing_scenarios = db.query(Scenario).first()
        if existing_scenarios:
            print("📝 场景数据已存在，跳过初始化")
            return

        # 插入预定义场景
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
        print(f"✅ 已插入 {len(predefined_scenarios)} 个默认场景")
        
    except Exception as e:
        print(f"❌ 插入场景数据失败: {e}")
        db.rollback()
    finally:
        db.close()

def main():
    """主初始化函数"""
    print("🚀 开始初始化 SoulLink 数据库...")
    print("=" * 50)
    
    try:
        # 1. 创建数据库表
        print("📊 创建数据库表...")
        init_database()
        
        # 2. 初始化场景数据
        print("📝 初始化场景数据...")
        init_default_scenarios()
        
        print("=" * 50)
        print("🎉 数据库初始化完成！")
        print("💡 数据库文件位置: soullink.db")
        print("🔧 你现在可以启动应用了: python main.py")
        
    except Exception as e:
        print(f"❌ 初始化失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 