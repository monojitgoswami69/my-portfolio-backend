"""
Firestore implementation for metrics storage.
"""
from datetime import datetime, timezone, timedelta
from typing import List
import asyncio

from google.cloud import firestore
from google.cloud.firestore_v1 import Query

from ...config import settings
from .firestore_init import get_db


class MetricsProvider:
    """Firestore implementation for metrics storage."""

    @property
    def db(self) -> firestore.AsyncClient:
        return get_db()

    async def get_metrics(self) -> dict:
        """Get dashboard metrics."""
        doc = await self.db.collection(settings.METRICS_COLLECTION).document("dashboard").get()
        if doc.exists:
            return doc.to_dict()
        return {"total_queries": 0, "total_knowledge_items": 0}

    async def update_metrics(self, updates: dict) -> bool:
        """Update metrics with provided updates."""
        updates["last_updated"] = datetime.now(timezone.utc)
        await self.db.collection(settings.METRICS_COLLECTION).document("dashboard").set(
            updates, merge=True
        )
        return True

    async def increment_query_count(self) -> None:
        """Increment the total query count."""
        await self.db.collection(settings.METRICS_COLLECTION).document("dashboard").set(
            {
                "total_queries": firestore.Increment(1),
                "last_updated": datetime.now(timezone.utc)
            },
            merge=True
        )

    async def increment_daily_hit(self, date_str: str = None) -> None:
        """Increment hits for a specific date in weekly_metrics collection."""
        if date_str is None:
            date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        doc_ref = self.db.collection(settings.WEEKLY_METRICS_COLLECTION).document(date_str)
        await doc_ref.set({"hits": firestore.Increment(1)}, merge=True)

    async def get_weekly_metrics(self, days: int = 7) -> List[dict]:
        """Get weekly metrics for the last N days."""
        now = datetime.now(timezone.utc)
        dates = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days - 1, -1, -1)]

        async def get_hits(date_str: str) -> dict:
            doc = await self.db.collection(settings.WEEKLY_METRICS_COLLECTION).document(date_str).get()
            hits = doc.to_dict().get("hits", 0) if doc.exists else 0

            # Convert YYYY-MM-DD to DD/MM/YYYY
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            formatted_date = date_obj.strftime("%d/%m/%Y")

            return {
                "date": formatted_date,
                "hits": hits,
                "queries": hits,
                "count": hits
            }

        results = await asyncio.gather(*[get_hits(date_str) for date_str in dates])
        return list(results)

    async def backup_system_instructions(self, content: str, backed_up_by: str) -> str:
        """Backup system instructions to history."""
        data = {
            "content": content,
            "backed_up_by": backed_up_by,
            "backed_up_at": datetime.now(timezone.utc)
        }
        ref = self.db.collection(settings.SYS_INS_HISTORY_COLLECTION).document()
        await ref.set(data)
        return ref.id

    async def get_system_instructions_history(self, limit: int = 50) -> List[dict]:
        """Get system instructions history."""
        query = (
            self.db.collection(settings.SYS_INS_HISTORY_COLLECTION)
            .order_by("backed_up_at", direction=Query.DESCENDING)
            .limit(limit)
        )

        results = []
        async for doc in query.stream():
            data = doc.to_dict()
            data['id'] = doc.id
            results.append(data)

        return results


metrics_provider = MetricsProvider()
