import time
from fastapi import APIRouter, Request, Depends, HTTPException, BackgroundTasks
from ..config import settings, logger
from ..dependencies import require_admin
from ..utils.limiter import limiter
from ..providers.github import github_provider
from ..providers.database.activity import activity_provider

router = APIRouter(prefix="/api/v1/contacts", tags=["contacts"])


@router.get("")
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def get_contacts(request: Request, user: dict = Depends(require_admin)):
    start_time = time.perf_counter()
    res = await github_provider.get_contacts()
    elapsed = (time.perf_counter() - start_time) * 1000
    logger.info(f"Contacts retrieved | {elapsed:.1f}ms")
    return {"status": "success", "contact": res["contact"], "commit": res.get("commit")}


@router.post("/save")
@limiter.limit(settings.RATE_LIMIT_SAVE)
async def save_contacts(request: Request, background_tasks: BackgroundTasks, user: dict = Depends(require_admin)):
    start_time = time.perf_counter()
    req = await request.json()
    contact = req.get("contact", {})
    message = req.get("message")

    if not isinstance(contact, dict):
        raise HTTPException(400, "Contact must be an object")

    # Validate structure
    if "email" not in contact or "socials" not in contact:
        raise HTTPException(400, "Contact must have 'email' and 'socials' fields")

    # Save to GitHub
    res = await github_provider.save_contacts(contact, message or f"Update by {user['username']}")

    # Log activity in background
    background_tasks.add_task(
        activity_provider.log_activity,
        "contacts_updated",
        user["uid"],
        "contacts",
        "main",
        {}
    )

    elapsed = (time.perf_counter() - start_time) * 1000
    logger.info(f"Contacts saved | {elapsed:.1f}ms")
    return {"status": "success", "message": "Contacts saved", "commit": res.get("commit")}
