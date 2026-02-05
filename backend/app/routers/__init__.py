"""Routers package."""
from .auth import router as auth_router
from .dashboard import router as dashboard_router
from .system_instructions import router as system_instructions_router
from .projects import router as projects_router
from .knowledge import router as knowledge_router
from .health import router as health_router
from .chat import router as chat_router
from .contacts import router as contacts_router

__all__ = [
    'auth_router',
    'dashboard_router',
    'system_instructions_router',
    'projects_router',
    'knowledge_router',
    'health_router',
    'chat_router',
    'contacts_router'
]
