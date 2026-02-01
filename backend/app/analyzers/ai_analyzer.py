from typing import Dict, Any, Optional, List
from datetime import datetime
import re
import json
from loguru import logger

from app.analyzers.prompts import PromptGenerator
from app.models import ProjectCategory, ProjectStatus


class AIAnalyzer:
    """AI-powered project analyzer"""

    def __init__(self):
        self.prompt_generator = PromptGenerator()
        self.logger = logger.bind(module="ai_analyzer")

    def generate_analysis_prompt(self, project: Dict[str, Any]) -> str:
        """Generate analysis prompt for a project"""
        return self.prompt_generator.generate_project_analysis_prompt(project)

    def generate_batch_prompt(self, projects: List[Dict[str, Any]]) -> str:
        """Generate batch analysis prompt"""
        return self.prompt_generator.generate_batch_analysis_prompt(projects)

    def parse_analysis_response(self, response_text: str) -> Dict[str, Any]:
        """Parse AI response into structured data"""
        result = {
            "summary": None,
            "why_early": None,
            "category": None,
            "score": None,
            "confidence": None,
            "red_flags": None,
            "recommendation": None,
            "raw_response": response_text
        }

        try:
            # Extract SUMMARY
            summary_match = re.search(
                r'\*\*SUMMARY\*\*\s*\n(.*?)(?=\n\*\*|\Z)',
                response_text,
                re.DOTALL | re.IGNORECASE
            )
            if summary_match:
                result["summary"] = summary_match.group(1).strip()

            # Extract WHY EARLY
            why_early_match = re.search(
                r'\*\*WHY EARLY\*\*\s*\n(.*?)(?=\n\*\*|\Z)',
                response_text,
                re.DOTALL | re.IGNORECASE
            )
            if why_early_match:
                result["why_early"] = why_early_match.group(1).strip()

            # Extract CATEGORY
            category_match = re.search(
                r'\*\*CATEGORY\*\*\s*\n\s*(\w+)',
                response_text,
                re.IGNORECASE
            )
            if category_match:
                cat_str = category_match.group(1).lower()
                result["category"] = self._map_category(cat_str)

            # Extract SCORE
            score_match = re.search(
                r'\*\*SCORE\*\*\s*\n\s*(\d+(?:\.\d+)?)',
                response_text,
                re.IGNORECASE
            )
            if score_match:
                result["score"] = min(10.0, max(0.0, float(score_match.group(1))))

            # Extract CONFIDENCE
            confidence_match = re.search(
                r'\*\*CONFIDENCE\*\*\s*\n\s*(0?\.\d+|1\.0?|1)',
                response_text,
                re.IGNORECASE
            )
            if confidence_match:
                result["confidence"] = min(1.0, max(0.0, float(confidence_match.group(1))))

            # Extract RED FLAGS
            red_flags_match = re.search(
                r'\*\*RED FLAGS\*\*\s*\n(.*?)(?=\n\*\*|\Z)',
                response_text,
                re.DOTALL | re.IGNORECASE
            )
            if red_flags_match:
                flags = red_flags_match.group(1).strip()
                if "none" not in flags.lower():
                    result["red_flags"] = flags

            # Extract RECOMMENDATION
            rec_match = re.search(
                r'\*\*RECOMMENDATION\*\*\s*\n\s*(WATCH|RESEARCH|SKIP)[:\s-]*(.*?)(?=\n|\Z)',
                response_text,
                re.IGNORECASE
            )
            if rec_match:
                result["recommendation"] = f"{rec_match.group(1).upper()}: {rec_match.group(2).strip()}"

        except Exception as e:
            self.logger.error(f"Error parsing analysis response: {e}")

        return result

    def _map_category(self, category_str: str) -> str:
        """Map category string to enum value"""
        mapping = {
            "l1": "l1",
            "l2": "l2",
            "layer1": "l1",
            "layer2": "l2",
            "defi": "defi",
            "infrastructure": "infrastructure",
            "infra": "infrastructure",
            "tooling": "tooling",
            "tools": "tooling",
            "gaming": "gaming",
            "game": "gaming",
            "nft": "nft",
            "social": "social",
            "ai": "ai",
            "other": "other"
        }
        return mapping.get(category_str.lower(), "other")

    def validate_analysis(self, analysis: Dict[str, Any]) -> bool:
        """Validate that analysis has required fields"""
        required = ["summary", "score"]
        return all(analysis.get(field) is not None for field in required)
