"""OpenAI-powered clinical insights with rule-based fallback."""

from __future__ import annotations

import json
import logging
from typing import Any

from app.core.config import settings
from app.services.digital_twin import DigitalTwinService

logger = logging.getLogger(__name__)

PREMIUM_SYSTEM = """Tu es un assistant clinique de prévention pour PEREN AI.
Réponds UNIQUEMENT en JSON valide, en français.
Structure attendue:
{
  "recommendations": [{"title": str, "priority": str, "priorityColor": str, "text": str, "scoreLabel": str, "scoreValue": number, "details": str}],
  "interventions": [{"title": str, "category": str, "description": str, "impact": str}],
  "action_plan": [{"week": str, "focus": str, "actions": [str]}]
}
Génère exactement 3 recommendations, 3 interventions et un action_plan sur 4 semaines.
Reste factuel, non alarmiste, et rappelle que ce n'est pas un avis médical."""

SCAN_SYSTEM = """Tu es un assistant clinique PEREN AI spécialisé en signaux vitaux non invasifs (rPPG).
Analyse les mesures fournies et réponds en JSON:
{
  "summary": "résumé clinique en 2-3 phrases",
  "risk_level": "low|moderate|high",
  "insights": ["point 1", "point 2", "point 3"],
  "recommendations": ["action 1", "action 2"]
}
Précise que les mesures rPPG sont indicatives et ne remplacent pas un examen médical."""

BIOMARKER_SYSTEM = """Tu es un assistant clinique PEREN AI spécialisé en analyses sanguines préventives.
Analyse les biomarqueurs et réponds en JSON:
{
  "summary": "résumé en 2-4 phrases",
  "overall_status": "optimal|suboptimal|attention_required",
  "biomarkers": [{"marker": str, "value": str, "ref": str, "status": str, "interpretation": str}],
  "recommendations": ["action 1", "action 2", "action 3"]
}
status doit être: optimal, borderline, suboptimal, moderate, elevated ou low.
Réponds en français."""


