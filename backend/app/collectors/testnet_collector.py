import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime
from bs4 import BeautifulSoup
import asyncio
import re
import json

from app.collectors.base import BaseCollector
from app.config import settings


class GalxeCollector(BaseCollector):
    """Collector for Galxe campaigns and projects"""

    name = "galxe"
    source = "galxe"

    # Galxe GraphQL endpoint
    GRAPHQL_URL = "https://graphigo.prd.galaxy.eco/query"

    # Keywords that indicate early-stage projects
    EARLY_KEYWORDS = [
        "testnet", "devnet", "alpha", "beta", "early",
        "launch", "airdrop", "points", "quest", "campaign"
    ]

    async def collect(self) -> List[Dict[str, Any]]:
        """Collect campaigns from Galxe"""
        projects = []

        async with httpx.AsyncClient(timeout=30.0) as client:
            # Get trending/new campaigns
            campaigns = await self._fetch_campaigns(client)

            for campaign in campaigns[:30]:  # Limit to 30
                try:
                    processed = self._process_campaign(campaign)
                    if processed:
                        projects.append(processed)
                except Exception as e:
                    self.logger.error(f"Error processing campaign: {e}")

                await asyncio.sleep(0.5)  # Rate limiting

        return projects

    async def _fetch_campaigns(self, client: httpx.AsyncClient) -> List[Dict]:
        """Fetch campaigns from Galxe GraphQL API"""
        query = """
        query ExploreSpaces($input: ExploreSpacesInput!) {
            exploreSpaces(input: $input) {
                list {
                    id
                    name
                    alias
                    description
                    thumbnail
                    followersCount
                    categories
                    website
                    twitter
                    discord
                    isVerified
                    campaigns {
                        list {
                            id
                            name
                            description
                            status
                            participantCount
                            startTime
                            endTime
                        }
                    }
                }
            }
        }
        """

        variables = {
            "input": {
                "first": 50,
                "order": "Trending",
                "chains": [],
                "rewardTypes": [],
                "credSources": [],
                "searchString": ""
            }
        }

        try:
            response = await client.post(
                self.GRAPHQL_URL,
                json={"query": query, "variables": variables},
                headers={"Content-Type": "application/json"}
            )

            if response.status_code == 200:
                data = response.json()
                spaces = data.get("data", {}).get("exploreSpaces", {}).get("list", [])
                return spaces
            else:
                self.logger.warning(f"Galxe API returned {response.status_code}")
                return []

        except Exception as e:
            self.logger.error(f"Failed to fetch Galxe campaigns: {e}")
            return []

    def _process_campaign(self, space: Dict) -> Optional[Dict[str, Any]]:
        """Process Galxe space data"""
        name = space.get("name", "")
        description = space.get("description", "")

        # Check for early signals
        text = f"{name} {description}".lower()
        early_signals = [kw for kw in self.EARLY_KEYWORDS if kw in text]

        # Get active campaigns
        campaigns = space.get("campaigns", {}).get("list", [])
        active_campaigns = [c for c in campaigns if c.get("status") == "Active"]

        if not name:
            return None

        return {
            "name": name,
            "description": description[:500] if description else None,
            "source": "galxe",
            "source_url": f"https://galxe.com/{space.get('alias', '')}",
            "source_id": space.get("id"),

            # Social links
            "twitter_url": self._format_twitter(space.get("twitter")),
            "discord_url": space.get("discord"),
            "website_url": space.get("website"),

            # Metrics
            "followers_count": space.get("followersCount", 0),
            "active_campaigns": len(active_campaigns),
            "total_campaigns": len(campaigns),
            "is_verified": space.get("isVerified", False),
            "categories": space.get("categories", []),

            # Early signals
            "early_signals": early_signals,

            # Raw data
            "raw_data": {
                "campaigns": [
                    {
                        "name": c.get("name"),
                        "participants": c.get("participantCount"),
                        "status": c.get("status")
                    }
                    for c in active_campaigns[:5]
                ]
            }
        }

    def _format_twitter(self, twitter: Optional[str]) -> Optional[str]:
        """Format Twitter URL"""
        if not twitter:
            return None
        if twitter.startswith("http"):
            return twitter
        return f"https://twitter.com/{twitter}"


