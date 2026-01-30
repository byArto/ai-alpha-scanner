from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, Enum
from sqlalchemy.sql import func
from datetime import datetime
import enum

from app.database import Base


class ProjectSource(str, enum.Enum):
    GITHUB = "github"
    TWITTER = "twitter"
    GALXE = "galxe"
    LAYER3 = "layer3"
    ZEALY = "zealy"
    MANUAL = "manual"


class ProjectCategory(str, enum.Enum):
    L1 = "l1"
    L2 = "l2"
    DEFI = "defi"
    INFRASTRUCTURE = "infrastructure"
    TOOLING = "tooling"
    GAMING = "gaming"
    NFT = "nft"
    SOCIAL = "social"
    AI = "ai"
    OTHER = "other"


class ProjectStatus(str, enum.Enum):
    NEW = "new"
    ANALYZED = "analyzed"
    ARCHIVED = "archived"
    REJECTED = "rejected"


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Basic info
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Source info
    source = Column(Enum(ProjectSource), nullable=False, index=True)
    source_url = Column(String(512), nullable=True)

    # GitHub specific
    github_url = Column(String(512), nullable=True)
    github_org = Column(String(255), nullable=True)
    github_stars = Column(Integer, default=0)
    github_forks = Column(Integer, default=0)
    github_commits_30d = Column(Integer, default=0)
    github_contributors = Column(Integer, default=0)
    github_created_at = Column(DateTime, nullable=True)
    github_language = Column(String(100), nullable=True)

    # Social links
    twitter_url = Column(String(512), nullable=True)
    twitter_handle = Column(String(255), nullable=True)
    website_url = Column(String(512), nullable=True)
    discord_url = Column(String(512), nullable=True)

    # Analysis results
    category = Column(Enum(ProjectCategory), default=ProjectCategory.OTHER)
    score = Column(Float, default=0.0)  # 0-10
    confidence = Column(Float, default=0.0)  # 0-1

    # AI analysis
    why_early = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    red_flags = Column(Text, nullable=True)

    # Status
    status = Column(Enum(ProjectStatus), default=ProjectStatus.NEW, index=True)
    is_featured = Column(Boolean, default=False)

    # Timestamps
    discovered_at = Column(DateTime, default=func.now())
    analyzed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Project {self.name} ({self.source.value})>"
