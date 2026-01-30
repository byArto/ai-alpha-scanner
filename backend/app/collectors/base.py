from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime
from loguru import logger

from app.database import async_session_maker
from app.models import CollectionLog


class BaseCollector(ABC):
    """Base class for all data collectors"""

    name: str = "base"
    source: str = "unknown"

    def __init__(self):
        self.logger = logger.bind(collector=self.name)

    @abstractmethod
    async def collect(self) -> List[Dict[str, Any]]:
        """Collect raw data from source. Must be implemented by subclasses."""
        pass

    async def run(self) -> Dict[str, Any]:
        """Run collection with logging"""
        log_entry = CollectionLog(
            source=self.source,
            collector_name=self.name,
            started_at=datetime.utcnow()
        )

        try:
            self.logger.info(f"Starting collection from {self.source}")

            results = await self.collect()

            log_entry.finished_at = datetime.utcnow()
            log_entry.projects_found = len(results)
            log_entry.success = True

            self.logger.info(f"Collection complete: {len(results)} projects found")

            return {
                "success": True,
                "projects_found": len(results),
                "data": results
            }

        except Exception as e:
            log_entry.finished_at = datetime.utcnow()
            log_entry.success = False
            log_entry.error_message = str(e)

            self.logger.error(f"Collection failed: {e}")

            return {
                "success": False,
                "error": str(e),
                "data": []
            }

        finally:
            async with async_session_maker() as session:
                session.add(log_entry)
                await session.commit()
