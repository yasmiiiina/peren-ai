import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel

class DigitalTwinMetrics(BaseModel):
    body_age: float
    body_age_change: float
    body_age_state: str
    work_load: float
    work_load_change: float
    workload_state: str
    body_toxin: float
    body_toxin_change: float
    body_toxins_state: str
    timestamp: datetime

class DigitalTwinService:
    @staticmethod
    def bin_sleep(x: float) -> str:
        if x is None: return "7–8h"
        if x >= 8: return ">8h"
        elif x >= 7: return "7–8h"
        elif x >= 6: return "6–7h"
        else: return "<6h"

    @staticmethod
    def bin_stress(x: float) -> str:
        if x is None: return "low"
        if x >= 7: return "high"
        elif x >= 4: return "moderate"
        else: return "low"

    @staticmethod
    def bin_activity(x: float) -> str:
        if x is None: return "2"
        if x >= 5: return "≥5"
        elif x >= 4: return "4"
        elif x >= 3: return "3"
        elif x >= 2: return "2"
        else: return "0–1"

    @staticmethod
    def bmi_score(bmi: float) -> int:
        if bmi < 18.5: return 1
        elif 18.5 <= bmi < 25: return 0
        elif 25 <= bmi < 30: return 1
        else: return 3

    @classmethod
    def calculate_metrics(cls, current_data: Dict, history: List[Dict] = None) -> DigitalTwinMetrics:
        """
        Refactored AI logic from Pipeline_digital_Twin_v1.py
        """
        # 1. Mapping & Normalization
        sex = str(current_data.get("sex", "F")).upper()
        sex = "female" if sex in ["F", "FEMALE"] else "male"
        
        age = float(current_data.get("age", 30))
        weight = float(current_data.get("weight_kg", 70))
        height = float(current_data.get("height_cm", 170))
        bmi = weight / ((height / 100) ** 2)
        
        # Lifestyle (with defaults if missing)
        activity_freq_raw = current_data.get("activity_freq", 2)
        activity_freq = cls.bin_activity(activity_freq_raw)
        
        sleep_duration_raw = current_data.get("sleep_duration", 7)
        sleep_duration = cls.bin_sleep(sleep_duration_raw)
        
        stress_level_raw = current_data.get("stress_level", 3)
        stress_level = cls.bin_stress(stress_level_raw)
        
        nutrition_raw = current_data.get("nutrition_raw", "Équilibrée")
        nutrition_map = {"Maison": "equilibrated", "Mix maison": "mixed", "Mix": "mixed", 
                         "Équilibrée": "equilibrated", "Standard": "mixed"}
        nutrition_norm = nutrition_map.get(nutrition_raw, "mixed")
        
        alcohol_raw = current_data.get("alcohol_raw", "Jamais")
        
        # 2. Body Age Calculation
        activity_score_map = {"0–1": 3, "2": 1, "3": 1, "4": 0, "≥5": -2}
        sleep_score_map = {"<6h": 1, "6–7h": 0, "7–8h": 0, ">8h": -1}
        stress_score_map = {"high": 2, "moderate": 1, "low": 0}
        nutrition_score_map = {"poor": 2, "mixed": 0, "equilibrated": -1}
        
        body_age = age + (
            activity_score_map.get(activity_freq, 0) +
            cls.bmi_score(bmi) +
            sleep_score_map.get(sleep_duration, 0) +
            stress_score_map.get(stress_level, 0) +
            nutrition_score_map.get(nutrition_norm, 0)
        )
        
        # 3. Work Load Calculation
        activity_freq_map_workload = {"0–1": 0, "2": 10, "3": 10, "4": 20, "≥5": 20}
        stress_map_workload = {"low": 0, "moderate": -10, "high": -20}
        sleep_debt_score = 20 if sleep_duration == "<6h" else 0
        
        work_load = 0 + activity_freq_map_workload.get(activity_freq, 0) - \
                    stress_map_workload.get(stress_level, 0) - sleep_debt_score
        
        # 4. Body Toxins Calculation
        nutrition_toxin = 2 if nutrition_norm == "ultra_processed" else 0
        alcohol_toxin = 2 if alcohol_raw in ["Régulier", "1–3/sem", ">3/sem"] else 0
        sport_detox = -2 if activity_freq in ["3", "4", "≥5"] else 0
        
        body_toxin = nutrition_toxin + alcohol_toxin - (0 + sport_detox)
        
        # 5. State Determination
        delta_body_age = body_age - age
        if delta_body_age <= -2: body_age_state = "younger_than_chrono"
        elif -1 <= delta_body_age <= 1: body_age_state = "aligned_with_chrono"
        else: body_age_state = "accelerated_aging"
        
        if work_load <= 0: workload_state = "low_load"
        elif work_load <= 30: workload_state = "moderate_load"
        else: workload_state = "high_load"
        
        if body_toxin <= 0: body_toxins_state = "low_toxic_load"
        elif body_toxin <= 2: body_toxins_state = "moderate_toxic_load"
        else: body_toxins_state = "high_toxic_load"
        
        # 6. Change Calculation (History)
        body_age_change = 0
        work_load_change = 0
        body_toxin_change = 0
        
        if history and len(history) > 0:
            last = history[-1]
            body_age_change = body_age - last.get("body_age", body_age)
            work_load_change = work_load - last.get("work_load", work_load)
            body_toxin_change = body_toxin - last.get("body_toxin", body_toxin)
            
        return DigitalTwinMetrics(
            body_age=body_age,
            body_age_change=body_age_change,
            body_age_state=body_age_state,
            work_load=work_load,
            work_load_change=work_load_change,
            workload_state=workload_state,
            body_toxin=body_toxin,
            body_toxin_change=body_toxin_change,
            body_toxins_state=body_toxins_state,
            timestamp=datetime.utcnow()
        )

    @staticmethod
    def map_onboarding_to_pipeline(onboarding_data: dict) -> dict:
        """
        Maps the frontend survey response (OnboardingData model) to the AI pipeline input.
        """
        # Calculate age from birthDate
        birth_date_str = onboarding_data.get("birthDate")
        age = 30
        if birth_date_str:
            try:
                birth_date = datetime.strptime(birth_date_str, "%Y-%m-%d")
                age = (datetime.now() - birth_date).days // 365
            except:
                pass
                
        # Dynamically infer AI metrics from existing onboarding fields
        intentions = onboarding_data.get("intentions", [])
        dependents = onboarding_data.get("dependentsCount", "0")
        meds = onboarding_data.get("takesPrescriptionMedication", "non")
        hosp = onboarding_data.get("hospitalizedInLastFiveYears", "non")
        
        # Calculate a medical/lifestyle penalty
        medical_penalty = 0
        if meds == "oui": medical_penalty += 1
        if hosp == "oui": medical_penalty += 2
        
        # Infer stress from dependents and medical history
        stress_level = 3
        if dependents in ["2", "3"]: stress_level = 6
        elif dependents == "4+": stress_level = 8
        stress_level += medical_penalty
        
        # Infer activity from intentions
        activity_freq = 2
        if "Améliorer mes performances sportives" in intentions: activity_freq = 5
        elif "Perdre du poids" in intentions: activity_freq = 1
        
        # Infer sleep
        sleep_duration = 7
        if "Mieux gérer mon stress et mon sommeil" in intentions: sleep_duration = 5
        
        # Infer nutrition & alcohol
        nutrition_raw = "Équilibrée"
        alcohol_raw = "Jamais"
        if medical_penalty >= 2:
            nutrition_raw = "Standard"
            alcohol_raw = "Régulier"
        elif "Perdre du poids" in intentions:
            nutrition_raw = "Mix"
            
        return {
            "sex": onboarding_data.get("sexAssignedAtBirth", "F"),
            "age": age,
            "weight_kg": onboarding_data.get("weightKg", 70),
            "height_cm": onboarding_data.get("heightCm", 170),
            "activity_freq": activity_freq,
            "sleep_duration": sleep_duration,
            "stress_level": stress_level,
            "nutrition_raw": nutrition_raw,
            "alcohol_raw": alcohol_raw,
        }

    @classmethod
    def generate_premium_features(cls, onboarding_form: dict, metrics_record: any) -> dict:
        """
        Generates scalable, dynamic clinical recommendations, interventions, and action plans
        based on the user's specific answers in their onboarding assessment.
        """
        # Calculate derived metrics
        weight = float(onboarding_form.get("weightKg", 70))
        height = float(onboarding_form.get("heightCm", 170))
        bmi = weight / ((height / 100) ** 2) if height > 0 else 22.0
        
        intentions = onboarding_form.get("intentions", [])
        primary_intention = intentions[0] if intentions else "Optimiser ma longévité et ma santé globale"
        
        meds = onboarding_form.get("takesPrescriptionMedication", "non")
        conditions = onboarding_form.get("currentConditions", "")
        
        # Chronological Age
        birth_date_str = onboarding_form.get("birthDate")
        chrono_age = 30
        if birth_date_str:
            try:
                birth_date = datetime.strptime(birth_date_str, "%Y-%m-%d")
                chrono_age = (datetime.now() - birth_date).days // 365
            except:
                pass
                
        # Percentages for scores
        body_age_pct = min(max((metrics_record.body_age / chrono_age) * 100, 0), 100) if chrono_age > 0 else 100
        workload_pct = min(max((metrics_record.work_load / 50) * 100, 0), 100)
        toxins_pct = min(max((metrics_record.body_toxin / 6) * 100, 0), 100)
        
        recommendations = []
        interventions = []
        action_plan = []
        
        # 1. GENERATE 3 RECOMMENDATIONS (Clinical Board Recommendations)
        # Recommendation 1: Toxins / Stress / Inflammation (Based on Body Toxins or Meds)
        if metrics_record.body_toxin >= 3 or meds == "oui" or "fatigue" in conditions.lower():
            recommendations.append({
                "title": "Gestion du Stress Oxydatif & Détoxification",
                "priority": "Impact Majeur",
                "priorityColor": "bg-red-500/20 text-red-400",
                "text": f"Au vu de votre indice de Toxines Corporelles ({metrics_record.body_toxin}/6), nous recommandons des précurseurs de glutathion.",
                "scoreLabel": f"{int(toxins_pct)}%",
                "scoreValue": toxins_pct,
                "details": "L'inflammation systémique et le stress oxydatif accélèrent le vieillissement cellulaire. L'augmentation des apports en N-Acétyl Cystéine (NAC), glycine et aliments soufrés (crucifères) stimule la production de glutathion, neutralise les radicaux libres et protège l'intégrité mitochondriale."
            })
        else:
            recommendations.append({
                "title": "Optimisation Métabolique Globale",
                "priority": "Impact Élevé",
                "priorityColor": "bg-blue-500/20 text-blue-400",
                "text": f"Votre indice de Toxines est sain ({metrics_record.body_toxin}/6). Focus sur la protection mitochondriale continue.",
                "scoreLabel": f"{int(toxins_pct)}%",
                "scoreValue": toxins_pct,
                "details": "Pour maintenir un faible taux de stress oxydatif, privilégiez les polyphénols (thé vert, petits fruits rouges) et le coenzyme Q10. Ces molécules favorisent la biogenèse mitochondriale et maintiennent une respiration cellulaire optimale."
            })
            
        # Recommendation 2: Workload / Activity (Based on intentions & workload)
        if "Améliorer mes performances sportives" in intentions or metrics_record.work_load >= 30:
            recommendations.append({
                "title": "Recalibrage de la Charge Cardiorespiratoire",
                "priority": "Critique",
                "priorityColor": "bg-orange-500/20 text-orange-400",
                "text": "Ratio d'entraînement Zone 2 élevé recommandé pour préserver la variabilité de la fréquence cardiaque (VFC).",
                "scoreLabel": f"{int(workload_pct)}%",
                "scoreValue": workload_pct,
                "details": "L'excès d'intensité sans base aérobie solide surcharge le système nerveux sympathique. Augmenter le volume d'entraînement en Zone 2 (60-70% FCM) permet de restaurer la balance autonome, d'améliorer le métabolisme des graisses et d'accélérer la récupération post-effort."
            })
        elif "Perdre du poids" in intentions or bmi >= 25:
            recommendations.append({
                "title": "Restructuration du Métabolisme Lipidique",
                "priority": "Critique",
                "priorityColor": "bg-orange-500/20 text-orange-400",
                "text": "Entraînement en résistance et déplétion de glycogène recommandés pour maximiser la sensibilité à l'insuline.",
                "scoreLabel": f"{int(workload_pct)}%",
                "scoreValue": workload_pct,
                "details": "Pour optimiser la composition corporelle et inverser le vieillissement métabolique, intégrez 3 sessions hebdomadaires de renforcement musculaire. L'augmentation de la masse maigre stimule les récepteurs GLUT4, améliorant la clairance du glucose."
            })
        else:
            recommendations.append({
                "title": "Régulation Neuro-Symptomatique",
                "priority": "Modéré",
                "priorityColor": "bg-amber-500/20 text-amber-400",
                "text": "Équilibre travail-repos optimal. Focus sur la cohérence cardiaque.",
                "scoreLabel": f"{int(workload_pct)}%",
                "scoreValue": workload_pct,
                "details": "Votre charge physique et mentale actuelle est équilibrée. Pour pérenniser cet état, intégrez des séances régulières de cohérence cardiaque (respiration 365) afin d'activer le nerf vague et réguler la sécrétion diurne de cortisol."
            })
            
        # Recommendation 3: Longevity / Autophagy (Based on Age & intentions)
        if "Mieux gérer mon stress et mon sommeil" in intentions or "sommeil" in conditions.lower():
            recommendations.append({
                "title": "Restauration de l'Architecture du Sommeil",
                "priority": "Long terme",
                "priorityColor": "bg-emerald-500/20 text-emerald-400",
                "text": "Protocole de synchronisation circadienne et optimisation du sommeil lent profond.",
                "scoreLabel": f"{int(body_age_pct)}%",
                "scoreValue": min(body_age_pct, 100),
                "details": "Le sommeil profond est la phase clé de la détoxification cérébrale (système glymphatique) et de la réparation cellulaire. Limiter l'exposition à la lumière bleue après 20h et maintenir une température de chambre à 18°C favorise la sécrétion naturelle de mélatonine."
            })
        else:
            recommendations.append({
                "title": "Protocole d'Inversion de l'Âge Biologique",
                "priority": "Long terme",
                "priorityColor": "bg-emerald-500/20 text-emerald-400",
                "text": "Activation des sirtuines et des voies de l'autophagie par le jeûne intermittent.",
                "scoreLabel": f"{int(body_age_pct)}%",
                "scoreValue": min(body_age_pct, 100),
                "details": "Un jeûne intermittent de type 16:8 active la voie AMPK et inhibe mTOR, déclenchant l'autophagie : le recyclage des organites cellulaires endommagés. Cela élimine les protéines mal repliées et réduit activement l'âge biologique estimé."
            })
            
        # 2. GENERATE 3 TARGETED INTERVENTIONS
        if "Améliorer mes performances sportives" in intentions:
            interventions = [
                {"icon": "Activity", "title": "Soutien Mitochondrial", "text": "Optimisation de la base aérobie (Zone 2) et supplémentation en CoQ10 pour maximiser la production d'ATP cellulaire."},
                {"icon": "Moon", "title": "Récupération Neurologique", "text": "Séances de contraste thermique (sauna/bain froid) pour stimuler les protéines de choc thermique (HSP)."},
                {"icon": "Droplet", "title": "Clairance de l'Acidité", "text": "Protocole d'hydratation enrichi en bicarbonates pour tamponner les ions hydrogène lors des efforts intenses."}
            ]
        elif "Perdre du poids" in intentions or bmi >= 25:
            interventions = [
                {"icon": "Activity", "title": "Flexibilité Métabolique", "text": "Exercice à jeun de basse intensité le matin pour habituer le corps à oxyder les acides gras libres."},
                {"icon": "Moon", "title": "Régulation de la Ghréline", "text": "Sommeil régulier de 8 heures pour équilibrer la ghréline et la leptine, contrôlant ainsi les fringales diurnes."},
                {"icon": "Droplet", "title": "Sensibilité à l'Insuline", "text": "Consommation de vinaigre de cidre dilué avant les repas riches en glucides pour ralentir la vidange gastrique."}
            ]
        elif "Mieux gérer mon stress et mon sommeil" in intentions:
            interventions = [
                {"icon": "Moon", "title": "Architecture Circadienne", "text": "Exposition solaire précoce et prise de Bisglycinate de Magnésium le soir pour relâcher les tensions musculaires."},
                {"icon": "Activity", "title": "Régulation du Cortisol", "text": "Exercices de cohérence cardiaque (5 secondes d'inspiration, 5 secondes d'expiration) pour stimuler le tonus vagal."},
                {"icon": "Droplet", "title": "Hydratation Cérébrale", "text": "Hydratation avec électrolytes complets au réveil pour contrer la déshydratation nocturne qui majore l'anxiété."}
            ]
        else:
            interventions = [
                {"icon": "Activity", "title": "Biogenèse Mitochondriale", "text": "Entraînement de type endurance fondamentale pour stimuler la prolifération des centrales énergétiques cellulaires."},
                {"icon": "Moon", "title": "Sommeil Profond Réparateur", "text": "Protocole d'obscurité totale et de fraîcheur (18°C) pour maximiser la libération d'hormone de croissance."},
                {"icon": "Droplet", "title": "Clairance des Toxines", "text": "Protocole de jeûne hydrique de 14 à 16h une fois par semaine pour favoriser le nettoyage cellulaire par autophagie."}
            ]
            
        # 3. GENERATE 24H ACTION PLAN (3 items)
        if "Mieux gérer mon stress et mon sommeil" in intentions or "sommeil" in conditions.lower():
            action_plan = [
                {"time": "Matin", "action": "15 min d'exposition au soleil naturel", "desc": "Régule l'horloge biologique et stoppe la production de mélatonine.", "icon": "Sun"},
                {"time": "Midi", "action": "Pause active de 10 min sans écran", "desc": "Diminue la fatigue mentale et réinitialise l'attention visuelle.", "icon": "Zap"},
                {"time": "Soir", "action": "Extinction des écrans 1h avant le coucher", "desc": "Maximise la synthèse naturelle de mélatonine pour un sommeil profond.", "icon": "Moon"}
            ]
        elif "Perdre du poids" in intentions or bmi >= 25:
            action_plan = [
                {"time": "Matin", "action": "Marche à jeun de 20 min", "desc": "Active l'oxydation des acides gras et réveille le métabolisme.", "icon": "Activity"},
                {"time": "Midi", "action": "Déjeuner riche en fibres et protéines", "desc": "Stabilise la glycémie et offre une satiété prolongée sans somnolence.", "icon": "Droplet"},
                {"time": "Soir", "action": "Dîner léger avant 20 heures", "desc": "Permet de respecter une fenêtre de jeûne nocturne propice à la lipolyse.", "icon": "Moon"}
            ]
        else:
            action_plan = [
                {"time": "Matin", "action": "Douche froide de 2 min", "desc": "Déclenche une libération de noradrénaline et stimule l'immunité.", "icon": "Sun"},
                {"time": "Midi", "action": "Hydratation de 500ml d'eau pure", "desc": "Facilite l'élimination des métabolites et soutient la filtration rénale.", "icon": "Droplet"},
                {"time": "Soir", "action": "Étirements légers et respiration", "desc": "Active le système parasympathique et prépare à la récupération nocturne.", "icon": "Moon"}
            ]
            
        return {
            "recommendations": recommendations,
            "interventions": interventions,
            "action_plan": action_plan
        }

    @classmethod
    def calculate_predictions(cls, current_data: Dict, body_age: float, work_load: float, body_toxin: float, body_age_change: float = 0) -> Dict:
        # Resolve normal inputs
        weight = float(current_data.get("weight_kg", 70))
        height = float(current_data.get("height_cm", 170))
        bmi = weight / ((height / 100) ** 2) if height > 0 else 22.0
        
        age = float(current_data.get("age", 30))
        
        # Binned inputs
        activity_freq_raw = current_data.get("activity_freq", 2)
        activity_freq = cls.bin_activity(activity_freq_raw) if isinstance(activity_freq_raw, (int, float)) else str(activity_freq_raw)
        
        sleep_duration_raw = current_data.get("sleep_duration", 7)
        sleep_duration = cls.bin_sleep(sleep_duration_raw) if isinstance(sleep_duration_raw, (int, float)) else str(sleep_duration_raw)
        
        stress_level_raw = current_data.get("stress_level", 3)
        stress_level = cls.bin_stress(stress_level_raw) if isinstance(stress_level_raw, (int, float)) else str(stress_level_raw)
        
        nutrition_raw = current_data.get("nutrition_raw", "Équilibrée")
        nutrition_map = {"Maison": "equilibrated", "Mix maison": "mixed", "Mix": "mixed", 
                         "Équilibrée": "equilibrated", "Standard": "mixed"}
        nutrition_norm = nutrition_map.get(nutrition_raw, "mixed")
        
        alcohol_raw = current_data.get("alcohol_raw", "Jamais")
        
        # Binary status helpers
        sleep_6h_plus_norm = 0 if sleep_duration == "<6h" else 1
        family_history_flag = 1 if current_data.get("family_history_flag", 0) == 1 else 0
        sedentary_time = 4.0
        
        # System Scores (Norm 0-10)
        def norm(val, minv=0, maxv=10):
            if maxv == minv: return 0.0
            return min(max(((val - minv) / (maxv - minv) * 10.0), 0.0), 10.0)
            
        stress_val = {"low": 0.0, "moderate": 5.0, "high": 10.0}.get(stress_level, 5.0)
        inflammation_score = (
            norm(stress_val) +
            norm(10.0 - sleep_6h_plus_norm * 10.0) +
            norm(body_toxin * 5.0, 0.0, 10.0)
        ) / 3.0
        
        nutrition_val = {"equilibrated": 0.0, "mixed": 5.0, "poor": 10.0}.get(nutrition_norm, 5.0)
        metabolic_score = (
            norm(bmi, 18.5, 35.0) +
            norm(sedentary_time) +
            norm(nutrition_val)
        ) / 3.0
        
        stress_hormonal_score = (
            norm(stress_val) +
            norm(work_load, 0.0, 50.0) +
            norm(10.0 - sleep_6h_plus_norm * 10.0)
        ) / 3.0
        
        activity_val = {"0–1": 0.0, "2": 3.0, "3": 5.0, "4": 7.0, "≥5": 10.0}.get(activity_freq, 5.0)
        muscular_recovery_score = (
            norm(activity_val) +
            norm(10.0 - sleep_6h_plus_norm * 10.0) +
            norm(work_load, 0.0, 50.0)
        ) / 3.0
        
        alcohol_val = {"Jamais": 0.0, "Occasionnel": 3.0, "1–3/sem": 6.0, "Régulier": 10.0}.get(alcohol_raw, 0.0)
        liver_detox_score = (
            norm(body_toxin, 0.0, 10.0) +
            norm(alcohol_val) +
            norm(nutrition_val)
        ) / 3.0
        
        cardio_score = (
            norm(work_load, 0.0, 50.0) +
            norm(sedentary_time) +
            norm(stress_val)
        ) / 3.0
        
        # Risk Calculations
        injury_risk = 10.0
        if work_load > 25: injury_risk += 30.0
        if sleep_6h_plus_norm == 0: injury_risk += 25.0
        if stress_level == "high": injury_risk += 20.0
        if inflammation_score > 6.0: injury_risk += 15.0
        injury_risk += min(max(work_load - 20, 0), 10)
        injury_risk = min(max(injury_risk, 5.0), 95.0)
        
        chronic_risk = 5.0
        if bmi > 27: chronic_risk += 30.0
        if body_toxin > 3: chronic_risk += 25.0
        if metabolic_score > 6.0: chronic_risk += 20.0
        if family_history_flag == 1: chronic_risk += 15.0
        chronic_risk = min(max(chronic_risk, 5.0), 95.0)
        
        predicted_body_age_3m = body_age + body_age_change * 1.8
        predicted_body_age_3m = min(max(predicted_body_age_3m, age - 5, 13.0), age + 10.0)
        
        perf_proxy = 100.0 - work_load * 1.5 + (100.0 - body_age) + cardio_score * 2.0
        predicted_performance_improvement = (perf_proxy - 120.0) / 4.0
        predicted_performance_improvement = min(max(predicted_performance_improvement, -15.0), 30.0)
        
        return {
            "predicted_injury_risk_percent": injury_risk,
            "predicted_chronic_risk_percent": chronic_risk,
            "predicted_body_age_3m": predicted_body_age_3m,
            "predicted_performance_improvement_percent": predicted_performance_improvement
        }
