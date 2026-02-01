import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import asyncio

from app.collectors.base import BaseCollector


class DefiLlamaCollector(BaseCollector):
    """Collector for DeFi projects from DeFiLlama API (free, no auth)"""

    name = "defillama"
    source = "defillama"

    BASE_URL = "https://api.llama.fi"

    # Chains that often have new/early projects
    EARLY_CHAINS = [
        "Arbitrum", "Optimism", "Base", "zkSync Era", "Linea",
        "Scroll", "Blast", "Manta", "Mode", "Mantle",
        "Sui", "Aptos", "Sei", "Injective", "Celestia",
        "Starknet", "Polygon zkEVM", "Taiko", "Zora"
    ]

    async def collect(self) -> List[Dict[str, Any]]:
        """Collect new/small DeFi protocols from DeFiLlama"""
        projects = []

        async with httpx.AsyncClient(timeout=30.0) as client:
            # Get all protocols
            protocols = await self._fetch_protocols(client)

            # Filter for early-stage projects
            early_projects = self._filter_early_stage(protocols)

            self.logger.info(f"Found {len(early_projects)} early-stage projects from {len(protocols)} total")

            # Enrich with additional data
            for protocol in early_projects[:50]:  # Limit to 50
                try:
                    enriched = await self._enrich_protocol(client, protocol)
                    if enriched:
                        projects.append(enriched)
                    await asyncio.sleep(0.3)
                except Exception as e:
                    self.logger.error(f"Error enriching {protocol.get('name')}: {e}")

        return projects

    async def _fetch_protocols(self, client: httpx.AsyncClient) -> List[Dict]:
        """Fetch all protocols from DeFiLlama"""
        try:
            response = await client.get(f"{self.BASE_URL}/protocols")

            if response.status_code == 200:
                return response.json()

            self.logger.error(f"DeFiLlama API returned {response.status_code}")
            return []

        except Exception as e:
            self.logger.error(f"Failed to fetch protocols: {e}")
            return []

    def _filter_early_stage(self, protocols: List[Dict]) -> List[Dict]:
        """Filter for early-stage projects"""
        early = []

        for p in protocols:
            # Skip if no TVL data
            tvl = p.get("tvl") or 0

            # Early stage criteria:
            # 1. Low TVL (under $10M) but not zero
            # 2. OR on new/emerging chains
            # 3. OR recently launched

            is_low_tvl = 1000 < tvl < 10_000_000  # $1K - $10M
            is_new_chain = any(chain in self.EARLY_CHAINS for chain in (p.get("chains") or []))

            # Check if recently listed (if we have the data)
            listed_at = p.get("listedAt")
            is_recent = False
            if listed_at:
                try:
                    listed_date = datetime.fromtimestamp(listed_at)
                    is_recent = (datetime.utcnow() - listed_date).days < 180  # Last 6 months
                except:
                    pass

            # Include if matches criteria
            if (is_low_tvl and is_new_chain) or (is_recent and tvl > 0):
                early.append(p)

        # Sort by TVL (ascending) to prioritize smaller/newer projects
        early.sort(key=lambda x: x.get("tvl") or 0)

        return early

    async def _enrich_protocol(self, client: httpx.AsyncClient, protocol: Dict) -> Optional[Dict[str, Any]]:
        """Enrich protocol with additional data"""
        name = protocol.get("name", "")
        slug = protocol.get("slug", "")

        if not name:
            return None

        # Get detailed data
        details = {}
        try:
            response = await client.get(f"{self.BASE_URL}/protocol/{slug}")
            if response.status_code == 200:
                details = response.json()
        except:
            pass

        # Extract social links
        twitter = protocol.get("twitter") or details.get("twitter")

        # Detect early signals
        early_signals = self._detect_early_signals(protocol, details)

        return {
            "name": name,
            "slug": slug,
            "description": protocol.get("description") or details.get("description"),
            "source": "defillama",
            "source_url": f"https://defillama.com/protocol/{slug}",

            # Links
            "website_url": protocol.get("url"),
            "twitter_url": f"https://twitter.com/{twitter}" if twitter else None,
            "github_url": self._extract_github(protocol, details),

            # Metrics
            "tvl": protocol.get("tvl"),
            "tvl_change_1d": protocol.get("change_1d"),
            "tvl_change_7d": protocol.get("change_7d"),
            "chains": protocol.get("chains", []),
            "category": protocol.get("category"),

            # Early signals
            "early_signals": early_signals,

            # Raw data
            "raw_data": {
                "mcap": protocol.get("mcap"),
                "fdv": protocol.get("fdv"),
                "listed_at": protocol.get("listedAt"),
                "audits": details.get("audits"),
                "raises": details.get("raises", [])
            }
        }

    def _extract_github(self, protocol: Dict, details: Dict) -> Optional[str]:
        """Extract GitHub URL"""
        github = protocol.get("github") or details.get("github")
        if github:
            if isinstance(github, list) and github:
                return f"https://github.com/{github[0]}"
            elif isinstance(github, str):
                return f"https://github.com/{github}"
        return None

    def _detect_early_signals(self, protocol: Dict, details: Dict) -> List[str]:
        """Detect early-stage signals"""
        signals = []

        tvl = protocol.get("tvl") or 0

        # TVL-based signals
        if tvl < 100_000:
            signals.append("very_low_tvl")
        elif tvl < 1_000_000:
            signals.append("low_tvl")

        # Chain signals
        chains = protocol.get("chains") or []
        new_chains = [c for c in chains if c in self.EARLY_CHAINS]
        if new_chains:
            signals.append(f"new_chains:{','.join(new_chains[:3])}")

        # Recent listing
        listed_at = protocol.get("listedAt")
        if listed_at:
            try:
                listed_date = datetime.fromtimestamp(listed_at)
                days_old = (datetime.utcnow() - listed_date).days
                if days_old < 30:
                    signals.append(f"very_new:{days_old}d")
                elif days_old < 90:
                    signals.append(f"new:{days_old}d")
            except:
                pass

        # Fundraising signals
        raises = details.get("raises", [])
        if raises:
            signals.append(f"raised:{len(raises)}_rounds")
            # Check for recent raises
            for r in raises:
                if r.get("date"):
                    try:
                        raise_date = datetime.fromisoformat(r["date"].replace("Z", "+00:00"))
                        if (datetime.utcnow() - raise_date.replace(tzinfo=None)).days < 180:
                            signals.append("recent_funding")
                            break
                    except:
                        pass

        return signals
