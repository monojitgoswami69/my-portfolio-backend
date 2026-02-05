import time
from fastapi import APIRouter, Request, Depends, HTTPException, BackgroundTasks
from ..config import settings, logger
from ..dependencies import require_admin
from ..utils.limiter import limiter
from ..providers.database.system_instructions import system_instructions_provider
from ..providers.database.activity import activity_provider

router = APIRouter(prefix="/api/v1/system-instructions", tags=["system-instructions"])


@router.get("")
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def get_sys_ins(request: Request, user: dict = Depends(require_admin)):
    start_time = time.perf_counter()
    res = await system_instructions_provider.get_instructions()
    elapsed = (time.perf_counter() - start_time) * 1000
    logger.info(f"System instructions retrieved | {elapsed:.1f}ms")
    return {"status": "success", "content": res["content"], "version": res.get("version")}


@router.post("/save")
@limiter.limit(settings.RATE_LIMIT_SAVE)
async def save_sys_ins(request: Request, background_tasks: BackgroundTasks, user: dict = Depends(require_admin)):
    start_time = time.perf_counter()
    req = await request.json()
    content = req.get("content", "")

    if not content or len(content) > settings.SYS_INS_MAX_CONTENT:
        raise HTTPException(400, "Invalid content length")

    # Save to Firestore
    res = await system_instructions_provider.save_instructions(content, user["username"])

    # Log activity in background
    background_tasks.add_task(
        activity_provider.log_activity,
        "sys_instructions_updated",
        user["uid"],
        "sys_ins",
        "main",
        {}
    )

    elapsed = (time.perf_counter() - start_time) * 1000
    logger.info(f"System instructions saved | {elapsed:.1f}ms")
    return {"status": "success", "message": "System instructions saved", "version": res.get("version")}
