import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import asyncio
import re

from app.collectors.base import BaseCollector
from app.config import settings


class GitHubCollector(BaseCollector):
    """Collector for GitHub repositories related to crypto/web3 projects"""

    name = "github_crypto"
    source = "github"

    # Search queries for finding crypto projects
    SEARCH_QUERIES = [
        "blockchain created:>{date} stars:>5",
        "web3 created:>{date} stars:>5",
        "ethereum created:>{date} stars:>3",
        "solana created:>{date} stars:>3",
        "defi protocol created:>{date}",
        "layer2 scaling created:>{date}",
        "zk rollup created:>{date}",
        "smart contracts created:>{date} stars:>5",
        "crypto wallet created:>{date}",
        "dex swap created:>{date}",
        "nft marketplace created:>{date}",
        "dao governance created:>{date}",
        "bridge cross-chain created:>{date}",
        "cosmos sdk created:>{date}",
        "substrate polkadot created:>{date}",
        "move language aptos sui created:>{date}",
        "cairo starknet created:>{date}",
    ]

    # Keywords that indicate early-stage project
    EARLY_STAGE_KEYWORDS = [
        "testnet", "devnet", "alpha", "beta", "mvp", "poc",
        "proof of concept", "coming soon", "wip", "work in progress",
        "prototype", "experimental", "early", "pre-launch", "launch soon"
    ]

    # Keywords to filter out (likely not real projects)
    EXCLUDE_KEYWORDS = [
        "tutorial", "course", "learning", "example", "demo",
        "homework", "assignment", "bootcamp", "lesson", "exercise",
        "test", "sample", "template", "boilerplate", "starter"
    ]

    def __init__(self):
        super().__init__()
        self.base_url = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "AI-Alpha-Scanner/0.1"
        }
        if settings.github_token:
            self.headers["Authorization"] = f"token {settings.github_token}"
        else:
            self.logger.warning("No GitHub token provided. Rate limits will be restricted.")

    async def collect(self) -> List[Dict[str, Any]]:
        """Collect repositories from GitHub"""
        all_repos = []

        # Search for repos created in the last 30 days
        date_threshold = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")

        async with httpx.AsyncClient(headers=self.headers, timeout=30.0) as client:
            for query_template in self.SEARCH_QUERIES:
                query = query_template.format(date=date_threshold)

                try:
                    repos = await self._search_repositories(client, query)
                    all_repos.extend(repos)

                    # Respect rate limits
                    await asyncio.sleep(2)

                except Exception as e:
                    self.logger.error(f"Error searching '{query}': {e}")
                    continue

        # Remove duplicates by repo full_name
        seen = set()
        unique_repos = []
        for repo in all_repos:
            if repo["full_name"] not in seen:
                seen.add(repo["full_name"])
                unique_repos.append(repo)

        self.logger.info(f"Found {len(unique_repos)} unique repositories")

        # Process and enrich repositories
        processed = []
        async with httpx.AsyncClient(headers=self.headers, timeout=30.0) as client:
            for repo in unique_repos[:50]:  # Limit to 50 repos per run
                try:
                    processed_repo = await self._process_repository(client, repo)
                    if processed_repo and self._passes_filter(processed_repo):
                        processed.append(processed_repo)
                    await asyncio.sleep(1)  # Rate limiting
                except Exception as e:
                    self.logger.error(f"Error processing {repo['full_name']}: {e}")

        return processed

    async def _search_repositories(
        self,
        client: httpx.AsyncClient,
        query: str,
        per_page: int = 30
    ) -> List[Dict[str, Any]]:
        """Search GitHub repositories"""
        url = f"{self.base_url}/search/repositories"
        params = {
            "q": query,
            "sort": "updated",
            "order": "desc",
            "per_page": per_page
        }

        response = await client.get(url, params=params)
        response.raise_for_status()

        data = response.json()
        return data.get("items", [])

    async def _process_repository(
        self,
        client: httpx.AsyncClient,
        repo: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Process and enrich repository data"""

        # Get additional details
        commits_count = await self._get_commits_count(client, repo["full_name"])
        contributors_count = await self._get_contributors_count(client, repo["full_name"])

        # Extract social links from README and description
        social_links = await self._extract_social_links(client, repo)

        # Calculate early stage signals
        early_signals = self._detect_early_signals(repo)

        return {
            "name": repo["name"],
            "full_name": repo["full_name"],
            "description": repo.get("description", ""),
            "github_url": repo["html_url"],
            "github_org": repo["owner"]["login"],
            "github_stars": repo.get("stargazers_count", 0),
            "github_forks": repo.get("forks_count", 0),
            "github_commits_30d": commits_count,
            "github_contributors": contributors_count,
            "github_created_at": repo.get("created_at"),
            "github_language": repo.get("language"),
            "github_topics": repo.get("topics", []),
            "homepage": repo.get("homepage"),
            "twitter_url": social_links.get("twitter"),
            "discord_url": social_links.get("discord"),
            "website_url": social_links.get("website") or repo.get("homepage"),
            "early_signals": early_signals,
            "raw_data": {
                "open_issues": repo.get("open_issues_count", 0),
                "watchers": repo.get("watchers_count", 0),
                "default_branch": repo.get("default_branch"),
                "license": repo.get("license", {}).get("key") if repo.get("license") else None
            }
        }

    async def _get_commits_count(
        self,
        client: httpx.AsyncClient,
        full_name: str
    ) -> int:
        """Get commit count for last 30 days"""
        try:
            since = (datetime.utcnow() - timedelta(days=30)).isoformat()
            url = f"{self.base_url}/repos/{full_name}/commits"
            params = {"since": since, "per_page": 100}

            response = await client.get(url, params=params)
            if response.status_code == 200:
                return len(response.json())
            return 0
        except:
            return 0

    async def _get_contributors_count(
        self,
        client: httpx.AsyncClient,
        full_name: str
    ) -> int:
        """Get contributors count"""
        try:
            url = f"{self.base_url}/repos/{full_name}/contributors"
            params = {"per_page": 1, "anon": "true"}

            response = await client.get(url, params=params)
            if response.status_code == 200:
                # Check Link header for total count
                link_header = response.headers.get("Link", "")
                if 'rel="last"' in link_header:
                    # Parse last page number
                    match = re.search(r'page=(\d+)>; rel="last"', link_header)
                    if match:
                        return int(match.group(1))
                return len(response.json())
            return 0
        except:
            return 0

    async def _extract_social_links(
        self,
        client: httpx.AsyncClient,
        repo: Dict[str, Any]
    ) -> Dict[str, Optional[str]]:
        """Extract social links from README"""
        links = {
            "twitter": None,
            "discord": None,
            "website": None
        }

        try:
            url = f"{self.base_url}/repos/{repo['full_name']}/readme"
            response = await client.get(url)

            if response.status_code == 200:
                import base64
                content = response.json().get("content", "")
                readme_text = base64.b64decode(content).decode("utf-8", errors="ignore")

                # Extract Twitter
                twitter_match = re.search(
                    r'(?:twitter\.com|x\.com)/([a-zA-Z0-9_]+)',
                    readme_text
                )
                if twitter_match:
                    links["twitter"] = f"https://twitter.com/{twitter_match.group(1)}"

                # Extract Discord
                discord_match = re.search(
                    r'discord\.(?:gg|com/invite)/([a-zA-Z0-9]+)',
                    readme_text
                )
                if discord_match:
                    links["discord"] = f"https://discord.gg/{discord_match.group(1)}"

                # Extract website (from description or homepage)
                if repo.get("homepage"):
                    links["website"] = repo["homepage"]

        except Exception as e:
            self.logger.debug(f"Could not extract social links: {e}")

        return links

    def _detect_early_signals(self, repo: Dict[str, Any]) -> List[str]:
        """Detect signals that indicate early-stage project"""
        signals = []

        description = (repo.get("description") or "").lower()
        topics = [t.lower() for t in repo.get("topics", [])]

        # Check for early stage keywords
        for keyword in self.EARLY_STAGE_KEYWORDS:
            if keyword in description or keyword in topics:
                signals.append(f"keyword:{keyword}")

        # Low stars but recent activity = early stage
        if repo.get("stargazers_count", 0) < 100:
            signals.append("low_stars")

        # Recently created
        created_at = repo.get("created_at")
        if created_at:
            created_date = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            days_old = (datetime.now(created_date.tzinfo) - created_date).days
            if days_old < 90:
                signals.append(f"new_repo:{days_old}d")

        return signals

    def _passes_filter(self, repo: Dict[str, Any]) -> bool:
        """Check if repository passes basic filters"""
        description = (repo.get("description") or "").lower()
        name = repo.get("name", "").lower()

        # Exclude tutorials, examples, etc.
        for keyword in self.EXCLUDE_KEYWORDS:
            if keyword in description or keyword in name:
                return False

        # Must have some activity
        if repo.get("github_commits_30d", 0) == 0:
            return False

        # Must have description
        if not repo.get("description"):
            return False

        return True
