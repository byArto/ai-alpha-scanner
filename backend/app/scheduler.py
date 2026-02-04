from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
from loguru import logger

from app.config import settings
from app.collectors import GitHubCollector, DefiLlamaCollector
from app.services.project_service import project_service
from app.models import ProjectSource


class TaskScheduler:
    """Scheduler for periodic data collection tasks"""

    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.logger = logger.bind(module="scheduler")
        self._is_running = False

    def setup_jobs(self):
        """Configure scheduled jobs"""

        # GitHub collection - every 6 hours
        self.scheduler.add_job(
            self.run_github_collection,
            trigger=IntervalTrigger(hours=settings.github_collect_interval_hours),
            id="github_collection",
            name="GitHub Collection",
            replace_existing=True,
            max_instances=1
        )

        # DeFiLlama collection - every 12 hours
        self.scheduler.add_job(
            self.run_defillama_collection,
            trigger=IntervalTrigger(hours=settings.testnet_collect_interval_hours),
            id="defillama_collection",
            name="DeFiLlama Collection",
            replace_existing=True,
            max_instances=1
        )

        # Daily summary - every day at 9:00 AM UTC
        self.scheduler.add_job(
            self.generate_daily_summary,
            trigger=CronTrigger(hour=9, minute=0),
            id="daily_summary",
            name="Daily Summary",
            replace_existing=True,
            max_instances=1
        )

        self.logger.info("Scheduled jobs configured")

    def start(self):
        """Start the scheduler"""
        if not self._is_running:
            self.setup_jobs()
            self.scheduler.start()
            self._is_running = True
            self.logger.info("Scheduler started")

    def stop(self):
        """Stop the scheduler"""
        if self._is_running:
            self.scheduler.shutdown(wait=False)
            self._is_running = False
            self.logger.info("Scheduler stopped")

    def get_jobs_status(self) -> list:
        """Get status of all scheduled jobs"""
        jobs = []
        for job in self.scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
                "trigger": str(job.trigger)
            })
        return jobs

    async def run_github_collection(self):
        """Run GitHub collection task"""
        self.logger.info("Starting scheduled GitHub collection")
        start_time = datetime.utcnow()

        try:
            collector = GitHubCollector()
            result = await collector.run()

            if result["success"] and result["data"]:
                stats = await project_service.save_projects_from_collector(
                    result["data"],
                    ProjectSource.GITHUB
                )

                duration = (datetime.utcnow() - start_time).total_seconds()
                self.logger.info(
                    f"GitHub collection completed in {duration:.1f}s: "
                    f"{stats['new']} new, {stats['updated']} updated"
                )
            else:
                self.logger.warning(f"GitHub collection returned no data: {result.get('error')}")

        except Exception as e:
            self.logger.error(f"GitHub collection failed: {e}")

    async def run_defillama_collection(self):
        """Run DeFiLlama collection task"""
        self.logger.info("Starting scheduled DeFiLlama collection")
        start_time = datetime.utcnow()

        try:
            collector = DefiLlamaCollector()
            result = await collector.run()

            if result["success"] and result["data"]:
                stats = await project_service.save_projects_from_defillama(result["data"])

                duration = (datetime.utcnow() - start_time).total_seconds()
                self.logger.info(
                    f"DeFiLlama collection completed in {duration:.1f}s: "
                    f"{stats['new']} new, {stats['updated']} updated"
                )
            else:
                self.logger.warning(f"DeFiLlama collection returned no data: {result.get('error')}")

        except Exception as e:
            self.logger.error(f"DeFiLlama collection failed: {e}")

    async def generate_daily_summary(self):
        """Generate daily summary of new projects"""
        self.logger.info("Generating daily summary")

        try:
            stats = await project_service.get_stats()

            # Get top new projects from last 24 hours
            from app.database import async_session_maker
            from sqlalchemy import select
            from app.models import Project
            from datetime import timedelta

            yesterday = datetime.utcnow() - timedelta(days=1)

            async with async_session_maker() as session:
                result = await session.execute(
                    select(Project)
                    .where(Project.discovered_at >= yesterday)
                    .order_by(Project.score.desc())
                    .limit(10)
                )
                new_projects = result.scalars().all()

            self.logger.info(
                f"Daily summary: {stats['total']} total projects, "
                f"{len(new_projects)} new in last 24h"
            )

            # Log top projects
            for p in new_projects[:5]:
                self.logger.info(f"  - {p.name} (score: {p.score})")

        except Exception as e:
            self.logger.error(f"Daily summary failed: {e}")

    async def run_all_collections(self):
        """Run all collections manually"""
        self.logger.info("Running all collections manually")
        await self.run_github_collection()
        await self.run_defillama_collection()


# Singleton instance
scheduler = TaskScheduler()
