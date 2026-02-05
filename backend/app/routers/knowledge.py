import time
from fastapi import APIRouter, Request, Depends, HTTPException, BackgroundTasks
from ..config import settings, logger
from ..dependencies import require_admin
from ..utils.limiter import limiter
from ..providers.database.knowledge import knowledge_provider, KNOWLEDGE_CATEGORIES
from ..providers.database.activity import activity_provider

router = APIRouter(prefix="/api/v1/knowledge", tags=["knowledge"])


@router.get("")
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def get_all_knowledge(request: Request, user: dict = Depends(require_admin)):
    """Get all knowledge base categories."""
    start_time = time.perf_counter()
    data = await knowledge_provider.get_all_categories()
    elapsed = (time.perf_counter() - start_time) * 1000
    logger.info(f"Knowledge base retrieved | {elapsed:.1f}ms")
    return {"status": "success", "categories": data}


@router.get("/categories")
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def get_categories(request: Request, user: dict = Depends(require_admin)):
    """Get list of valid categories."""
    return {"status": "success", "categories": KNOWLEDGE_CATEGORIES}


@router.get("/{category}")
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def get_category(request: Request, category: str, user: dict = Depends(require_admin)):
    """Get content for a specific category."""
    start_time = time.perf_counter()
    
    if category not in KNOWLEDGE_CATEGORIES:
        raise HTTPException(404, f"Invalid category: {category}")
    
    data = await knowledge_provider.get_category(category)
    elapsed = (time.perf_counter() - start_time) * 1000
    logger.info(f"Knowledge category '{category}' retrieved | {elapsed:.1f}ms")
    return {"status": "success", "category": category, "data": data}


@router.post("/{category}/save")
@limiter.limit(settings.RATE_LIMIT_SAVE)
async def save_category(
    request: Request,
    category: str,
    background_tasks: BackgroundTasks,
    user: dict = Depends(require_admin)
):
    """Save content for a specific category."""
    start_time = time.perf_counter()
    
    if category not in KNOWLEDGE_CATEGORIES:
        raise HTTPException(404, f"Invalid category: {category}")
    
    req = await request.json()
    content = req.get("content", "")
    
    if len(content) > settings.KNOWLEDGE_MAX_CONTENT:
        raise HTTPException(400, "Content too long")
    
    await knowledge_provider.save_category(category, content, user["username"])
    
    # Log activity in background
    background_tasks.add_task(
        activity_provider.log_activity,
        "knowledge_updated",
        user["uid"],
        "knowledge",
        category,
        {"category": category}
    )
    
    elapsed = (time.perf_counter() - start_time) * 1000
    logger.info(f"Knowledge category '{category}' saved | {elapsed:.1f}ms")
    return {"status": "success", "message": f"Category '{category}' saved"}
