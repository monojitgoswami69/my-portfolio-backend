"""
Firestore implementation for knowledge base storage.
Stores raw text for 5 categories in separate documents.
"""
from datetime import datetime, timezone
from typing import Dict, Optional

from google.cloud import firestore

from ...config import settings, logger
from .firestore_init import get_db

# Valid knowledge base categories
KNOWLEDGE_CATEGORIES = ["about-me", "tech-stack", "projects", "contacts", "miscellaneous"]


class KnowledgeProvider:
    """Firestore implementation for knowledge base storage."""

    @property
    def db(self) -> firestore.AsyncClient:
        return get_db()

    async def get_category(self, category: str) -> Optional[dict]:
        """Get content for a specific category."""
        if category not in KNOWLEDGE_CATEGORIES:
            return None

        doc = await self.db.collection(settings.KNOWLEDGE_COLLECTION).document(category).get()
        if doc.exists:
            return doc.to_dict()
        return {"content": "", "updated_at": None, "updated_by": None}

    async def get_all_categories(self) -> Dict[str, dict]:
        """Get content for all categories."""
        results = {}
        for category in KNOWLEDGE_CATEGORIES:
            doc = await self.db.collection(settings.KNOWLEDGE_COLLECTION).document(category).get()
            if doc.exists:
                data = doc.to_dict()
                # Convert timestamps to ISO format
                if data.get('updated_at') and hasattr(data['updated_at'], 'isoformat'):
                    data['updated_at'] = data['updated_at'].isoformat()
                results[category] = data
            else:
                results[category] = {"content": "", "updated_at": None, "updated_by": None}
        return results

    async def save_category(self, category: str, content: str, updated_by: str) -> bool:
        """Save content for a specific category."""
        if category not in KNOWLEDGE_CATEGORIES:
            raise ValueError(f"Invalid category: {category}")

        data = {
            "content": content,
            "updated_at": datetime.now(timezone.utc),
            "updated_by": updated_by
        }

        await self.db.collection(settings.KNOWLEDGE_COLLECTION).document(category).set(data)
        logger.info(f"Knowledge base category '{category}' updated by {updated_by}")
        return True

    async def delete_category(self, category: str) -> bool:
        """Delete content for a specific category (reset to empty)."""
        if category not in KNOWLEDGE_CATEGORIES:
            raise ValueError(f"Invalid category: {category}")

        await self.db.collection(settings.KNOWLEDGE_COLLECTION).document(category).delete()
        logger.info(f"Knowledge base category '{category}' deleted")
        return True


knowledge_provider = KnowledgeProvider()
