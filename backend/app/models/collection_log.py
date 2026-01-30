from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.sql import func

from app.database import Base


class CollectionLog(Base):
    __tablename__ = "collection_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Collection info
    source = Column(String(50), nullable=False, index=True)
    collector_name = Column(String(100), nullable=False)

    # Results
    started_at = Column(DateTime, default=func.now())
    finished_at = Column(DateTime, nullable=True)

    projects_found = Column(Integer, default=0)
    projects_new = Column(Integer, default=0)
    projects_updated = Column(Integer, default=0)

    # Status
    success = Column(Boolean, default=False)
    error_message = Column(Text, nullable=True)

    def __repr__(self):
        return f"<CollectionLog {self.source} at {self.started_at}>"
