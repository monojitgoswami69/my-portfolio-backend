"""
Chat router for NEXUS chatbot.
Public endpoint (no auth required) with in-memory caching for fast responses.
"""
import time
import json
import os
from datetime import datetime, timezone
from typing import Optional, Dict
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

from ..config import settings, logger
from ..utils.limiter import limiter
from ..providers.database.knowledge import knowledge_provider, KNOWLEDGE_CATEGORIES
from ..providers.database.system_instructions import system_instructions_provider

# Try to import google-genai, fallback gracefully
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning("google-genai not installed. Chat endpoint will return mock responses.")

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


# ============================================
# In-Memory Cache
# ============================================
class ContextCache:
    """In-memory cache for knowledge base and system instructions."""
    
    def __init__(self):
        self.knowledge: Dict[str, str] = {}
        self.system_instructions: str = ""
        self.last_refresh: Optional[datetime] = None
        self.cache_ttl_seconds: int = 300  # 5 minutes default
    
    def is_stale(self) -> bool:
        """Check if cache needs refresh."""
        if self.last_refresh is None:
            return True
        elapsed = (datetime.now(timezone.utc) - self.last_refresh).total_seconds()
        return elapsed > self.cache_ttl_seconds
    
    async def refresh(self) -> None:
        """Refresh cache from Firestore."""
        start = time.perf_counter()
        
        # Fetch knowledge base
        categories = await knowledge_provider.get_all_categories()
        self.knowledge = {
            cat: data.get("content", "") 
            for cat, data in categories.items()
        }
        
        # Fetch system instructions
        sys_ins = await system_instructions_provider.get_instructions()
        self.system_instructions = sys_ins.get("content", "")
        
        self.last_refresh = datetime.now(timezone.utc)
        elapsed = (time.perf_counter() - start) * 1000
        logger.info(f"Context cache refreshed | {elapsed:.1f}ms")
    
    async def get_context(self) -> Dict[str, str]:
        """Get knowledge context, refreshing if stale."""
        if self.is_stale():
            await self.refresh()
        return self.knowledge
    
    async def get_system_instructions(self) -> str:
        """Get system instructions, refreshing if stale."""
        if self.is_stale():
            await self.refresh()
        return self.system_instructions


# Global cache instance
_cache = ContextCache()


# ============================================
# Request/Response Models
# ============================================
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    status: str
    response: str
    timestamp: str
    cached: bool = False


# ============================================
# Gemini Client
# ============================================
def get_gemini_client():
    """Get Gemini client, initialized lazily."""
    if not GENAI_AVAILABLE:
        return None
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.error("GEMINI_API_KEY not set")
        return None
    
    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        logger.error(f"Failed to initialize Gemini client: {e}")
        return None


# ============================================
# Chat Endpoints
# ============================================
@router.post("", response_model=ChatResponse)
@limiter.limit("60/minute")  # Public endpoint - rate limit per IP
async def chat(request: Request, chat_request: ChatRequest):
    """
    Public chat endpoint for NEXUS chatbot.
    No authentication required.
    Uses in-memory caching for fast responses.
    """
    start_time = time.perf_counter()
    
    user_message = chat_request.message.strip()
    if not user_message:
        raise HTTPException(400, "Message cannot be empty")
    
    if len(user_message) > 2000:
        raise HTTPException(400, "Message too long (max 2000 characters)")
    
    # Get cached context
    was_cached = not _cache.is_stale()
    context = await _cache.get_context()
    system_instructions = await _cache.get_system_instructions()
    
    # Build prompt JSON (as specified in chatbot design)
    prompt_data = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "context": context,
        "user_prompt": user_message
    }
    prompt_json = json.dumps(prompt_data)
    
    # Generate response
    client = get_gemini_client()
    if client is None:
        # Fallback response when Gemini is unavailable
        response_text = "<p>Oops! My brain is taking a coffee break ☕. Try again in a bit!</p>"
    else:
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash-lite',
                contents=prompt_json,
                config=types.GenerateContentConfig(
                    system_instruction=system_instructions,
                    temperature=1.8,
                    top_p=0.95,
                    top_k=40
                )
            )
            response_text = response.text if response.text else "<p>*stares blankly*</p>"
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            response_text = "<p>Whoa, something broke on my end. Not my fault though... probably. 🤷</p>"
    
    elapsed = (time.perf_counter() - start_time) * 1000
    logger.info(f"Chat response generated | cached={was_cached} | {elapsed:.1f}ms")
    
    return ChatResponse(
        status="success",
        response=response_text,
        timestamp=datetime.now(timezone.utc).isoformat(),
        cached=was_cached
    )


@router.get("/health")
async def chat_health():
    """Health check for chat endpoint."""
    return {
        "status": "healthy",
        "genai_available": GENAI_AVAILABLE,
        "cache_stale": _cache.is_stale(),
        "last_refresh": _cache.last_refresh.isoformat() if _cache.last_refresh else None
    }
