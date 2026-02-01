from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Optional
from loguru import logger
import sys

from sqlalchemy import select

from app.config import settings
from app.database import init_db, async_session_maker
from app.collectors import GitHubCollector, GalxeCollector, Layer3Collector, ZealyCollector, DefiLlamaCollector
from app.services.project_service import project_service
from app.models import Project, ProjectSource, ProjectStatus, ProjectCategory
from app.analyzers import AIAnalyzer


# Configure logging
logger.remove()
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level=settings.log_level
)
logger.add(
    "logs/app.log",
    rotation="10 MB",
    retention="7 days",
    level=settings.log_level
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI Alpha Scanner...")
    await init_db()
    logger.info("Database initialized")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title=settings.app_name,
    description="Web platform for discovering early-stage crypto projects",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "status": "running",
        "version": "0.1.0"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# ============ Collection Endpoints ============

@app.post("/api/collect/github")
async def run_github_collection(save_to_db: bool = True):
    """Run GitHub collection and optionally save to database"""
    collector = GitHubCollector()
    result = await collector.run()

    if save_to_db and result["success"] and result["data"]:
        stats = await project_service.save_projects_from_collector(
            result["data"],
            ProjectSource.GITHUB
        )
        result["db_stats"] = stats

    # Don't return raw data in response (too large)
    result["data"] = f"{len(result.get('data', []))} projects"

    return result


@app.post("/api/collect/galxe")
async def run_galxe_collection(save_to_db: bool = True):
    """Run Galxe collection"""
    collector = GalxeCollector()
    result = await collector.run()

    if save_to_db and result["success"] and result["data"]:
        stats = await project_service.save_projects_from_testnet(
            result["data"],
            ProjectSource.GALXE
        )
        result["db_stats"] = stats

    result["data"] = f"{len(result.get('data', []))} projects"
    return result


@app.post("/api/collect/layer3")
async def run_layer3_collection(save_to_db: bool = True):
    """Run Layer3 collection"""
    collector = Layer3Collector()
    result = await collector.run()

    if save_to_db and result["success"] and result["data"]:
        stats = await project_service.save_projects_from_testnet(
            result["data"],
            ProjectSource.LAYER3
        )
        result["db_stats"] = stats

    result["data"] = f"{len(result.get('data', []))} projects"
    return result


@app.post("/api/collect/zealy")
async def run_zealy_collection(save_to_db: bool = True):
    """Run Zealy collection"""
    collector = ZealyCollector()
    result = await collector.run()

    if save_to_db and result["success"] and result["data"]:
        stats = await project_service.save_projects_from_testnet(
            result["data"],
            ProjectSource.ZEALY
        )
        result["db_stats"] = stats

    result["data"] = f"{len(result.get('data', []))} projects"
    return result


@app.post("/api/collect/defillama")
async def run_defillama_collection(save_to_db: bool = True):
    """Run DeFiLlama collection - free API, no auth required"""
    collector = DefiLlamaCollector()
    result = await collector.run()

    if save_to_db and result["success"] and result["data"]:
        stats = await project_service.save_projects_from_defillama(result["data"])
        result["db_stats"] = stats

    result["data"] = f"{len(result.get('data', []))} projects"
    return result


@app.post("/api/collect/all")
async def run_all_collections(save_to_db: bool = True):
    """Run all working collectors (GitHub + DeFiLlama)"""
    results = {}

    # GitHub
    collector = GitHubCollector()
    result = await collector.run()
    if save_to_db and result["success"] and result["data"]:
        stats = await project_service.save_projects_from_collector(
            result["data"], ProjectSource.GITHUB
        )
        result["db_stats"] = stats
    result["data"] = f"{len(result.get('data', []))} projects"
    results["github"] = result

    # DeFiLlama
    collector = DefiLlamaCollector()
    result = await collector.run()
    if save_to_db and result["success"] and result["data"]:
        stats = await project_service.save_projects_from_defillama(result["data"])
        result["db_stats"] = stats
    result["data"] = f"{len(result.get('data', []))} projects"
    results["defillama"] = result

    # Get updated stats
    results["total_stats"] = await project_service.get_stats()

    return results


# ============ Projects Endpoints ============

@app.get("/api/projects")
async def get_projects(
    status: Optional[str] = None,
    category: Optional[str] = None,
    source: Optional[str] = None,
    min_score: float = 0,
    limit: int = Query(default=50, le=100),
    offset: int = 0
):
    """Get list of projects with filters"""
    # Convert string params to enums
    status_enum = ProjectStatus(status) if status else None
    category_enum = ProjectCategory(category) if category else None
    source_enum = ProjectSource(source) if source else None

    projects = await project_service.get_projects(
        status=status_enum,
        category=category_enum,
        source=source_enum,
        min_score=min_score,
        limit=limit,
        offset=offset
    )

    return {
        "count": len(projects),
        "projects": [
            {
                "id": p.id,
                "name": p.name,
                "slug": p.slug,
                "description": p.description,
                "category": p.category.value if p.category else None,
                "source": p.source.value,
                "score": p.score,
                "confidence": p.confidence,
                "status": p.status.value,
                "github_url": p.github_url,
                "github_stars": p.github_stars,
                "github_commits_30d": p.github_commits_30d,
                "twitter_url": p.twitter_url,
                "website_url": p.website_url,
                "discovered_at": p.discovered_at.isoformat() if p.discovered_at else None,
                "why_early": p.why_early,
                "summary": p.summary
            }
            for p in projects
        ]
    }


@app.get("/api/projects/{slug}")
async def get_project(slug: str):
    """Get single project by slug"""
    project = await project_service.get_project_by_slug(slug)
    if not project:
        return {"error": "Project not found"}

    return {
        "id": project.id,
        "name": project.name,
        "slug": project.slug,
        "description": project.description,
        "category": project.category.value if project.category else None,
        "source": project.source.value,
        "score": project.score,
        "confidence": project.confidence,
        "status": project.status.value,
        "github_url": project.github_url,
        "github_org": project.github_org,
        "github_stars": project.github_stars,
        "github_forks": project.github_forks,
        "github_commits_30d": project.github_commits_30d,
        "github_contributors": project.github_contributors,
        "github_language": project.github_language,
        "github_created_at": project.github_created_at.isoformat() if project.github_created_at else None,
        "twitter_url": project.twitter_url,
        "twitter_handle": project.twitter_handle,
        "website_url": project.website_url,
        "discord_url": project.discord_url,
        "discovered_at": project.discovered_at.isoformat() if project.discovered_at else None,
        "analyzed_at": project.analyzed_at.isoformat() if project.analyzed_at else None,
        "why_early": project.why_early,
        "summary": project.summary,
        "red_flags": project.red_flags
    }


@app.get("/api/stats")
async def get_stats():
    """Get database statistics"""
    return await project_service.get_stats()


# ============ Analysis Endpoints ============

@app.get("/api/analysis/pending")
async def get_pending_analysis(limit: int = 10, min_score: float = 5.0):
    """Get projects that need AI analysis"""
    projects = await project_service.get_projects_for_analysis(
        limit=limit,
        min_score=min_score
    )

    return {
        "count": len(projects),
        "projects": [
            {
                "id": p.id,
                "name": p.name,
                "slug": p.slug,
                "description": p.description,
                "source": p.source.value,
                "score": p.score,
                "github_url": p.github_url,
                "github_stars": p.github_stars
            }
            for p in projects
        ]
    }


@app.get("/api/analysis/prompt/{project_id}")
async def generate_analysis_prompt(project_id: int):
    """Generate AI analysis prompt for a project"""
    async with async_session_maker() as session:
        result = await session.execute(
            select(Project).where(Project.id == project_id)
        )
        project = result.scalar_one_or_none()

        if not project:
            return {"error": "Project not found"}

        # Convert to dict for prompt generation
        project_data = {
            "name": project.name,
            "description": project.description,
            "source": project.source.value,
            "github_url": project.github_url,
            "github_org": project.github_org,
            "github_stars": project.github_stars,
            "github_forks": project.github_forks,
            "github_commits_30d": project.github_commits_30d,
            "github_contributors": project.github_contributors,
            "github_language": project.github_language,
            "github_created_at": project.github_created_at.isoformat() if project.github_created_at else None,
            "twitter_url": project.twitter_url,
            "discord_url": project.discord_url,
            "website_url": project.website_url,
            "category": project.category.value if project.category else None,
            "score": project.score
        }

        analyzer = AIAnalyzer()
        prompt = analyzer.generate_analysis_prompt(project_data)

        return {
            "project_id": project_id,
            "project_name": project.name,
            "prompt": prompt
        }


@app.post("/api/analysis/save/{project_id}")
async def save_analysis(project_id: int, response_text: str):
    """Parse AI response and save analysis result"""
    analyzer = AIAnalyzer()

    # Parse the response
    analysis = analyzer.parse_analysis_response(response_text)

    if not analyzer.validate_analysis(analysis):
        return {
            "success": False,
            "error": "Could not parse required fields from response",
            "parsed": analysis
        }

    # Save to database
    success = await project_service.save_analysis_result(project_id, analysis)

    return {
        "success": success,
        "project_id": project_id,
        "analysis": {
            "summary": analysis.get("summary"),
            "why_early": analysis.get("why_early"),
            "category": analysis.get("category"),
            "score": analysis.get("score"),
            "confidence": analysis.get("confidence"),
            "red_flags": analysis.get("red_flags"),
            "recommendation": analysis.get("recommendation")
        }
    }


@app.get("/api/analysis/batch-prompt")
async def generate_batch_prompt(limit: int = 5, min_score: float = 6.0):
    """Generate batch analysis prompt for multiple projects"""
    projects = await project_service.get_projects_for_analysis(
        limit=limit,
        min_score=min_score
    )

    if not projects:
        return {"error": "No projects found for analysis"}

    projects_data = [
        {
            "name": p.name,
            "description": p.description,
            "source": p.source.value,
            "github_stars": p.github_stars,
            "github_commits_30d": p.github_commits_30d,
            "category": p.category.value if p.category else None,
            "score": p.score
        }
        for p in projects
    ]

    analyzer = AIAnalyzer()
    prompt = analyzer.generate_batch_prompt(projects_data)

    return {
        "count": len(projects),
        "project_ids": [p.id for p in projects],
        "project_names": [p.name for p in projects],
        "prompt": prompt
    }
