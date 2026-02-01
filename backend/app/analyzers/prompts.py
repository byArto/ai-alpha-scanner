from typing import Dict, Any, Optional
from datetime import datetime


class PromptGenerator:
    """Generate analysis prompts for AI"""

    @staticmethod
    def generate_project_analysis_prompt(project: Dict[str, Any]) -> str:
        """Generate prompt for full project analysis"""

        # Build context from available data
        context_parts = []

        # Basic info
        context_parts.append(f"Project Name: {project.get('name', 'Unknown')}")

        if project.get('description'):
            context_parts.append(f"Description: {project['description']}")

        # Source info
        context_parts.append(f"Source: {project.get('source', 'unknown')}")
        if project.get('source_url'):
            context_parts.append(f"Source URL: {project['source_url']}")

        # GitHub metrics
        if project.get('github_url'):
            context_parts.append(f"\n--- GitHub Data ---")
            context_parts.append(f"GitHub URL: {project['github_url']}")
            if project.get('github_org'):
                context_parts.append(f"Organization: {project['github_org']}")
            if project.get('github_stars') is not None:
                context_parts.append(f"Stars: {project['github_stars']}")
            if project.get('github_forks') is not None:
                context_parts.append(f"Forks: {project['github_forks']}")
            if project.get('github_commits_30d') is not None:
                context_parts.append(f"Commits (30d): {project['github_commits_30d']}")
            if project.get('github_contributors') is not None:
                context_parts.append(f"Contributors: {project['github_contributors']}")
            if project.get('github_language'):
                context_parts.append(f"Primary Language: {project['github_language']}")
            if project.get('github_created_at'):
                context_parts.append(f"Created: {project['github_created_at']}")

        # Social links
        social_links = []
        if project.get('twitter_url'):
            social_links.append(f"Twitter: {project['twitter_url']}")
        if project.get('discord_url'):
            social_links.append(f"Discord: {project['discord_url']}")
        if project.get('website_url'):
            social_links.append(f"Website: {project['website_url']}")

        if social_links:
            context_parts.append(f"\n--- Social Links ---")
            context_parts.extend(social_links)

        # Current analysis
        if project.get('category'):
            context_parts.append(f"\n--- Current Classification ---")
            context_parts.append(f"Category: {project['category']}")
        if project.get('score') is not None:
            context_parts.append(f"Initial Score: {project['score']}/10")

        # Early signals
        if project.get('early_signals'):
            context_parts.append(f"\n--- Detected Early Signals ---")
            context_parts.append(f"Signals: {', '.join(project['early_signals'])}")

        context = "\n".join(context_parts)

        prompt = f"""Analyze this early-stage crypto project and provide a structured assessment.

=== PROJECT DATA ===
{context}

=== ANALYSIS REQUIRED ===

Please provide your analysis in the following exact format:

**SUMMARY**
[2-3 sentences describing what this project does and its purpose]

**WHY EARLY**
[3-5 bullet points explaining why this appears to be an early-stage project worth watching]

**CATEGORY**
[One of: L1, L2, DeFi, Infrastructure, Tooling, Gaming, NFT, Social, AI, Other]

**SCORE**
[Number from 1-10, where 10 = highest potential for early alpha]

**CONFIDENCE**
[Number from 0.1-1.0, how confident you are in this assessment]

**RED FLAGS**
[List any concerns or red flags, or "None identified" if none]

**RECOMMENDATION**
[One of: WATCH, RESEARCH, SKIP] - [Brief reason]

Be objective and focus on factual signals. Consider:
- Development activity and team credibility
- Technical innovation or unique value proposition
- Stage of development (testnet, mainnet, etc.)
- Community and social presence
- Funding and backing signals
- Competition and market positioning
"""

        return prompt

    @staticmethod
    def generate_batch_analysis_prompt(projects: list[Dict[str, Any]]) -> str:
        """Generate prompt for analyzing multiple projects at once"""

        projects_text = []
        for i, p in enumerate(projects, 1):
            project_info = f"""
--- Project {i}: {p.get('name', 'Unknown')} ---
Description: {p.get('description', 'N/A')[:200]}
Source: {p.get('source', 'unknown')}
GitHub Stars: {p.get('github_stars', 'N/A')}
Commits (30d): {p.get('github_commits_30d', 'N/A')}
Category: {p.get('category', 'unknown')}
Initial Score: {p.get('score', 'N/A')}
"""
            projects_text.append(project_info)

        prompt = f"""Analyze these {len(projects)} early-stage crypto projects and rank them by potential.

=== PROJECTS ===
{"".join(projects_text)}

=== TASK ===

For each project, provide:
1. **Score** (1-10)
2. **One-line summary**
3. **Key signal** (most important indicator)

Then provide a **TOP 3 RANKING** with brief justification.

Format your response as:

## Individual Assessments
1. [Project Name]: Score X/10 - [summary] - Key signal: [signal]
2. ...

## Top 3 Ranking
1. [Project Name] - [why it's #1]
2. [Project Name] - [why it's #2]
3. [Project Name] - [why it's #3]
"""

        return prompt

    @staticmethod
    def generate_quick_filter_prompt(projects: list[Dict[str, Any]]) -> str:
        """Generate prompt for quick filtering of projects"""

        projects_list = "\n".join([
            f"{i}. {p.get('name', 'Unknown')} - {(p.get('description') or 'No description')[:100]}"
            for i, p in enumerate(projects, 1)
        ])

        prompt = f"""Quick filter: Which of these crypto projects are worth deeper research?

{projects_list}

Reply with just the numbers of projects worth researching, comma-separated.
Example: 1, 3, 7, 12

Criteria for inclusion:
- Shows real development activity
- Has unique value proposition
- Not a tutorial/demo/fork
- Shows early-stage signals (testnet, devnet, pre-launch)
"""

        return prompt
