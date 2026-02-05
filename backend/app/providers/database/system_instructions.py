"""
Firestore implementation for system instructions storage.
Replaces GitHub-based storage with Firestore for faster access.
"""
from datetime import datetime, timezone
from typing import Optional

from google.cloud import firestore

from ...config import settings, logger
from .firestore_init import get_db


class SystemInstructionsProvider:
    """Firestore implementation for system instructions storage."""

    COLLECTION = "system_instructions"
    DOC_ID = "current"

    @property
    def db(self) -> firestore.AsyncClient:
        return get_db()

    async def get_instructions(self) -> dict:
        """Get current system instructions from Firestore."""
        doc = await self.db.collection(self.COLLECTION).document(self.DOC_ID).get()
        if doc.exists:
            data = doc.to_dict()
            return {
                "content": data.get("content", ""),
                "updated_at": data.get("updated_at"),
                "updated_by": data.get("updated_by"),
                "version": data.get("version", 1)
            }
        return {"content": "", "updated_at": None, "updated_by": None, "version": 0}

    async def save_instructions(self, content: str, updated_by: str) -> dict:
        """Save system instructions to Firestore."""
        # Get current version
        current = await self.get_instructions()
        
        # Save new instructions
        new_version = (current.get("version", 0) or 0) + 1
        data = {
            "content": content,
            "updated_at": datetime.now(timezone.utc),
            "updated_by": updated_by,
            "version": new_version
        }
        
        await self.db.collection(self.COLLECTION).document(self.DOC_ID).set(data)
        logger.info(f"System instructions v{new_version} saved by {updated_by}")
        
        return {"version": new_version, "success": True}


system_instructions_provider = SystemInstructionsProvider()
