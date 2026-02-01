from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
import re

from app.database import async_session_maker
from app.models import Project, ProjectSource, ProjectStatus, ProjectCategory


class ProjectService:
    """Service for managing projects in database"""

    @staticmethod
    def generate_slug(name: str, source: str) -> str:
        """Generate unique slug from project name and source"""
        # Clean name: lowercase, replace spaces and special chars with dash
        clean_name = re.sub(r'[^a-zA-Z0-9]+', '-', name.lower()).strip('-')
        return f"{clean_name}-{source}"

    @staticmethod
    def detect_category(data: Dict[str, Any]) -> ProjectCategory:
        """Detect project category from description and topics"""
        description = (data.get("description") or "").lower()
        topics = [t.lower() for t in data.get("github_topics", [])]
        name = (data.get("name") or "").lower()

        all_text = f"{description} {name} {' '.join(topics)}"

        # Category detection rules
        if any(kw in all_text for kw in ["layer2", "l2", "rollup", "zk-rollup", "optimistic"]):
            return ProjectCategory.L2
        if any(kw in all_text for kw in ["layer1", "l1", "blockchain", "consensus"]):
            return ProjectCategory.L1
        if any(kw in all_text for kw in ["defi", "dex", "swap", "lending", "yield", "amm", "liquidity"]):
            return ProjectCategory.DEFI
        if any(kw in all_text for kw in ["bridge", "cross-chain", "interoperability", "oracle"]):
            return ProjectCategory.INFRASTRUCTURE
        if any(kw in all_text for kw in ["sdk", "tool", "library", "framework", "cli", "api"]):
            return ProjectCategory.TOOLING
        if any(kw in all_text for kw in ["game", "gaming", "play-to-earn", "metaverse"]):
            return ProjectCategory.GAMING
        if any(kw in all_text for kw in ["nft", "collectible", "marketplace"]):
            return ProjectCategory.NFT
        if any(kw in all_text for kw in ["social", "dao", "governance", "community"]):
            return ProjectCategory.SOCIAL
        if any(kw in all_text for kw in [" ai ", "machine learning", "llm", "gpt", "neural"]):
            return ProjectCategory.AI

        return ProjectCategory.OTHER

    @staticmethod
    def calculate_initial_score(data: Dict[str, Any]) -> float:
        """Calculate initial score based on available metrics"""
        score = 5.0  # Base score

        # GitHub activity signals
        stars = data.get("github_stars", 0)
        commits = data.get("github_commits_30d", 0)
        contributors = data.get("github_contributors", 0)

        # Stars scoring (0-2 points)
        if stars > 100:
            score += 2.0
        elif stars > 50:
            score += 1.5
        elif stars > 20:
            score += 1.0
        elif stars > 10:
            score += 0.5

        # Commits scoring (0-1.5 points)
        if commits > 50:
            score += 1.5
        elif commits > 20:
            score += 1.0
        elif commits > 10:
            score += 0.5

        # Contributors scoring (0-1 point)
        if contributors > 5:
            score += 1.0
        elif contributors > 2:
            score += 0.5

        # Early signals bonus (0-0.5 points)
        early_signals = data.get("early_signals", [])
        if any("testnet" in s or "devnet" in s for s in early_signals):
            score += 0.5

        # Has social presence bonus
        if data.get("twitter_url"):
            score += 0.3
        if data.get("discord_url"):
            score += 0.2

        # Cap at 10
        return min(10.0, round(score, 1))

    async def save_projects_from_collector(
        self,
        projects_data: List[Dict[str, Any]],
        source: ProjectSource
    ) -> Dict[str, int]:
        """Save projects from collector to database"""
        stats = {"new": 0, "updated": 0, "skipped": 0}

        async with async_session_maker() as session:
            for data in projects_data:
                try:
                    result = await self._save_single_project(session, data, source)
                    stats[result] += 1
                except Exception as e:
                    logger.error(f"Error saving project {data.get('name')}: {e}")
                    stats["skipped"] += 1

            await session.commit()

        logger.info(f"Saved projects: {stats}")
        return stats

    async def _save_single_project(
        self,
        session: AsyncSession,
        data: Dict[str, Any],
        source: ProjectSource
    ) -> str:
        """Save or update single project"""
        slug = self.generate_slug(data.get("name", "unknown"), source.value)

        # Check if exists
        result = await session.execute(
            select(Project).where(Project.slug == slug)
        )
        existing = result.scalar_one_or_none()

        if existing:
            # Update existing project
            await self._update_project(session, existing, data)
            return "updated"
        else:
            # Create new project
            await self._create_project(session, data, source, slug)
            return "new"

    async def _create_project(
        self,
        session: AsyncSession,
        data: Dict[str, Any],
        source: ProjectSource,
        slug: str
    ):
        """Create new project"""
        category = self.detect_category(data)
        score = self.calculate_initial_score(data)

        # Parse github_created_at
        github_created = None
        if data.get("github_created_at"):
            try:
                github_created = datetime.fromisoformat(
                    data["github_created_at"].replace("Z", "+00:00")
                )
            except:
                pass

        project = Project(
            name=data.get("name", "Unknown"),
            slug=slug,
            description=data.get("description"),
            source=source,
            source_url=data.get("github_url") or data.get("source_url"),

            # GitHub fields
            github_url=data.get("github_url"),
            github_org=data.get("github_org"),
            github_stars=data.get("github_stars", 0),
            github_forks=data.get("github_forks", 0),
            github_commits_30d=data.get("github_commits_30d", 0),
            github_contributors=data.get("github_contributors", 0),
            github_created_at=github_created,
            github_language=data.get("github_language"),

            # Social links
            twitter_url=data.get("twitter_url"),
            twitter_handle=self._extract_twitter_handle(data.get("twitter_url")),
            website_url=data.get("website_url"),
            discord_url=data.get("discord_url"),

            # Analysis
            category=category,
            score=score,
            confidence=0.3,  # Low confidence until AI analysis

            # Status
            status=ProjectStatus.NEW
        )

        session.add(project)
        logger.debug(f"Created new project: {project.name}")

    async def _update_project(
        self,
        session: AsyncSession,
        project: Project,
        data: Dict[str, Any]
    ):
        """Update existing project with fresh data"""
        # Update GitHub metrics
        project.github_stars = data.get("github_stars", project.github_stars)
        project.github_forks = data.get("github_forks", project.github_forks)
        project.github_commits_30d = data.get("github_commits_30d", project.github_commits_30d)
        project.github_contributors = data.get("github_contributors", project.github_contributors)

        # Update social links if found
        if data.get("twitter_url") and not project.twitter_url:
            project.twitter_url = data["twitter_url"]
            project.twitter_handle = self._extract_twitter_handle(data["twitter_url"])

        if data.get("discord_url") and not project.discord_url:
            project.discord_url = data["discord_url"]

        if data.get("website_url") and not project.website_url:
            project.website_url = data["website_url"]

        # Recalculate score
        project.score = self.calculate_initial_score(data)
        project.updated_at = datetime.utcnow()

        logger.debug(f"Updated project: {project.name}")

    @staticmethod
    def _extract_twitter_handle(url: Optional[str]) -> Optional[str]:
        """Extract Twitter handle from URL"""
        if not url:
            return None
        match = re.search(r'(?:twitter\.com|x\.com)/([a-zA-Z0-9_]+)', url)
        return match.group(1) if match else None

    async def get_projects(
        self,
        status: Optional[ProjectStatus] = None,
        category: Optional[ProjectCategory] = None,
        source: Optional[ProjectSource] = None,
        min_score: float = 0,
        limit: int = 50,
        offset: int = 0
    ) -> List[Project]:
        """Get projects with filters"""
        async with async_session_maker() as session:
            query = select(Project)

            if status:
                query = query.where(Project.status == status)
            if category:
                query = query.where(Project.category == category)
            if source:
                query = query.where(Project.source == source)
            if min_score > 0:
                query = query.where(Project.score >= min_score)

            query = query.order_by(Project.score.desc())
            query = query.offset(offset).limit(limit)

            result = await session.execute(query)
            return result.scalars().all()

    async def get_project_by_slug(self, slug: str) -> Optional[Project]:
        """Get single project by slug"""
        async with async_session_maker() as session:
            result = await session.execute(
                select(Project).where(Project.slug == slug)
            )
            return result.scalar_one_or_none()

    async def get_stats(self) -> Dict[str, Any]:
        """Get database statistics"""
        async with async_session_maker() as session:
            # Total count
            total = await session.execute(select(func.count(Project.id)))

            # By status
            by_status = {}
            for status in ProjectStatus:
                count = await session.execute(
                    select(func.count(Project.id)).where(Project.status == status)
                )
                by_status[status.value] = count.scalar()

            # By source
            by_source = {}
            for source in ProjectSource:
                count = await session.execute(
                    select(func.count(Project.id)).where(Project.source == source)
                )
                by_source[source.value] = count.scalar()

            # By category
            by_category = {}
            for cat in ProjectCategory:
                count = await session.execute(
                    select(func.count(Project.id)).where(Project.category == cat)
                )
                by_category[cat.value] = count.scalar()

            return {
                "total": total.scalar(),
                "by_status": by_status,
                "by_source": by_source,
                "by_category": by_category
            }


# Singleton instance
project_service = ProjectService()
