from fastapi import FastAPI, WebSocket, Depends
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from models.database import create_tables, get_db
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv
import asyncio

load_dotenv()

# 创建FastAPI应用
app = FastAPI(
    title="SoulLink API",
    description="数字灵魂匹配系统 API",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React开发服务器
        "http://127.0.0.1:3000",
        os.getenv("FRONTEND_URL", "http://localhost:3000")
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(router, prefix="/api/v1", tags=["main"])

# WebSocket端点
@app.websocket("/ws/chat/{match_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    match_id: str, 
    userId: str, 
    db: Session = Depends(get_db)
):
    """WebSocket聊天端点"""
    from services.websocket_service import websocket_service
    await websocket_service.handle_websocket_connection(websocket, match_id, userId, db)

def check_environment():
    """检查环境配置"""
    print("🔍 检查环境配置...")
    
    # 检查OpenAI API Key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        print("⚠️  警告: OpenAI API Key 未设置或使用默认值")
        print("   请在 backend/.env 文件中设置 OPENAI_API_KEY")
        print("   获取API Key: https://platform.openai.com/api-keys")
    else:
        print("✅ OpenAI API Key 已配置")
    
    # 检查数据库配置
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        print(f"📊 使用数据库: {db_url.split('://')[0].upper()}")
    else:
        print("📊 使用默认 SQLite 数据库")
    
    print("=" * 50)

def init_database_if_needed():
    """如果需要则初始化数据库"""
    try:
        # 检查是否是SQLite且文件不存在
        db_url = os.getenv("DATABASE_URL")
        if not db_url or db_url.startswith("sqlite"):
            db_file = "soullink.db"
            if not os.path.exists(db_file):
                print("🚀 首次运行，正在初始化数据库...")
                
                # 导入初始化模块
                from init_db import init_default_scenarios
                
                # 创建表格
                create_tables()
                
                # 初始化默认数据
                init_default_scenarios()
                
                print("✅ 数据库初始化完成！")
            else:
                print("📊 数据库已存在，跳过初始化")
        else:
            # PostgreSQL或其他数据库，只创建表格
            create_tables()
            print("📊 数据库表检查完成")
            
    except Exception as e:
        print(f"❌ 数据库初始化失败: {e}")
        print("💡 请尝试手动运行: python init_db.py")

@app.on_event("startup")
async def startup_event():
    """应用启动时的初始化"""
    print("🌐 SoulLink API 启动中...")
    print("=" * 50)

    # 检查环境配置
    check_environment()

    # 初始化数据库
    init_database_if_needed()

    # 初始化服务依赖
    from services.ai_service import ai_service
    from services.match_service import match_service
    from services.scheduler_service import scheduler_service
    match_service.ai_service = ai_service
    print("🤖 AI服务初始化完成")
    
    # 启动定时任务调度服务
    await scheduler_service.start()
    
    # 启动WebSocket清理任务
    from services.websocket_service import cleanup_typing_status
    asyncio.create_task(cleanup_typing_status())
    print("💬 WebSocket服务初始化完成")

    print("🚀 SoulLink API 启动完成！")
    print("📚 API文档: http://localhost:8000/docs")
    print("🔧 健康检查: http://localhost:8000/health")
    print("💬 WebSocket聊天: ws://localhost:8000/ws/chat/{match_id}?userId={user_id}")

@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时的清理"""
    print("🛑 SoulLink API 关闭中...")
    
    # 停止定时任务调度服务
    from services.scheduler_service import scheduler_service
    await scheduler_service.stop()
    
    print("👋 SoulLink API 已安全关闭")

@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "Welcome to SoulLink API",
        "version": "1.0.0",
        "docs": "/docs",
        "description": "AI-powered digital soul matching system"
    }

@app.get("/health")
async def health_check():
    """健康检查"""
    # 检查数据库连接
    try:
        from models.database import SessionLocal
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        db_status = "healthy"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    # 检查OpenAI配置
    api_key = os.getenv("OPENAI_API_KEY")
    openai_status = "configured" if api_key and api_key != "your_openai_api_key_here" else "not_configured"
    
    return {
        "status": "healthy",
        "database": db_status,
        "openai": openai_status,
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    
    # 从环境变量获取配置
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "true").lower() == "true"
    
    print(f"🌐 启动服务器: http://{host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    ) 