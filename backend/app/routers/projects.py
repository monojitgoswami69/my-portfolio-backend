import time
from fastapi import APIRouter, Request, Depends, HTTPException, BackgroundTasks
from ..config import settings, logger
from ..dependencies import require_admin
from ..utils.limiter import limiter
from ..providers.github import github_provider
from ..providers.database.activity import activity_provider

router = APIRouter(prefix="/api/v1/projects", tags=["projects"])


@router.get("")
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def get_projects(request: Request, user: dict = Depends(require_admin)):
    start_time = time.perf_counter()
    res = await github_provider.get_projects()
    elapsed = (time.perf_counter() - start_time) * 1000
    logger.info(f"Projects retrieved: {len(res['projects'])} items | {elapsed:.1f}ms")
    return {"status": "success", "projects": res["projects"], "commit": res.get("commit")}


@router.post("/save")
@limiter.limit(settings.RATE_LIMIT_SAVE)
async def save_projects(request: Request, background_tasks: BackgroundTasks, user: dict = Depends(require_admin)):
    start_time = time.perf_counter()
    req = await request.json()
    projects = req.get("projects", [])
    message = req.get("message")

    if not isinstance(projects, list):
        raise HTTPException(400, "Projects must be a list")

    # Save to GitHub
    res = await github_provider.save_projects(projects, message or f"Update by {user['username']}")

    # Log activity in background
    background_tasks.add_task(
        activity_provider.log_activity,
        "projects_updated",
        user["uid"],
        "projects",
        "main",
        {"count": len(projects)}
    )

    elapsed = (time.perf_counter() - start_time) * 1000
    logger.info(f"Projects saved: {len(projects)} items | {elapsed:.1f}ms")
    return {"status": "success", "message": "Projects saved", "commit": res.get("commit")}