class Layer3Collector(BaseCollector):
    """Collector for Layer3 quests and projects"""

    name = "layer3"
    source = "layer3"

    BASE_URL = "https://layer3.xyz"
    API_URL = "https://layer3.xyz/api"

    async def collect(self) -> List[Dict[str, Any]]:
        """Collect projects from Layer3"""
        projects = []

        async with httpx.AsyncClient(timeout=30.0) as client:
            # Try to get quests from their public pages
            quests = await self._fetch_quests(client)

            for quest in quests[:30]:
                try:
                    processed = self._process_quest(quest)
                    if processed:
                        projects.append(processed)
                except Exception as e:
                    self.logger.error(f"Error processing Layer3 quest: {e}")

                await asyncio.sleep(0.5)

        return projects

    async def _fetch_quests(self, client: httpx.AsyncClient) -> List[Dict]:
        """Fetch quests from Layer3"""
        try:
            # Try the explore page
            response = await client.get(
                f"{self.BASE_URL}/explore",
                headers={
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
                }
            )

            if response.status_code == 200:
                # Parse HTML to find quest data
                soup = BeautifulSoup(response.text, "lxml")

                # Look for Next.js data script
                scripts = soup.find_all("script", {"id": "__NEXT_DATA__"})
                if scripts:
                    try:
                        data = json.loads(scripts[0].string)
                        # Extract quests from pageProps
                        page_props = data.get("props", {}).get("pageProps", {})
                        quests = page_props.get("quests", []) or page_props.get("projects", [])
                        if quests:
                            return quests
                    except json.JSONDecodeError:
                        pass

                # Fallback: parse visible quest cards
                return self._parse_quest_cards(soup)

            return []

        except Exception as e:
            self.logger.error(f"Failed to fetch Layer3 quests: {e}")
            return []

    def _parse_quest_cards(self, soup: BeautifulSoup) -> List[Dict]:
        """Parse quest cards from HTML"""
        quests = []

        # Find quest/project cards (adjust selectors as needed)
        cards = soup.find_all("a", href=re.compile(r"/quests/|/projects/"))

        for card in cards[:30]:
            try:
                href = card.get("href", "")
                name_elem = card.find(["h2", "h3", "span"])
                name = name_elem.get_text(strip=True) if name_elem else ""

                if name and len(name) > 2:
                    quests.append({
                        "name": name,
                        "href": href,
                        "source_url": f"{self.BASE_URL}{href}"
                    })
            except:
                continue

        return quests

    def _process_quest(self, quest: Dict) -> Optional[Dict[str, Any]]:
        """Process Layer3 quest data"""
        name = quest.get("name") or quest.get("title", "")

        if not name or len(name) < 3:
            return None

        return {
            "name": name,
            "description": quest.get("description", "")[:500] if quest.get("description") else None,
            "source": "layer3",
            "source_url": quest.get("source_url") or f"{self.BASE_URL}/quests",
            "source_id": quest.get("id"),

            # Social links (if available)
            "twitter_url": quest.get("twitter"),
            "discord_url": quest.get("discord"),
            "website_url": quest.get("website"),

            # Metrics
            "xp_reward": quest.get("xp"),
            "participants": quest.get("completions") or quest.get("participants"),

            # Categories
            "categories": quest.get("tags", []),

            # Early signals
            "early_signals": ["quest_platform", "layer3"]
        }


class ZealyCollector(BaseCollector):
    """Collector for Zealy (formerly Crew3) communities"""

    name = "zealy"
    source = "zealy"

    BASE_URL = "https://zealy.io"
    API_URL = "https://api.zealy.io/communities"

    async def collect(self) -> List[Dict[str, Any]]:
        """Collect communities from Zealy"""
        projects = []

        async with httpx.AsyncClient(timeout=30.0) as client:
            communities = await self._fetch_communities(client)

            for community in communities[:30]:
                try:
                    processed = self._process_community(community)
                    if processed:
                        projects.append(processed)
                except Exception as e:
                    self.logger.error(f"Error processing Zealy community: {e}")

                await asyncio.sleep(0.5)

        return projects

    async def _fetch_communities(self, client: httpx.AsyncClient) -> List[Dict]:
        """Fetch communities from Zealy"""
        try:
            # Try public API endpoint
            response = await client.get(
                f"{self.API_URL}",
                params={
                    "limit": 50,
                    "isPublic": True,
                    "sortBy": "trending"
                },
                headers={
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
                }
            )

            if response.status_code == 200:
                data = response.json()
                return data if isinstance(data, list) else data.get("communities", [])

            # Fallback: scrape explore page
            return await self._scrape_explore_page(client)

        except Exception as e:
            self.logger.error(f"Failed to fetch Zealy communities: {e}")
            return []

    async def _scrape_explore_page(self, client: httpx.AsyncClient) -> List[Dict]:
        """Scrape Zealy explore page"""
        try:
            response = await client.get(
                f"{self.BASE_URL}/explore",
                headers={
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
                }
            )

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "lxml")

                # Look for Next.js data
                scripts = soup.find_all("script", {"id": "__NEXT_DATA__"})
                if scripts:
                    try:
                        data = json.loads(scripts[0].string)
                        page_props = data.get("props", {}).get("pageProps", {})
                        return page_props.get("communities", [])
                    except:
                        pass

                # Parse visible community cards
                communities = []
                links = soup.find_all("a", href=re.compile(r"/c/[a-zA-Z0-9-]+"))

                for link in links[:30]:
                    name_elem = link.find(["h2", "h3", "span", "p"])
                    if name_elem:
                        name = name_elem.get_text(strip=True)
                        if name and len(name) > 2:
                            communities.append({
                                "name": name,
                                "subdomain": link.get("href", "").replace("/c/", "")
                            })

                return communities

            return []

        except Exception as e:
            self.logger.error(f"Failed to scrape Zealy: {e}")
            return []

    def _process_community(self, community: Dict) -> Optional[Dict[str, Any]]:
        """Process Zealy community data"""
        name = community.get("name", "")

        if not name or len(name) < 3:
            return None

        subdomain = community.get("subdomain", "")

        return {
            "name": name,
            "description": community.get("description", "")[:500] if community.get("description") else None,
            "source": "zealy",
            "source_url": f"{self.BASE_URL}/c/{subdomain}" if subdomain else self.BASE_URL,
            "source_id": community.get("id"),

            # Social links
            "twitter_url": community.get("twitter"),
            "discord_url": community.get("discord"),
            "website_url": community.get("website"),

            # Metrics
            "members_count": community.get("membersCount") or community.get("members"),
            "quests_count": community.get("questsCount"),

            # Categories
            "categories": community.get("tags", []),

            # Early signals
            "early_signals": ["quest_platform", "zealy"]
        }
