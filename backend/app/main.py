from fastapi import FastAPI, Query, Body, HTTPException, Security, Depends
from fastapi.security import APIKeyHeader
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
from app.scheduler import scheduler


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
    # Startup
    logger.info("Starting AI Alpha Scanner...")
    await init_db()
    logger.info("Database initialized")

    # Start scheduler (only in production or if explicitly enabled)
    if settings.app_env == "production":
        scheduler.start()
        logger.info("Scheduler started (production mode)")
    else:
        logger.info("Scheduler not started (development mode) - use /api/scheduler/start to enable")

    yield

    # Shutdown
    scheduler.stop()
    logger.info("Shutting down...")


app = FastAPI(
    title=settings.app_name,
    description="Web platform for discovering early-stage crypto projects",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


# ============ Authentication ============

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_admin_key(api_key: str = Security(api_key_header)):
    """Verify admin API key for protected endpoints"""
    if not settings.admin_api_key:
        logger.warning("Admin API key not configured - allowing request (INSECURE)")
        return True

    if api_key != settings.admin_api_key:
        raise HTTPException(
            status_code=403,
            detail="Invalid or missing API key"
        )
    return True


# ============ Basic Endpoints ============

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
async def run_github_collection(save_to_db: bool = True, _auth: bool = Depends(verify_admin_key)):
    """Run GitHub collection (admin only)"""
    collector = GitHubCollector()
    result = await collector.run()

    if save_to_db and result["success"] and result["data"]:
        stats = await project_service.save_projects_from_collector(
            result["data"],
            ProjectSource.GITHUB
        )
        result["db_stats"] = stats

    result["data"] = f"{len(result.get('data', []))} projects"
    return result


@app.post("/api/collect/galxe")
async def run_galxe_collection(save_to_db: bool = True, _auth: bool = Depends(verify_admin_key)):
    """Run Galxe collection (admin only)"""
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
async def run_layer3_collection(save_to_db: bool = True, _auth: bool = Depends(verify_admin_key)):
    """Run Layer3 collection (admin only)"""
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
async def run_zealy_collection(save_to_db: bool = True, _auth: bool = Depends(verify_admin_key)):
    """Run Zealy collection (admin only)"""
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
async def run_defillama_collection(save_to_db: bool = True, _auth: bool = Depends(verify_admin_key)):
    """Run DeFiLlama collection (admin only)"""
    collector = DefiLlamaCollector()
    result = await collector.run()

    if save_to_db and result["success"] and result["data"]:
        stats = await project_service.save_projects_from_defillama(result["data"])
        result["db_stats"] = stats

    result["data"] = f"{len(result.get('data', []))} projects"
    return result


@app.post("/api/collect/all")
async def run_all_collections(save_to_db: bool = True, _auth: bool = Depends(verify_admin_key)):
    """Run all working collectors (admin only)"""
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

    results["total_stats"] = await project_service.get_stats()
    return results


# ============ Projects Endpoints ============

@app.get("/api/projects")
async def get_projects(
    status: Optional[str] = Query(None, pattern="^(new|analyzed|archived|rejected)$"),
    category: Optional[str] = Query(None, pattern="^(l1|l2|defi|infrastructure|tooling|gaming|nft|social|ai|other)$"),
    source: Optional[str] = Query(None, pattern="^(github|twitter|galxe|layer3|zealy|manual)$"),
    min_score: float = Query(0, ge=0, le=10),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(0, ge=0, le=10000)
):
    """Get list of projects with filters"""
    try:
        status_enum = ProjectStatus(status) if status else None
        category_enum = ProjectCategory(category) if category else None
        source_enum = ProjectSource(source) if source else None
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid filter value: {e}")

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
    """Get projects pending AI analysis"""
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

    analyzer = AIAnalyzer()

    project_data = {
        "name": project.name,
        "description": project.description,
        "source": project.source.value,
        "source_url": project.source_url,
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

    prompt = analyzer.generate_analysis_prompt(project_data)

    return {
        "project_id": project.id,
        "project_name": project.name,
        "prompt": prompt,
        "instructions": "Copy this prompt to Claude UI, get the response, then POST to /api/analysis/save/{project_id}"
    }


@app.post("/api/analysis/save/{project_id}")
async def save_analysis(project_id: int, response_text: str = Body(..., embed=True, max_length=50000), _auth: bool = Depends(verify_admin_key)):
    """Parse and save AI analysis response (admin only)"""
    analyzer = AIAnalyzer()

    analysis = analyzer.parse_analysis_response(response_text)

    if not analyzer.validate_analysis(analysis):
        return {
            "error": "Could not parse analysis. Make sure response follows the expected format.",
            "parsed": analysis
        }

    success = await project_service.save_analysis_result(project_id, analysis)

    if success:
        return {
            "success": True,
            "project_id": project_id,
            "analysis": {
                "summary": analysis.get("summary"),
                "score": analysis.get("score"),
                "confidence": analysis.get("confidence"),
                "category": analysis.get("category"),
                "recommendation": analysis.get("recommendation")
            }
        }
    else:
        return {"error": "Failed to save analysis"}


@app.get("/api/analysis/batch-prompt")
async def generate_batch_prompt(limit: int = 5, min_score: float = 6.0):
    """Generate batch analysis prompt for multiple projects"""
    projects = await project_service.get_projects_for_analysis(
        limit=limit,
        min_score=min_score
    )

    if not projects:
        return {"error": "No projects pending analysis"}

    analyzer = AIAnalyzer()

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

    prompt = analyzer.generate_batch_prompt(projects_data)

    return {
        "project_count": len(projects),
        "project_ids": [p.id for p in projects],
        "project_names": [p.name for p in projects],
        "prompt": prompt
    }


# ============ Scheduler Endpoints ============

@app.get("/api/scheduler/status")
async def get_scheduler_status():
    """Get scheduler status and jobs"""
    return {
        "running": scheduler._is_running,
        "jobs": scheduler.get_jobs_status()
    }


@app.post("/api/scheduler/start")
async def start_scheduler(_auth: bool = Depends(verify_admin_key)):
    """Start the scheduler (admin only)"""
    if scheduler._is_running:
        return {"message": "Scheduler already running", "jobs": scheduler.get_jobs_status()}

    scheduler.start()
    return {"message": "Scheduler started", "jobs": scheduler.get_jobs_status()}


@app.post("/api/scheduler/stop")
async def stop_scheduler(_auth: bool = Depends(verify_admin_key)):
    """Stop the scheduler (admin only)"""
    if not scheduler._is_running:
        return {"message": "Scheduler not running"}

    scheduler.stop()
    return {"message": "Scheduler stopped"}


@app.post("/api/scheduler/run-now")
async def run_collections_now(_auth: bool = Depends(verify_admin_key)):
    """Manually trigger all collections (admin only)"""
    await scheduler.run_all_collections()
    stats = await project_service.get_stats()
    return {"message": "Collections completed", "stats": stats}