class AIService:
    @staticmethod
    def is_available() -> bool:
        return bool(settings.resolved_openai_api_key)

    @staticmethod
    def status() -> dict[str, Any]:
        return {
            "available": AIService.is_available(),
            "model": settings.openai_model if AIService.is_available() else None,
            "provider": "openai" if AIService.is_available() else "local_fallback",
        }

    @staticmethod
    def _client():
        from openai import OpenAI

        return OpenAI(api_key=settings.resolved_openai_api_key)

    @staticmethod
    def _chat_json(system: str, user: str) -> dict | None:
        if not AIService.is_available():
            return None
        try:
            response = AIService._client().chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                response_format={"type": "json_object"},
                temperature=0.35,
                max_tokens=2500,
            )
            content = response.choices[0].message.content
            if not content:
                return None
            return json.loads(content)
        except Exception:
            logger.exception("[AI] OpenAI request failed")
            return None

    @classmethod
    def generate_premium_insights(
        cls,
        onboarding_form: dict,
        metrics_record: Any,
        fallback: dict | None = None,
    ) -> dict:
        base = fallback or DigitalTwinService.generate_premium_features(
            onboarding_form, metrics_record
        )
        if not cls.is_available():
            return {**base, "source": "rule_based"}

        user_payload = {
            "onboarding": onboarding_form,
            "metrics": {
                "body_age": metrics_record.body_age,
                "work_load": metrics_record.work_load,
                "body_toxin": metrics_record.body_toxin,
                "body_age_state": metrics_record.body_age_state,
                "workload_state": metrics_record.workload_state,
                "body_toxins_state": metrics_record.body_toxins_state,
            },
            "rule_based_reference": base,
        }
        result = cls._chat_json(
            PREMIUM_SYSTEM,
            json.dumps(user_payload, ensure_ascii=False, default=str),
        )
        if not result:
            return {**base, "source": "rule_based"}

        merged = {
            "recommendations": result.get("recommendations") or base["recommendations"],
            "interventions": result.get("interventions") or base["interventions"],
            "action_plan": result.get("action_plan") or base["action_plan"],
            "source": "openai",
        }
        return merged

    @classmethod
    def analyze_face_scan(cls, vitals: dict, user_context: dict | None = None) -> dict:
        context = user_context or {}
        fallback = cls._fallback_scan_analysis(vitals, context)
        if not cls.is_available():
            return fallback

        payload = {"vitals": vitals, "user_context": context}
        result = cls._chat_json(
            SCAN_SYSTEM,
            json.dumps(payload, ensure_ascii=False, default=str),
        )
        if not result:
            return fallback

        return {
            "summary": result.get("summary") or fallback["summary"],
            "risk_level": result.get("risk_level") or fallback["risk_level"],
            "insights": result.get("insights") or fallback["insights"],
            "recommendations": result.get("recommendations") or fallback["recommendations"],
            "source": "openai",
        }

    @classmethod
    def analyze_biomarkers(
        cls,
        biomarkers: list[dict],
        user_context: dict | None = None,
    ) -> dict:
        context = user_context or {}
        fallback = cls._fallback_biomarker_analysis(biomarkers, context)
        if not cls.is_available():
            return fallback

        payload = {"biomarkers": biomarkers, "user_context": context}
        result = cls._chat_json(
            BIOMARKER_SYSTEM,
            json.dumps(payload, ensure_ascii=False, default=str),
        )
        if not result:
            return fallback

        enriched = result.get("biomarkers") or biomarkers
        return {
            "summary": result.get("summary") or fallback["summary"],
            "overall_status": result.get("overall_status") or fallback["overall_status"],
            "biomarkers": enriched,
            "recommendations": result.get("recommendations") or fallback["recommendations"],
            "source": "openai",
        }

    @staticmethod
    def _fallback_scan_analysis(vitals: dict, context: dict) -> dict:
        hr = float(vitals.get("heart_rate") or vitals.get("hr") or 72)
        sys_bp = float(vitals.get("blood_pressure_sys") or 118)
        stress = float(vitals.get("stress_index") or vitals.get("stress_idx") or 42)

        risk = "low"
        if sys_bp >= 140 or hr >= 100 or stress >= 70:
            risk = "high"
        elif sys_bp >= 130 or hr >= 90 or stress >= 55:
            risk = "moderate"

        return {
            "summary": (
                f"Signaux vitaux estimés : FC {hr:.0f} bpm, TA {sys_bp:.0f} mmHg. "
                "Interprétation basée sur des algorithmes locaux — consultez un professionnel pour confirmation."
            ),
            "risk_level": risk,
            "insights": [
                f"Fréquence cardiaque au repos : {hr:.0f} bpm",
                f"Tension systolique estimée : {sys_bp:.0f} mmHg",
                f"Indice de stress : {stress:.0f}/100",
            ],
            "recommendations": [
                "Répéter le scan dans des conditions calmes (éclairage stable, visage immobile).",
                "Consulter un médecin si des symptômes persistent malgré des mesures normales.",
            ],
            "source": "rule_based",
        }

    @staticmethod
    def _fallback_biomarker_analysis(biomarkers: list[dict], context: dict) -> dict:
        statuses = [b.get("status", "optimal") for b in biomarkers]
        if any(s in ("elevated", "high") for s in statuses):
            overall = "attention_required"
        elif any(s in ("borderline", "suboptimal", "moderate") for s in statuses):
            overall = "suboptimal"
        else:
            overall = "optimal"

        return {
            "summary": (
                "Analyse locale des biomarqueurs basée sur les plages de référence standard. "
                "Pour une interprétation personnalisée avancée, configurez OPENAI_API_KEY."
            ),
            "overall_status": overall,
            "biomarkers": biomarkers,
            "recommendations": [
                "Discuter des résultats avec votre médecin traitant.",
                "Réévaluer les marqueurs en déficit dans 3 à 6 mois.",
            ],
            "source": "rule_based",
        }
