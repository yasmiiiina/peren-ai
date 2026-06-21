import { useEffect, useState } from "react";
import { LazyPlot } from "../components/charts/LazyPlot";
import { devLog } from "../utils/devLog";
import { useNavigate } from "react-router-dom";
import { 
  Activity, 
  Moon, 
  Droplet, 
  Sun, 
  Zap, 
  Heart, 
  Brain, 
  Flame, 
  Dna,
  Shield,
  Clock,
  ArrowRight,
  Sparkles,
  Lock,
  ArrowUpRight,
  CheckCircle2,
  Trophy,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Beaker,
  Plus,
  Terminal,
  ShieldAlert,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

import { useAuth } from "../auth/useAuth";
import { useOpenPremiumSubscription, usePremiumAccess } from "../hooks/usePremium";
import { digitalTwinApi } from "../services/digitalTwin";
import { onboardingApi } from "../services/onboarding";
import { SkeletonSvg, FatSvg, MuscleSvg, ScannerViewport } from "../components/dashboard/BodySilhouetteSvg";

const getIcon = (name) => {
  switch (String(name).toLowerCase()) {
    case "activity": return <Activity className="text-emerald-400" size={20} />;
    case "moon": return <Moon className="text-[#8ab4ff]" size={20} />;
    case "droplet": return <Droplet className="text-[#00CCFF]" size={20} />;
    case "sun": return <Sun className="text-yellow-400" size={20} />;
    case "zap": return <Zap className="text-orange-400" size={20} />;
    case "heart": return <Heart className="text-red-400" size={20} />;
    case "brain": return <Brain className="text-purple-400" size={20} />;
    case "flame": return <Flame className="text-orange-500" size={20} />;
    case "dna": return <Dna className="text-indigo-400" size={20} />;
    case "shield": return <Shield className="text-blue-400" size={20} />;
    case "clock": return <Clock className="text-gray-400" size={20} />;
    default: return <Activity className="text-emerald-400" size={20} />;
  }
};

function compileClinicalProfile(boneTScore, bodyFatPct, visceralLevel, muscleQualityIndex, workload, toxins) {
  const recommendations = [];
  const interventions = [];
  const actionPlan = [];

  // 1. Skeletal
  if (boneTScore < -2.5) {
    recommendations.push({
      title: "Diagnostic d'Ostéoporose et Consolidation Osseuse",
      priority: "Critique",
      priorityColor: "bg-red-500/20 text-red-400 border-red-500/30",
      text: "Consolidation osseuse active par stimulation mécanique et supplémentation synergique.",
      scoreLabel: `${Math.round(Math.max(10, Math.min(99, 100 + boneTScore * 15)))}%`,
      details: "Votre densité minérale osseuse est dans la zone critique d'ostéoporose. Il est impératif d'intégrer des exercices de mise en charge axiale modérée et d'initier un bilan endocrinien. Supplémentation recommandée : Calcium organique, Vitamine D3 (5000 UI/j) et Vitamine K2 (MK-7) pour orienter le calcium vers la matrice osseuse."
    });
  } else if (boneTScore < -1.0) {
    recommendations.push({
      title: "Prévention active de l'Ostéopénie",
      priority: "Impact Majeur",
      priorityColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      text: "Optimisation de la densité minérale par contrainte mécanique progressive.",
      scoreLabel: `${Math.round(Math.max(10, Math.min(99, 100 + boneTScore * 10)))}%`,
      details: "Les données indiquent un T-Score caractéristique d'ostéopénie modérée. Nous recommandons un entraînement en résistance avec charges progressives (squats, soulevés de terre) pour stimuler l'activité ostéoblastique, associé à un apport accru en magnésium et silicium."
    });
  } else {
    recommendations.push({
      title: "Maintien de l'Homéostasie Osseuse",
      priority: "Optimisation",
      priorityColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      text: "Soutien physiologique continu de la structure ostéo-articulaire.",
      scoreLabel: "95%",
      details: "Votre masse et densité osseuses sont optimales. Poursuivez un entraînement de force régulier et assurez un apport quotidien suffisant en micronutriments clés (calcium, phosphore, magnésium) pour pérenniser ce capital structurel."
    });
  }

  // 2. Adipose
  if (visceralLevel >= 15) {
    recommendations.push({
      title: "Réduction Urgente de l'Adiposité Viscérale",
      priority: "Critique",
      priorityColor: "bg-red-500/20 text-red-400 border-red-500/30",
      text: "Ciblage métabolique de la graisse viscérale pour limiter le risque de syndrome métabolique.",
      scoreLabel: `${Math.round(Math.max(10, Math.min(99, 50 + visceralLevel * 3)))}%`,
      details: "Un indice de graisse viscérale supérieur à 15 est fortement corrélé à l'inflammation systémique légère et à la stéatose hépatique. Restreignez drastiquement les glucides simples, intégrez du cardio à basse intensité (Zone 2) pour maximiser l'oxydation lipidique et stimuler la lipolyse."
    });
  } else if (visceralLevel >= 10) {
    recommendations.push({
      title: "Régulation Lipidique et Sensibilité Insulinique",
      priority: "Impact Majeur",
      priorityColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      text: "Clairance métabolique de l'excès de tissu adipeux profond.",
      scoreLabel: `${Math.round(Math.max(10, Math.min(99, 65 + visceralLevel * 2)))}%`,
      details: "L'indice adipeux viscéral est modérément élevé. L'instauration d'un protocole de jeûne intermittent (type 16:8) favorisera l'autophagie et réduira la résistance périphérique à l'insuline. Limitez le stress cortisolique diurne."
    });
  } else {
    recommendations.push({
      title: "Stabilité Métabolique & Profil Lipidique Sain",
      priority: "Optimisation",
      priorityColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      text: "Préservation d'une composition corporelle optimale et saine.",
      scoreLabel: "92%",
      details: "Votre niveau de tissu adipeux viscéral est excellent, minimisant les risques cardiovasculaires sous-jacents. Maintenez un équilibre macronutritionnel riche en acides gras oméga-3 et limitez les pics d'insuline diurnes."
    });
  }

  // 3. Muscular / Workload
  if (workload > 60) {
    recommendations.push({
      title: "Protocole de Restauration Nerveuse et Musculaire",
      priority: "Impact Majeur",
      priorityColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      text: "Atténuation du catabolisme et recalibrage du système nerveux autonome.",
      scoreLabel: `${Math.round(Math.min(99, workload))}%`,
      details: "La charge d'entraînement excessive induit un stress métabolique élevé et une accumulation de toxines musculaires. Priorisez la récupération neurologique par hydrothérapie contrastée et augmentez l'apport protéique nocturne pour soutenir la régénération myofibrillaire."
    });
  } else if (muscleQualityIndex < 70) {
    recommendations.push({
      title: "Traitement de l'Hypotrophie et Conditionnement Musculaire",
      priority: "Critique",
      priorityColor: "bg-red-500/20 text-red-400 border-red-500/30",
      text: "Développement de la force fonctionnelle et stimulation de la synthèse protéique.",
      scoreLabel: `${Math.round(muscleQualityIndex)}%`,
      details: "L'indice de qualité musculaire indique un état de déconditionnement physique modéré. Il convient de déclencher l'hypertrophie myofibrillaire par un entraînement en résistance de 3 séances hebdomadaires à 75% RM, avec apport de Leucine et de créatine monohydrate."
    });
  } else {
    recommendations.push({
      title: "Conditionnement Athlétique Avancé",
      priority: "Optimisation",
      priorityColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      text: "Optimisation de l'efficience neuromusculaire et de la puissance.",
      scoreLabel: `${Math.round(muscleQualityIndex)}%`,
      details: "Excellente qualité musculaire avec un recrutement des unités motrices optimal. Poursuivez un travail de force-vitesse ou d'endurance de puissance pour maintenir ce niveau élevé d'intégrité myofibrillaire."
    });
  }

  // Interventions
  if (toxins > 3.0) {
    interventions.push({
      icon: "Droplet",
      title: "Clairance Métabolique & Détox",
      text: "Hydratation alcalinisante enrichie en électrolytes complets pour accélérer l'excrétion rénale des toxines périphériques."
    });
  } else {
    interventions.push({
      icon: "Droplet",
      title: "Clairance Métabolique Standard",
      text: "Hydratation optimale structurée (35 ml/kg) favorisant l'homéostasie lymphatique et l'élimination des déchets métaboliques résiduels."
    });
  }

  if (workload > 60 || toxins > 3.0) {
    interventions.push({
      icon: "Moon",
      title: "Récupération Autonome Contrastée",
      text: "Séances thermiques alternées (sauna 85°C / bain glacé 8°C) pour activer les protéines HSP et rétablir la balance sympathique/parasympathique."
    });
  } else if (muscleQualityIndex < 70) {
    interventions.push({
      icon: "Activity",
      title: "Soutien Anabolique & Tension",
      text: "Application de protocoles de tension sous charge mécanique pour stimuler les voies mTOR de la synthèse protéique musculaire."
    });
  } else {
    interventions.push({
      icon: "Activity",
      title: "Soutien Mitochondrial Continu",
      text: "Volume d'endurance aérobie fondamentale (Zone 2) à 65% FCM pour stimuler la biogenèse mitochondriale et le transport d'oxygène."
    });
  }

  if (boneTScore < -1.0) {
    interventions.push({
      icon: "Shield",
      title: "Ostéo-protection & Ostéogenèse",
      text: "Stimulation vibratoire basse fréquence ou impacts axiaux contrôlés pour induire la mécanotransduction des ostéocytes."
    });
  } else {
    interventions.push({
      icon: "Shield",
      title: "Protection Structurelle Globale",
      text: "Mobilisation articulaire globale et étirements myofasciaux pour préserver la souplesse tendineuse et l'alignement postural."
    });
  }

  // Action Plan
  if (workload > 65) {
    actionPlan.push({
      time: "Matin",
      action: "Réveil lymphatique & Hydratation",
      desc: "Prise de 500 ml d'eau saline tiède suivie d'étirements légers pour décharger la colonne vertébrale.",
      icon: "Sun"
    });
    actionPlan.push({
      time: "Midi",
      action: "Micro-sieste de décharge nerveuse",
      desc: "Repos de 15 minutes en décubitus dorsal sans exposition visuelle pour calmer l'hyperactivité sympathique.",
      icon: "Zap"
    });
    actionPlan.push({
      time: "Soir",
      action: "Protocole thermique & Magnésium",
      desc: "Douche tiède/froide alternée et prise de bisglycinate de magnésium pour favoriser le sommeil lent profond.",
      icon: "Moon"
    });
  } else if (bodyFatPct > 22) {
    actionPlan.push({
      time: "Matin",
      action: "Cardio en jeûne hydrique",
      desc: "30 minutes de marche rapide ou vélo en Zone 2 pour maximiser l'utilisation métabolique des acides gras libres.",
      icon: "Sun"
    });
    actionPlan.push({
      time: "Midi",
      action: "Repas pauvre en glucides raffinés",
      desc: "Priorité aux protéines de haute valeur biologique et légumes fibreux pour maintenir une glycémie stable.",
      icon: "Zap"
    });
    actionPlan.push({
      time: "Soir",
      action: "Restriction alimentaire circadienne",
      desc: "Début du jeûne à 20h00 pour optimiser la phase de repos pancréatique et le métabolisme nocturne.",
      icon: "Moon"
    });
  } else {
    actionPlan.push({
      time: "Matin",
      action: "Exposition lumineuse précoce",
      desc: "10-15 minutes de lumière naturelle directe pour caler la sécrétion de cortisol et le rythme circadien.",
      icon: "Sun"
    });
    actionPlan.push({
      time: "Midi",
      action: "Pause cognitive neuromodulatrice",
      desc: "Respiration ventrale lente (cohérence cardiaque 5/5/5) pour ramener le tonus vagal à l'équilibre.",
      icon: "Zap"
    });
    actionPlan.push({
      time: "Soir",
      action: "Extinction des sources de lumière bleue",
      desc: "Filtrage des écrans dès 21h00 pour permettre la sécrétion naturelle de mélatonine endogène.",
      icon: "Moon"
    });
  }

  return { recommendations, interventions, actionPlan };
}

export default function ScoreDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const hasPremiumAccess = usePremiumAccess();
  const openPremiumSubscription = useOpenPremiumSubscription();

  // Create dynamic user-specific dataset based on user email
  const userEmail = user?.email || "guest";
  let hash = 0;
  for (let i = 0; i < userEmail.length; i++) {
    hash = userEmail.charCodeAt(i) + ((hash << 5) - hash);
  }
  const absHash = Math.abs(hash);

  // Dynamic user details fallback with onboarding profile integration
  const [onboardingForm, setOnboardingForm] = useState(null);

  // Fetch onboarding profile data on mount
  useEffect(() => {
    onboardingApi.get()
      .then(res => {
        if (res && res.data && res.data.form) {
          setOnboardingForm(res.data.form);
        }
      })
      .catch(err => {
        devLog("Failed to load onboarding data:", err);
      });
  }, []);

  const onboardingSex = onboardingForm?.sexAssignedAtBirth;
  const sex = onboardingSex
    ? (onboardingSex.toLowerCase() === "homme" || onboardingSex.toLowerCase() === "m" || onboardingSex.toLowerCase() === "male" ? "Male" : "Female")
    : (user?.sex || (absHash % 2 === 0 ? "Female" : "Male"));

  const calculateAge = (birthDateStr) => {
    if (!birthDateStr) return null;
    try {
      const birthDate = new Date(birthDateStr);
      const today = new Date();
      let ageVal = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        ageVal--;
      }
      return ageVal;
    } catch {
      return null;
    }
  };
  const age = calculateAge(onboardingForm?.birthDate) || user?.age || (25 + (absHash % 20));

  const onboardingIntentions = onboardingForm?.intentions || [];
  let sportType = absHash % 3 === 0 ? "Running" : absHash % 3 === 1 ? "Cycling" : "Fitness";
  if (onboardingIntentions.includes("Améliorer mes performances sportives")) {
    sportType = absHash % 2 === 0 ? "Running" : "Cycling";
  } else if (onboardingIntentions.includes("Perdre du poids")) {
    sportType = "Fitness";
  }

  const [loading, setLoading] = useState(true);
  const [metricFilter, setMetricFilter] = useState("all");
  const [backendTwin, setBackendTwin] = useState(null);
  const [activeZone, setActiveZone] = useState("heart");

  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [expandedScenario, setExpandedScenario] = useState("S001");
  const [appliedScenario, setAppliedScenario] = useState(null);
  const [customIntensity, setCustomIntensity] = useState(75);
  const [customFrequency, setCustomFrequency] = useState(4);
  const [customDuration, setCustomDuration] = useState(6);
  const [simulatedBiometrics, setSimulatedBiometrics] = useState(null);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [selectedTimelineIndex, setSelectedTimelineIndex] = useState(9);
  const [simStep, setSimStep] = useState(0);
  const [activeClinicalTab, setActiveClinicalTab] = useState("recommendations");

  useEffect(() => {
    if (!isSimulationActive) {
      setSimulatedBiometrics(null);
      return;
    }

    const runSimulationStep = () => {
      let intensity, frequency, duration, name;
      if (appliedScenario === "S001") {
        intensity = 85; frequency = 6; duration = 4; name = "Competition Prep";
      } else if (appliedScenario === "S002") {
        intensity = 65; frequency = 4; duration = 6; name = "Injury Prevention";
      } else if (appliedScenario === "S003") {
        intensity = 90; frequency = 5; duration = 2; name = "Performance Peak";
      } else if (appliedScenario === "custom") {
        intensity = customIntensity; frequency = customFrequency; duration = customDuration; name = "Custom Simulation";
      } else {
        intensity = 60; frequency = 3; duration = 4; name = "Baseline Feed";
      }

      const workload = intensity * frequency * 0.12;
      let toxins = (intensity * 0.04) + (frequency * 0.35) - (duration * 0.18);
      toxins = Math.max(0.5, Math.min(10.0, toxins));
      
      const age_delta = -1.0 - (frequency * 0.3) - (duration * 0.22) + 
        (workload > 60 ? (workload - 60) * 0.25 : 0) + 
        (workload < 25 ? (25 - workload) * 0.08 : 0);
      const sim_age = Math.max(24.0, Math.min(40.0, age + age_delta));

      setSimStep(prev => {
        const nextStep = prev + 1;
        const wave = Math.sin(nextStep * 0.5);

        // Smooth wave biological oscillations
        const brainVal = Math.max(10, Math.min(80, 16.0 + workload * 0.3 + (wave * 2.0)));
        const heartVal = Math.max(45, Math.min(140, 58.0 + (intensity - 50) * 0.45 + (frequency * 1.2) + (wave * 3.5)));
        const lungsVal = Math.max(90, Math.min(100, 99.6 - (intensity * 0.015) + (wave * 0.2)));
        const liverVal = Math.max(0.1, Math.min(6.0, 0.4 + (intensity * 0.025) + (frequency * 0.15) - (duration * 0.1) + (wave * 0.05)));

        const newBiometrics = {
          brain: brainVal,
          heart: heartVal,
          lungs: lungsVal,
          liver: liverVal,
          leftArm: Math.max(10, Math.min(95, 32.0 + (intensity - 50) * 0.75 + (wave * 4.0))),
          rightArm: Math.max(10, Math.min(95, (32.0 + (intensity - 50) * 0.75) * 1.08 + (wave * 4.0))),
          core: Math.max(40, Math.min(100, 74.0 + duration * 1.3 - (intensity * frequency * 0.02) + (wave * 1.5))),
          leftLeg: Math.max(40, Math.min(100, 68.0 + duration * 1.1 - (frequency * 1.0) + (wave * 1.5))),
          rightLeg: Math.max(40, Math.min(100, 68.0 + duration * 1.1 - (frequency * 1.0) + (wave * 1.5)))
        };

        setSimulatedBiometrics({
          biometrics: newBiometrics,
          workload,
          toxins,
          bodyAge: sim_age
        });

        // Update log
        const timeStr = new Date().toTimeString().split(' ')[0];
        const logRow = `[${timeStr}] Telemetry: ${name} | HR: ${newBiometrics.heart.toFixed(1)} BPM | SpO2: ${newBiometrics.lungs.toFixed(1)}% | Workload: ${workload.toFixed(1)}%`;
        setConsoleLogs(pl => [logRow, ...pl].slice(0, 15));

        return nextStep;
      });
    };

    runSimulationStep();
    const interval = setInterval(runSimulationStep, 1500);
    return () => clearInterval(interval);
  }, [isSimulationActive, appliedScenario, customIntensity, customFrequency, customDuration, age]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    digitalTwinApi.getLatest()
      .then(res => {
        setBackendTwin(res);
      })
      .catch(err => {
        devLog("No backend twin found, using client generation:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-[#9ca3af] bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-emerald-500" />
          <p className="text-sm font-medium">Analyzing your Digital Twin...</p>
        </div>
      </div>
    );
  }

  const today = new Date();
  const MONTHS_FR = ["JAN", "FEV", "MAR", "AVR", "MAI", "JUN", "JUI", "AOU", "SEP", "OCT", "NOV", "DEC"];

  const timelineNodes = [];
  for (let i = 9; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const mLabel = MONTHS_FR[d.getMonth()];
    const yLabel = d.getFullYear().toString();
    const sizeVal = (d.getMonth() % 3 === 0) ? "large" : (d.getMonth() % 2 === 0) ? "medium" : "small";

    timelineNodes.push({
      label: mLabel,
      year: yLabel,
      size: sizeVal,
      dateKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`,
      isSimulation: false
    });
  }

  if (isSimulationActive && simulatedBiometrics) {
    timelineNodes.push({
      label: "SIM",
      year: "PROJ",
      size: "large",
      isSimulation: true
    });
  }

  const clampedIndex = Math.min(selectedTimelineIndex, timelineNodes.length - 1);
  const isSelectedNodeSimulation = timelineNodes[clampedIndex]?.isSimulation === true;

  const getTimelineFactor = (index) => {
    const factors = [0.93, 0.96, 0.99, 0.95, 0.97, 1.01, 1.03, 0.98, 1.02, 1.00, 1.05];
    return factors[index % factors.length] || 1.0;
  };
  const timelineFactor = getTimelineFactor(clampedIndex);

  const latestBase = backendTwin ? {
    sex: backendTwin.sex || sex,
    age: backendTwin.age || age,
    Sport_type: backendTwin.Sport_type || sportType,
    body_age: backendTwin.body_age,
    body_age_change: backendTwin.body_age_change,
    work_load: backendTwin.work_load,
    work_load_change: backendTwin.work_load_change,
    body_toxin: backendTwin.body_toxin,
    body_toxin_change: backendTwin.body_toxin_change,
    predicted_injury_risk_percent: backendTwin.predicted_injury_risk_percent || (10 + (absHash % 60)),
    predicted_chronic_risk_percent: backendTwin.predicted_chronic_risk_percent || (5 + (absHash % 55)),
    predicted_body_age_3m: backendTwin.predicted_body_age_3m || (age + (absHash % 5) - 3.5),
    predicted_performance_improvement_percent: backendTwin.predicted_performance_improvement_percent || (-5 + (absHash % 25))
  } : {
    sex,
    age,
    Sport_type: sportType,
    body_age: age + (absHash % 5) - 2.5,
    body_age_change: (absHash % 5) - 2.5,
    work_load: 40 + (absHash % 45),
    work_load_change: ((absHash % 20) - 10) / 2,
    body_toxin: 1.5 + (absHash % 35) / 10,
    body_toxin_change: ((absHash % 10) - 5) / 5,
    predicted_injury_risk_percent: 10 + (absHash % 60),
    predicted_chronic_risk_percent: 5 + (absHash % 55),
    predicted_body_age_3m: age + (absHash % 5) - 3.5,
    predicted_performance_improvement_percent: -5 + (absHash % 25)
  };

  const latest = (isSimulationActive && simulatedBiometrics && isSelectedNodeSimulation) ? {
    ...latestBase,
    body_age: simulatedBiometrics.bodyAge,
    work_load: simulatedBiometrics.workload,
    body_toxin: simulatedBiometrics.toxins,
    predicted_injury_risk_percent: Math.max(5, Math.min(95, simulatedBiometrics.workload * 0.85 + simulatedBiometrics.toxins * 2.0)),
    predicted_chronic_risk_percent: Math.max(5, Math.min(95, (simulatedBiometrics.bodyAge - age) * 5 + simulatedBiometrics.toxins * 6.0 + 15)),
    predicted_body_age_3m: simulatedBiometrics.bodyAge - 0.8,
    predicted_performance_improvement_percent: Math.max(-20, Math.min(30, (simulatedBiometrics.workload - 50) * 0.35 + (8 - simulatedBiometrics.toxins) * 1.5))
  } : {
    ...latestBase,
    body_age: Math.max(latestBase.age - 5, Math.min(latestBase.age + 8, latestBase.body_age * timelineFactor)),
    work_load: Math.max(10, Math.min(100, latestBase.work_load * timelineFactor)),
    body_toxin: Math.max(0.2, Math.min(10.0, latestBase.body_toxin * timelineFactor)),
  };

  // Generate dynamic timeline based on latest data
  const timeline = backendTwin?.timeline || [
    { datetime: timelineNodes[0].label, body_age: latest.body_age * 1.05, work_load: latest.work_load - 15, body_toxin: latest.body_toxin + 0.8 },
    { datetime: timelineNodes[2].label, body_age: latest.body_age * 1.03, work_load: latest.work_load - 10, body_toxin: latest.body_toxin + 0.5 },
    { datetime: timelineNodes[4].label, body_age: latest.body_age * 1.02, work_load: latest.work_load - 5, body_toxin: latest.body_toxin + 0.3 },
    { datetime: timelineNodes[6].label, body_age: latest.body_age * 1.01, work_load: latest.work_load + 2, body_toxin: latest.body_toxin + 0.1 },
    { datetime: timelineNodes[8].label, body_age: latest.body_age * 0.99, work_load: latest.work_load - 3, body_toxin: latest.body_toxin - 0.2 },
    { datetime: timelineNodes[9].label, body_age: latest.body_age, work_load: latest.work_load, body_toxin: latest.body_toxin }
  ];

  // --- USER PROFILE ---
  const gender = latest.sex === "Female" ? "Female" : latest.sex === "Male" ? "Male" : "N/A";
  const initial = gender !== "N/A" ? gender[0] : "U";
  const userName = user?.name || (user?.first_name ? `${user.first_name} ${user.last_name || ""}` : "Amber Sanchez");

  // Calculate detailed biometrics dynamically based on latest metrics
  const biometrics = (isSimulationActive && simulatedBiometrics && isSelectedNodeSimulation) ? simulatedBiometrics.biometrics : {
    brain: 15.5 + (latest.work_load * 0.12) + (absHash % 5),
    heart: 62.0 + (latest.work_load * 0.35) - (latest.body_toxin * 0.5) + (absHash % 8),
    lungs: Math.max(92, Math.min(100, 99.6 - (latest.work_load * 0.02) - (latest.body_toxin * 0.08) + (absHash % 2) * 0.1)),
    liver: Math.max(0.5, Math.min(10.0, latest.body_toxin * 1.05 + (absHash % 10) * 0.05)),
    leftArm: Math.max(20, Math.min(95, 30.0 + (latest.work_load * 0.45) + (absHash % 12))),
    rightArm: Math.max(20, Math.min(95, (30.0 + (latest.work_load * 0.45) + (absHash % 12)) * 1.05)),
    core: Math.max(40, Math.min(98, 92.0 - (latest.body_age - age) * 1.5 - (latest.body_toxin * 0.6))),
    leftLeg: Math.max(40, Math.min(98, 88.0 - (latest.body_age - age) * 1.2 - (latest.body_toxin * 0.4))),
    rightLeg: Math.max(40, Math.min(98, 88.0 - (latest.body_age - age) * 1.2 - (latest.body_toxin * 0.4)))
  };

  // --- CLINICAL BODY COMPOSITION METRICS ---
  // Weight & Height based on actual onboarding data, with smart fallbacks
  const weight = parseFloat(onboardingForm?.weightKg) || (gender === "Male" ? 76 : 58);
  const height = parseFloat(onboardingForm?.heightCm) || (gender === "Male" ? 178 : 164);
  const bmi = weight / ((height / 100) ** 2);

  // Skeletal Composition (Bone Mass, Density, T-score)
  // Bone mass is realistically ~3.5% of body weight for women, ~4.5% for men
  const boneMass = weight * (gender === "Male" ? 0.045 : 0.035) + (latest.work_load * 0.003);
  
  // Bone density (BMD) decreases with age, but increases with mechanical load (training workload)
  const baseDensity = gender === "Male" ? 1.2 : 1.05;
  const ageDecline = age > 30 ? (age - 30) * 0.0035 : 0;
  const boneDensity = baseDensity - ageDecline + (latest.work_load * 0.0006);
  
  // T-score is standard deviation from young adult mean (approx baseDensity)
  const boneTScore = (boneDensity - baseDensity) / (gender === "Male" ? 0.12 : 0.1);

  // Adipose Composition (Body Fat %, Fat Mass, Visceral Level)
  // Deurenberg formula: BF = 1.20 * BMI + 0.23 * Age - 10.8 * Sex - 5.4 (Sex: Male = 1, Female = 0)
  const isMaleVal = gender === "Male" ? 1 : 0;
  let computedFatPct = (1.20 * bmi) + (0.23 * age) - (10.8 * isMaleVal) - 5.4;
  
  // Adjust body fat slightly based on toxins (higher fat storage) and workload (lower fat storage)
  computedFatPct += (latest.body_toxin * 0.3) - (latest.work_load * 0.04);
  
  // Clamp to biologically realistic bounds
  const bodyFatPct = Math.max(gender === "Male" ? 5 : 10, Math.min(gender === "Male" ? 45 : 50, computedFatPct));
  const fatMass = (weight * bodyFatPct) / 100; // kg
  
  // Visceral level scale from 1 to 20, derived from BMI and age
  const visceralLevel = Math.max(
    1,
    Math.min(
      20,
      Math.round((bmi - 18.5) * 0.85 + (age - 20) * 0.12 + (latest.body_toxin * 0.25))
    )
  );

  // Muscular Composition (Muscle Mass, Muscle %, Quality Index)
  // Muscle % is estimated based on body fat and standard non-muscle lean tissues
  const musclePct = 100 - bodyFatPct - (gender === "Male" ? 15 : 12);
  const muscleMass = (weight * musclePct) / 100; // kg

  // Holographic volume estimates (cm³) — calibrated to clinical display scale
  const skeletonVolume = Math.round(14200 + boneMass * 1050);
  const visceralFatVolume = Math.round(1800 + visceralLevel * 52 + fatMass * 40);
  const muscleVolume = Math.round(11800 + muscleMass * 108);
  
  // Muscle Quality Index is a relative strength/quality index (50-100)
  const baseMqi = gender === "Male" ? 85 : 80;
  const ageMqiDecline = age > 35 ? (age - 35) * 0.45 : 0;
  const muscleQualityIndex = Math.max(
    50,
    Math.min(
      100,
      Math.round(baseMqi - ageMqiDecline + (latest.work_load * 0.18))
    )
  );

  // --- HEALTH INDICATORS LOGIC ---
  const getBodyAgeStatus = () => {
    const gap = latest.body_age - latest.age;
    if (gap <= -2) return { status: "OPTIMAL", color: "#10b981", bg: "bg-emerald-500" };
    if (gap <= 2) return { status: "GOOD", color: "#eab308", bg: "bg-yellow-500" };
    return { status: "ATTENTION", color: "#ef4444", bg: "bg-red-500" };
  };

  const getWorkloadStatus = () => {
    if (latest.work_load <= 30) return { status: "OPTIMAL", color: "#10b981", bg: "bg-emerald-500" };
    if (latest.work_load <= 60) return { status: "MODERATE", color: "#eab308", bg: "bg-yellow-500" };
    return { status: "HIGH", color: "#ef4444", bg: "bg-red-500" };
  };

  const getToxinsStatus = () => {
    if (latest.body_toxin <= 1) return { status: "OPTIMAL", color: "#10b981", bg: "bg-emerald-500" };
    if (latest.body_toxin <= 3) return { status: "MODERATE", color: "#eab308", bg: "bg-yellow-500" };
    return { status: "HIGH", color: "#ef4444", bg: "bg-red-500" };
  };

  const bodyAgeInfo = getBodyAgeStatus();
  const workLoadInfo = getWorkloadStatus();
  const toxinsInfo = getToxinsStatus();

  const bodyAgeGap = latest.body_age - latest.age;

  // --- AI PREDICTIONS LOGIC ---
  const injury = latest.predicted_injury_risk_percent;
  const injColor = injury < 25 ? "#10b981" : injury < 50 ? "#f59e0b" : "#ef4444";
  const injText = injury < 25 ? "Low risk – Keep current balance" : injury < 50 ? "Moderate risk – Focus on recovery" : "High risk – Reduce load and improve sleep";

  const chronic = latest.predicted_chronic_risk_percent;
  const chrColor = chronic < 30 ? "#10b981" : chronic < 60 ? "#f59e0b" : "#ef4444";
  const chrText = chronic < 30 ? "Low risk – Protective lifestyle" : chronic < 60 ? "Moderate risk – Improvements needed" : "High risk – Medical follow-up advised";

  const predAge = latest.predicted_body_age_3m;
  const ageDelta = predAge - latest.body_age;
  const ageColor = ageDelta < -0.5 ? "#10b981" : ageDelta < 0.5 ? "#eab308" : "#ef4444";
  const ageText = ageDelta < -0.5 ? "Improving – Body getting younger" : ageDelta < 0.5 ? "Stable biological age" : "Increasing – Focus on recovery";

  const perf = latest.predicted_performance_improvement_percent;
  const perfColor = perf > 10 ? "#10b981" : perf > 0 ? "#eab308" : "#ef4444";
  const perfText = perf > 10 ? "Strong expected gains" : perf > 0 ? "Moderate improvement expected" : "Risk of decline – Optimize recovery";

  // --- PLOTLY TIMELINE LOGIC ---
  const activeTimeline = [...timeline];
  if (isSimulationActive && simulatedBiometrics) {
    activeTimeline.push({
      datetime: "Target (Simulated)",
      body_age: simulatedBiometrics.bodyAge,
      work_load: simulatedBiometrics.workload,
      body_toxin: simulatedBiometrics.toxins
    });
  }

  const xData = activeTimeline.map(d => d.datetime);
  const plotData = [];

  if (metricFilter === "all" || metricFilter === "body_age") {
    plotData.push({
      x: xData,
      y: activeTimeline.map(d => d.body_age),
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Body Age',
      line: { color: '#FFD700' }
    });
  }
  if (metricFilter === "all" || metricFilter === "work_load") {
    plotData.push({
      x: xData,
      y: activeTimeline.map(d => d.work_load),
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Workload',
      line: { color: '#00FF9D' }
    });
  }
  if (metricFilter === "all" || metricFilter === "body_toxin") {
    plotData.push({
      x: xData,
      y: activeTimeline.map(d => d.body_toxin),
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Toxins',
      line: { color: '#00CCFF' }
    });
  }

  // --- PREMIUM ACCESS CHECK ---

  // Sample data to show under blurred lock if not premium
  const sampleRecommendations = [
    {
      title: "Gestion du Stress Oxydatif & Détoxification",
      priority: "Impact Majeur",
      priorityColor: "bg-red-500/20 text-red-400 border-red-500/30",
      text: "Optimisation de la production endogène de glutathion via précurseurs ciblés.",
      scoreLabel: "89%",
      details: "L'inflammation systémique légère et le stress oxydatif diurne accélèrent le vieillissement cellulaire. L'intégration de Glycine et de N-Acétyl Cystéine soutient la respiration mitochondriale."
    },
    {
      title: "Recalibrage Cardiorespiratoire (Zone 2)",
      priority: "Critique",
      priorityColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      text: "Volume d'endurance aérobie fondamentale accru pour optimiser le métabolisme lipidique.",
      scoreLabel: "76%",
      details: "Un volume d'entraînement en Zone 2 (60-70% FCM) régule l'hyperactivité sympathique diurne, augmente la densité mitochondriale et favorise une clairance rapide de l'acide lactique."
    },
    {
      title: "Protocole d'Inversion de l'Âge Biologique",
      priority: "Long terme",
      priorityColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      text: "Activation des sirtuines cellulaires (SIRT1/SIRT3) par restriction circadienne.",
      scoreLabel: "92%",
      details: "Le maintien d'un jeûne intermittent de type 16:8 déclenche activement l'autophagie : le mécanisme biologique d'élimination et de recyclage des organites cellulaires sénescents."
    }
  ];

  const sampleInterventions = [
    { icon: "Activity", title: "Soutien Mitochondrial", text: "Optimisation de la base aérobie and supplémentation en coenzyme Q10 pour relancer la chaîne respiratoire d'ATP." },
    { icon: "Moon", title: "Récupération Neurologique", text: "Séances d'exposition thermique contrastée (sauna/bain froid) pour stimuler les protéines de choc thermique (HSP)." },
    { icon: "Droplet", title: "Clairance Métabolique", text: "Protocole d'hydratation enrichi en électrolytes complets pour tamponner l'acidose tissulaire périphérique." }
  ];

  const sampleActionPlan = [
    { time: "Matin", action: "15 min d'exposition au soleil naturel", desc: "Ajuste la sécrétion de cortisol et synchronise les oscillateurs circadiens.", icon: "Sun" },
    { time: "Midi", action: "Pause active de 10 min sans écran", desc: "Diminue la charge cognitive et recalibre la tension nerveuse.", icon: "Zap" },
    { time: "Soir", action: "Extinction des lumières bleues à 20h30", desc: "Permet la libération de mélatonine endogène pour un sommeil réparateur profond.", icon: "Moon" }
  ];

  const recommendations = hasPremiumAccess ? (backendTwin?.recommendations || []) : sampleRecommendations;
  const interventions = hasPremiumAccess ? (backendTwin?.interventions || []) : sampleInterventions;
  const actionPlan = hasPremiumAccess ? (backendTwin?.action_plan || []) : sampleActionPlan;

  const calculateCustomOutcomes = () => {
    const workload = customIntensity * customFrequency * 0.12;
    let toxins = (customIntensity * 0.04) + (customFrequency * 0.35) - (customDuration * 0.18);
    toxins = Math.max(0.5, Math.min(10.0, toxins));
    
    const age_delta = -1.0 - (customFrequency * 0.3) - (customDuration * 0.22) + 
      (workload > 60 ? (workload - 60) * 0.25 : 0) + 
      (workload < 25 ? (25 - workload) * 0.08 : 0);
    const bodyAge = Math.max(24.0, Math.min(40.0, age + age_delta));
    
    return { workload, toxins, bodyAge };
  };
  const customOutcomes = calculateCustomOutcomes();

  // Scenario presets data
  const SCENARIO_PRESETS = [
    {
      id: "S001", name: "Competition Preparation", icon: <Trophy size={18} />,
      description: "Optimize training load for upcoming championship",
      iconBg: "bg-amber-500/20", iconColor: "text-amber-400",
      parameters: [
        { label: "Training Days", value: "6", unit: "days/week" },
        { label: "Intensity", value: "85", unit: "%" },
        { label: "Duration", value: "4", unit: "weeks" }
      ],
      outcomes: { bodyAge: "27.0 yrs", workload: "88%", toxins: "3.2" }
    },
    {
      id: "S002", name: "Injury Prevention", icon: <ShieldCheck size={18} />,
      description: "Reduce injury risk through balanced recovery",
      iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400",
      parameters: [
        { label: "Training Days", value: "4", unit: "days/week" },
        { label: "Intensity", value: "65", unit: "%" },
        { label: "Recovery Days", value: "3", unit: "days/week" }
      ],
      outcomes: { bodyAge: "26.0 yrs", workload: "58%", toxins: "1.8" }
    },
    {
      id: "S003", name: "Performance Peak", icon: <Zap size={18} />,
      description: "Maximize performance for critical event",
      iconBg: "bg-blue-500/20", iconColor: "text-blue-400",
      parameters: [
        { label: "Training Days", value: "5", unit: "days/week" },
        { label: "Intensity", value: "90", unit: "%" },
        { label: "Duration", value: "2", unit: "weeks" }
      ],
      outcomes: { bodyAge: "28.0 yrs", workload: "92%", toxins: "3.5" }
    }
  ];

  return (
    <section className="min-h-screen bg-[#060b16] py-8 pb-8 text-[#c8d6e5] selection:bg-blue-500/30">
      <div className="mx-auto w-full max-w-[1600px] px-4 md:px-8">
        
        {/* HEADER SECTION */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">Your Digital Twin Dashboard</h1>
            <p className="mt-2 text-sm text-gray-400">
              {backendTwin ? "✓ Connected to live biometric database record" : "Preview mode · Dynamic algorithmic twin active"}
              {isSimulationActive && <span className="ml-2 text-cyan-400 font-semibold">· 🧪 Simulation Active</span>}
            </p>
          </div>
          {!hasPremiumAccess && (
            <button 
              onClick={openPremiumSubscription}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 active:scale-95"
            >
              <Sparkles size={14} className="text-blue-200" /> Manage Subscription
            </button>
          )}
        </div>


        {/* ═══ ROW 1: ANATOMICAL SYSTEM SCANNERS ═══ */}
        <div className="mb-8">
          <div className="rounded-2xl border border-slate-700/40 bg-[#060d1a]/90 backdrop-blur-xl p-5 shadow-xl flex flex-col gap-4">
            <div className="border-b border-slate-700/30 pb-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-sky-400/90">BIA · DEXA · MRI FUSION</span>
                <span className="text-[8px] font-mono text-slate-500">MULTI-FREQ BIOIMPEDANCE</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-100 mt-1 tracking-tight">Anatomical System Scanners</h2>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1 font-mono">
                Body composition analysis · skeletal · adipose · muscular tissue segmentation
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 items-start">
              {/* Skeletal */}
              {(() => {
                const skelActive = ["brain", "heart", "lungs", "core"].includes(activeZone);
                return (
                  <div className="flex flex-col gap-2 cursor-pointer" onClick={() => setActiveZone("core")}>
                    <div className={`rounded-lg overflow-hidden border transition-colors ${skelActive ? "border-sky-500/50 bg-sky-950/20" : "border-slate-700/40 bg-slate-900/30"}`}>
                      <ScannerViewport modality="DXA" active={skelActive}>
                        <SkeletonSvg isActive={skelActive} />
                      </ScannerViewport>
                    </div>
                    <div className="rounded-lg border border-slate-700/30 bg-slate-900/30 p-2.5 space-y-1">
                      <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase">
                        <span>Volume</span>
                        <span className="text-slate-300">{skeletonVolume.toLocaleString()} cm³</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-slate-500">Bone Mass</span>
                        <span className="font-mono text-slate-200">{boneMass.toFixed(1)} kg</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-slate-500">T-Score</span>
                        <span className="font-mono text-sky-400">{boneTScore > 0 ? "+" : ""}{boneTScore.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Adipose */}
              {(() => {
                const fatActive = activeZone === "liver";
                return (
                  <div className="flex flex-col gap-2 cursor-pointer" onClick={() => setActiveZone("liver")}>
                    <div className={`rounded-lg overflow-hidden border transition-colors ${fatActive ? "border-sky-500/50 bg-sky-950/20" : "border-slate-700/40 bg-slate-900/30"}`}>
                      <ScannerViewport modality="MRI" active={fatActive}>
                        <FatSvg isActive={fatActive} toxinLevel={biometrics.liver} />
                      </ScannerViewport>
                    </div>
                    <div className="rounded-lg border border-slate-700/30 bg-slate-900/30 p-2.5 space-y-1">
                      <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase">
                        <span>Visceral Vol.</span>
                        <span className="text-slate-300">{visceralFatVolume.toLocaleString()} cm³</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-slate-500">Fat %</span>
                        <span className="font-mono text-slate-200">{bodyFatPct.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-slate-500">Visceral Level</span>
                        <span className="font-mono text-sky-400">{visceralLevel}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Muscular */}
              {(() => {
                const musActive = ["leftArm", "rightArm", "leftLeg", "rightLeg"].includes(activeZone);
                return (
                  <div className="flex flex-col gap-2 cursor-pointer" onClick={() => setActiveZone("leftArm")}>
                    <div className={`rounded-lg overflow-hidden border transition-colors ${musActive ? "border-sky-500/50 bg-sky-950/20" : "border-slate-700/40 bg-slate-900/30"}`}>
                      <ScannerViewport modality="EMG/BIA" active={musActive}>
                        <MuscleSvg isActive={musActive} workload={biometrics.leftArm} />
                      </ScannerViewport>
                    </div>
                    <div className="rounded-lg border border-slate-700/30 bg-slate-900/30 p-2.5 space-y-1">
                      <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase">
                        <span>Volume</span>
                        <span className="text-slate-300">{muscleVolume.toLocaleString()} cm³</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-slate-500">Muscle Mass</span>
                        <span className="font-mono text-slate-200">{muscleMass.toFixed(1)} kg</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-slate-500">Quality Index</span>
                        <span className="font-mono text-sky-400">{muscleQualityIndex}%</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* ═══ CHRONOLOGICAL TWIN STATE HISTORY — directly below body scan ═══ */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-[#0a1224]/80 backdrop-blur-xl px-6 py-5 shadow-2xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8ab4ff]">Temporal calibration</span>
              <h3 className="mt-1 text-lg font-extrabold text-white">Chronological Twin State History</h3>
              <p className="mt-1 text-xs text-gray-400">Select a month node to view historical or projected digital twin states</p>
            </div>
            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-400">
              {timelineNodes.length} active cycles
            </span>
          </div>

          <div className="relative flex min-w-0 items-center justify-between overflow-x-auto px-4 py-3 scrollbar-none">
            <div className="absolute left-6 right-6 top-1/2 h-[2px] -translate-y-1/2 bg-white/10" />
            <div
              className="absolute left-6 top-1/2 h-[2px] -translate-y-1/2 bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, (clampedIndex / (timelineNodes.length - 1)) * 95))}%` }}
            />

            {timelineNodes.map((node, index) => {
              const isSelected = clampedIndex === index;
              const size = node.isSimulation ? "h-8 w-8" : node.size === "large" ? "h-6 w-6" : node.size === "medium" ? "h-5 w-5" : "h-4 w-4";
              return (
                <div
                  key={index}
                  className="group relative z-10 flex cursor-pointer flex-col items-center"
                  onClick={() => setSelectedTimelineIndex(index)}
                >
                  <div
                    className={`flex items-center justify-center rounded-full border transition-all duration-300 ${size} ${
                      isSelected
                        ? node.isSimulation
                          ? "scale-110 border-cyan-400 bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)]"
                          : "scale-110 border-blue-400 bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                        : node.isSimulation
                          ? "border-cyan-500/40 bg-[#02050f] text-cyan-400 group-hover:scale-105 group-hover:border-cyan-400"
                          : "border-white/20 bg-[#02050f] text-gray-400 group-hover:scale-105 group-hover:border-blue-400"
                    }`}
                  >
                    {node.isSimulation && <Beaker size={12} />}
                    {!node.isSimulation && isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <span className={`mt-2 text-[9px] font-bold uppercase tracking-tighter transition ${isSelected ? "scale-105 text-white" : "text-gray-500 group-hover:text-gray-300"}`}>
                    {node.label}
                  </span>
                  <span className="mt-0.5 font-mono text-[7px] text-gray-600">{node.year}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ ROW 2: MAIN GRID (Left Biometrics + Right Sidebar) ═══ */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* ═══ LEFT COLUMN (col-span-2): Indicators, Predictions, Charts ═══ */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── HEALTH INDICATORS ── */}
            <div>
              <h2 className="mb-1 text-base font-bold uppercase tracking-widest text-white">Health Indicators</h2>
              <p className="mb-4 text-xs text-gray-500">Core biometric signals from your digital twin</p>
              <div className="grid gap-4 md:grid-cols-3">

                {/* Body Age */}
                <div className="flex flex-col rounded-2xl border bg-[#0a1224] p-5 shadow-lg transition hover:bg-[#0d182e]" style={{ borderColor: `${bodyAgeInfo.color}22` }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Body Age</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[8px] uppercase tracking-widest font-bold text-white ${bodyAgeInfo.bg}`}>{bodyAgeInfo.status}</span>
                  </div>
                  <div className="text-3xl font-extrabold text-white font-mono tabular-nums">
                    {latest.body_age.toFixed(1)}<span className="text-sm text-gray-500 font-normal ml-1.5">/ {latest.age} yrs</span>
                  </div>
                  <div className="mt-3 h-1 rounded-full bg-white/8 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width:`${Math.min(100,(latest.body_age/latest.age)*100)}%`, backgroundColor: bodyAgeInfo.color }}/>
                  </div>
                  <p className="mt-auto pt-3 text-[11px] font-semibold border-t border-white/5" style={{ color: bodyAgeGap<=0?"#4ade80":"#f87171" }}>
                    {bodyAgeGap<=0?"↓":"↑"} {Math.abs(bodyAgeGap).toFixed(1)} yrs vs chronological
                  </p>
                </div>

                {/* Workload */}
                <div className="flex flex-col rounded-2xl border bg-[#0a1224] p-5 shadow-lg transition hover:bg-[#0d182e]" style={{ borderColor: `${workLoadInfo.color}22` }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Workload</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[8px] uppercase tracking-widest font-bold text-white ${workLoadInfo.bg}`}>{workLoadInfo.status}</span>
                  </div>
                  <div className="text-3xl font-extrabold text-white font-mono tabular-nums">
                    {latest.work_load.toFixed(1)}<span className="text-sm text-gray-500 font-normal ml-1.5">/ 100</span>
                  </div>
                  <div className="mt-3 h-1 rounded-full bg-white/8 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width:`${Math.min(100,latest.work_load)}%`, backgroundColor: workLoadInfo.color }}/>
                  </div>
                  <p className="mt-auto pt-3 text-[11px] font-semibold border-t border-white/5" style={{ color: latest.work_load_change<=0?"#4ade80":"#f87171" }}>
                    {latest.work_load_change<=0?"↓":"↑"} {Math.abs(latest.work_load_change).toFixed(1)} vs last period
                  </p>
                </div>

                {/* Body Toxins */}
                <div className="flex flex-col rounded-2xl border bg-[#0a1224] p-5 shadow-lg transition hover:bg-[#0d182e]" style={{ borderColor: `${toxinsInfo.color}22` }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Body Toxins</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[8px] uppercase tracking-widest font-bold text-white ${toxinsInfo.bg}`}>{toxinsInfo.status}</span>
                  </div>
                  <div className="text-3xl font-extrabold text-white font-mono tabular-nums">
                    {latest.body_toxin.toFixed(2)}<span className="text-sm text-gray-500 font-normal ml-1.5">μg/L</span>
                  </div>
                  <div className="mt-3 h-1 rounded-full bg-white/8 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width:`${Math.min(100,latest.body_toxin*10)}%`, backgroundColor: toxinsInfo.color }}/>
                  </div>
                  <p className="mt-auto pt-3 text-[11px] font-semibold border-t border-white/5" style={{ color: latest.body_toxin_change<=0?"#4ade80":"#f87171" }}>
                    {latest.body_toxin_change<=0?"↓":"↑"} {Math.abs(latest.body_toxin_change).toFixed(2)} vs last period
                  </p>
                </div>

              </div>
            </div>

            <hr className="border-white/[0.06]" />

            {/* ── AI PREDICTIONS ── */}
            <div>
              <h2 className="mb-1 text-base font-bold uppercase tracking-widest text-white">AI Predictions</h2>
              <p className="mb-4 text-xs text-gray-500">Projections based on current trends and lifestyle data</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[  
                  { icon: <ShieldAlert style={{ color: injColor }} size={20} />, label: "Injury Risk", val: `${injury.toFixed(0)}%`, pct: injury, color: injColor, text: injText, hasBar: true },
                  { icon: <AlertTriangle style={{ color: chrColor }} size={20} />, label: "Chronic Risk", val: `${chronic.toFixed(0)}%`, pct: chronic, color: chrColor, text: chrText, hasBar: true },
                  { icon: <Clock style={{ color: ageColor }} size={20} />, label: "Predicted Body Age", val: `${predAge.toFixed(1)} yrs`, pct: (predAge/100)*100, color: ageColor, text: ageText, hasBar: false },
                  { icon: <TrendingUp style={{ color: perfColor }} size={20} />, label: "Performance", val: `${perf>0?"+":""}${perf.toFixed(1)}%`, pct: Math.min(100,Math.abs(perf)*10), color: perfColor, text: perfText, hasBar: true }
                ].map((card, i) => (
                  <div key={i} className="flex flex-col rounded-2xl border bg-[#0a1224]/50 backdrop-blur-xl p-5 shadow-xl transition-all duration-300 hover:border-white/[0.12] hover:bg-[#0a1224]/80" style={{ borderColor: `${card.color}22` }}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{card.label}</span>
                      {card.icon}
                    </div>
                    <div className="text-3xl font-extrabold text-white font-mono tabular-nums" style={{ color: card.color }}>{card.val}</div>
                    {card.hasBar && (
                      <div className="mt-3 h-1 rounded-full bg-white/8 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${card.pct}%`, backgroundColor: card.color }}/>
                      </div>
                    )}
                    <p className="mt-auto pt-3 text-[11px] font-medium border-t border-white/5" style={{ color: card.color }}>{card.text}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>{/* End Left Column */}

          {/* ═══ RIGHT COLUMN (col-span-1): Training Simulations Sidebar ═══ */}
          <div className="lg:col-span-1 space-y-6">

            {/* TRAINING SIMULATIONS PANEL */}
            <div className="rounded-3xl border border-white/[0.08] bg-[#0a1224]/50 backdrop-blur-xl p-6 shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Training Simulations</h2>
                  <p className="text-xs text-gray-400 mt-1">Scenario modeling & predictions</p>
                </div>
                <button
                  onClick={() => setIsSimulationActive(!isSimulationActive)}
                  className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                    isSimulationActive 
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
                      : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                  title={isSimulationActive ? "Deactivate simulation" : "Activate simulation"}
                >
                  <Beaker size={20} />
                </button>
              </div>

              {/* Inactive View */}
              {!isSimulationActive && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 mb-4">
                    <Beaker size={32} className="text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-400 mb-4">Activate simulation mode to explore training scenarios</p>
                  <button
                    onClick={() => setIsSimulationActive(true)}
                    className="px-5 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl text-sm font-semibold hover:bg-cyan-500/30 transition"
                  >
                    Enable Simulations
                  </button>
                </div>
              )}

              {/* Active View: Scenario Cards */}
              {isSimulationActive && (
                <div className="space-y-3">
                  {SCENARIO_PRESETS.map((scenario) => (
                    <div
                      key={scenario.id}
                      className={`rounded-2xl border transition-all duration-200 cursor-pointer ${
                        appliedScenario === scenario.id 
                          ? "border-cyan-500/50 bg-cyan-500/[0.06] shadow-[0_0_15px_rgba(6,182,212,0.15)]" 
                          : expandedScenario === scenario.id
                            ? "border-white/20 bg-white/[0.03]"
                            : "border-white/10 bg-white/[0.01] hover:border-white/20"
                      }`}
                      onClick={() => setExpandedScenario(expandedScenario === scenario.id ? null : scenario.id)}
                    >
                      {/* Scenario Header */}
                      <div className="flex items-start gap-3 p-4">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${scenario.iconBg} ${scenario.iconColor}`}>
                          {scenario.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-bold text-white">{scenario.name}</h3>
                            <div className="flex items-center gap-1.5">
                              {appliedScenario === scenario.id && (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                                  Active
                                </span>
                              )}
                              {expandedScenario === scenario.id ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{scenario.description}</p>
                        </div>
                      </div>

                      {/* Expanded Drawer */}
                      {expandedScenario === scenario.id && (
                        <div className="px-4 pb-4 pt-0 border-t border-white/5 mt-0 space-y-4">
                          <div className="pt-3">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Parameters</h4>
                            <div className="space-y-1.5">
                              {scenario.parameters.map((param, pi) => (
                                <div key={pi} className="flex items-center justify-between px-3 py-2 bg-white/[0.02] rounded-lg">
                                  <span className="text-xs text-gray-400">{param.label}</span>
                                  <span className="text-xs font-bold text-white">{param.value} {param.unit}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Predicted Outcomes</h4>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="flex flex-col items-center p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <span className="text-[9px] text-gray-400">Body Age</span>
                                <strong className="text-xs text-blue-400 font-bold">{scenario.outcomes.bodyAge}</strong>
                              </div>
                              <div className="flex flex-col items-center p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                <span className="text-[9px] text-gray-400">Workload</span>
                                <strong className="text-xs text-amber-400 font-bold">{scenario.outcomes.workload}</strong>
                              </div>
                              <div className="flex flex-col items-center p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                <span className="text-[9px] text-gray-400">Toxins</span>
                                <strong className="text-xs text-emerald-400 font-bold">{scenario.outcomes.toxins}</strong>
                              </div>
                            </div>
                          </div>

                          <button
                            className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                              appliedScenario === scenario.id
                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                : "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 hover:from-cyan-500/30 hover:to-blue-500/30"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setAppliedScenario(scenario.id);
                            }}
                          >
                            {appliedScenario === scenario.id ? "✓ Applied" : "Apply Scenario"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Custom Scenario Card */}
                  <div
                    className={`rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
                      appliedScenario === "custom"
                        ? "border-cyan-500/50 bg-cyan-500/[0.06]"
                        : expandedScenario === "custom"
                          ? "border-white/20 bg-white/[0.03]"
                          : "border-white/10 bg-white/[0.01] hover:border-white/20"
                    }`}
                    onClick={() => setExpandedScenario(expandedScenario === "custom" ? null : "custom")}
                  >
                    <div className="flex items-center gap-3 p-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 text-gray-400">
                        <Plus size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-white">Create Custom Scenario</h3>
                          {expandedScenario === "custom" ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">Configure personalized workload parameters</p>
                      </div>
                    </div>

                    {expandedScenario === "custom" && (
                      <div className="px-4 pb-4 pt-0 border-t border-white/5 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="pt-3 space-y-4">
                          {/* Intensity Slider */}
                          <div>
                            <div className="flex justify-between mb-1.5">
                              <span className="text-xs text-gray-400">Intensité d'Entraînement</span>
                              <span className="text-xs font-bold text-white">{customIntensity}%</span>
                            </div>
                            <input
                              type="range" min="50" max="100" step="5" value={customIntensity}
                              onChange={(e) => setCustomIntensity(Number(e.target.value))}
                              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-500"
                            />
                          </div>

                          {/* Frequency Slider */}
                          <div>
                            <div className="flex justify-between mb-1.5">
                              <span className="text-xs text-gray-400">Fréquence Hebdomadaire</span>
                              <span className="text-xs font-bold text-white">{customFrequency} j/sem</span>
                            </div>
                            <input
                              type="range" min="1" max="7" step="1" value={customFrequency}
                              onChange={(e) => setCustomFrequency(Number(e.target.value))}
                              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-500"
                            />
                          </div>

                          {/* Duration Slider */}
                          <div>
                            <div className="flex justify-between mb-1.5">
                              <span className="text-xs text-gray-400">Durée du Programme</span>
                              <span className="text-xs font-bold text-white">{customDuration} sem</span>
                            </div>
                            <input
                              type="range" min="1" max="12" step="1" value={customDuration}
                              onChange={(e) => setCustomDuration(Number(e.target.value))}
                              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-500"
                            />
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Predicted Outcomes</h4>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="flex flex-col items-center p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                              <span className="text-[9px] text-gray-400">Body Age</span>
                              <strong className="text-xs text-blue-400 font-bold">{customOutcomes.bodyAge.toFixed(1)} yrs</strong>
                            </div>
                            <div className="flex flex-col items-center p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                              <span className="text-[9px] text-gray-400">Workload</span>
                              <strong className="text-xs text-amber-400 font-bold">{customOutcomes.workload.toFixed(1)}%</strong>
                            </div>
                            <div className="flex flex-col items-center p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                              <span className="text-[9px] text-gray-400">Toxins</span>
                              <strong className="text-xs text-emerald-400 font-bold">{customOutcomes.toxins.toFixed(1)}</strong>
                            </div>
                          </div>
                        </div>

                        <button
                          className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            appliedScenario === "custom"
                              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                              : "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 hover:from-cyan-500/30 hover:to-blue-500/30"
                          }`}
                          onClick={() => setAppliedScenario("custom")}
                        >
                          {appliedScenario === "custom" ? "✓ Custom Applied" : "Apply Custom Scenario"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SIMULATOR ACTIVITY LOG */}
            {isSimulationActive && consoleLogs.length > 0 && (
              <div className="rounded-3xl border border-white/[0.08] bg-[#0a1224]/50 p-5 backdrop-blur-xl shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Terminal size={16} className="text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">Simulator Activity Log</h3>
                  <span className="ml-auto flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-[10px] text-cyan-400 font-semibold">LIVE</span>
                  </span>
                </div>
                <div className="space-y-1 max-h-[300px] overflow-y-auto font-mono text-[10px] leading-relaxed scrollbar-thin scrollbar-thumb-white/10">
                  {consoleLogs.map((log, i) => (
                    <div key={i} className={`px-2 py-1 rounded ${i === 0 ? "bg-cyan-500/10 text-cyan-300" : "text-gray-500"}`}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>{/* End Right Column */}

        </div>{/* End Main Grid */}

        {/* ═══ ROW 3: AI CLINICAL PROTOCOLS & PROTOCOLS ADVISORY (Full Width) ═══ */}
        <div className="rounded-3xl border border-white/10 bg-[#0a1224]/80 backdrop-blur-xl p-6 md:p-8 shadow-2xl mb-8 relative">
          
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8ab4ff]">AI Medical Board</span>
              <h2 className="text-xl font-extrabold text-white mt-1">Clinical Advisory & Action Protocols</h2>
              <p className="text-xs text-gray-400 mt-1">Personalized therapeutics and circadian wellness protocols.</p>
            </div>
            
            {/* Tabs */}
            <div className="flex bg-white/[0.02] border border-white/5 p-1 rounded-xl">
              {[
                { id: "recommendations", label: "Recommendations" },
                { id: "interventions", label: "Interventions" },
                { id: "action_plan", label: "24H Action Plan" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveClinicalTab(tab.id)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeClinicalTab === tab.id
                      ? "bg-blue-500/20 text-[#8ab4ff] border border-blue-500/35 shadow-md shadow-blue-500/5"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Premium Lock overlay */}
          {!hasPremiumAccess && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-3xl bg-black/75 px-4 text-center backdrop-blur-[6px] border border-[#7da7ff]/20">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 mb-4 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <Lock size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Unlock AI Clinical Recommendations & Protocols</h3>
              <p className="max-w-md text-sm text-gray-300 leading-relaxed mb-6">
                Upgrade to Premium to get tailored clinical suggestives, targeted therapeutic interventions and chronobiological lifestyle action plans compiled by our medical board.
              </p>
              <button 
                onClick={openPremiumSubscription}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-7 py-3 text-sm font-extrabold text-white shadow-xl shadow-blue-500/20 transition hover:-translate-y-0.5 active:scale-95"
              >
                <Sparkles size={16} /> Manage Subscription
              </button>
            </div>
          )}

          {/* Tab Contents */}
          <div className={!hasPremiumAccess ? "pointer-events-none select-none filter blur-[4px]" : ""}>
            {activeClinicalTab === "recommendations" && recommendations.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3 animate-fadeIn">
                {recommendations.map((rec, i) => (
                  <div key={i} className="flex flex-col rounded-2xl border border-blue-500/10 bg-white/[0.01] p-5 shadow-lg hover:bg-white/[0.02] hover:border-blue-500/20 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-widest ${rec.priorityColor}`}>{rec.priority}</span>
                      <span className="text-lg font-extrabold text-white font-mono">{rec.scoreLabel}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2">{rec.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed mb-3">{rec.text}</p>
                    <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3 mt-auto">
                      <p className="text-[11px] text-gray-500 leading-relaxed">{rec.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeClinicalTab === "interventions" && interventions.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3 animate-fadeIn">
                {interventions.map((intv, i) => (
                  <div key={i} className="group flex gap-3 rounded-2xl border border-blue-500/10 bg-white/[0.01] p-5 shadow-lg hover:bg-white/[0.02] hover:border-blue-500/20 transition-all duration-300">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-[#02050f] text-[#8ab4ff] transition-all group-hover:scale-105 group-hover:text-white">
                      {getIcon(intv.icon)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-[#8ab4ff] transition-colors mb-1">{intv.title}</h3>
                      <p className="text-[11px] leading-relaxed text-gray-500">{intv.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeClinicalTab === "action_plan" && actionPlan.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3 animate-fadeIn">
                {actionPlan.map((act, i) => (
                  <div key={i} className="group relative flex flex-col rounded-2xl border border-blue-500/10 bg-white/[0.01] p-5 shadow-lg hover:bg-white/[0.02] hover:border-blue-500/20 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{act.time}</span>
                      <div className="grid h-8 w-8 place-items-center rounded-lg border border-white/5 bg-white/[0.02]">
                        {getIcon(act.icon)}
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">{act.action}</h3>
                    <p className="text-[11px] leading-relaxed text-gray-500">{act.desc}</p>
                    {i < actionPlan.length - 1 && (
                      <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-white/15">
                        <ArrowRight size={16} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ ROW 4: LONGITUDINAL HISTORY CHART (Full Width) ═══ */}
        <div className="rounded-3xl border border-white/10 bg-[#0a1224]/80 backdrop-blur-xl p-6 md:p-8 shadow-2xl mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8ab4ff]">Longitudinal tracking</span>
              <h2 className="text-xl font-extrabold text-white mt-1">Biometric Evolution Chart</h2>
              <p className="text-xs text-gray-400 mt-1">
                Historical trends over consecutive scan cycles
                {isSimulationActive && <span className="ml-2 text-cyan-400 font-semibold">· Simulated target projected</span>}
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All Metrics", colorClass: "border-blue-500/50 text-white shadow-[0_0_12px_rgba(59,130,246,0.15)] bg-blue-500/10" },
                { id: "body_age", label: "Body Age", colorClass: "border-[#FFD700]/50 text-white shadow-[0_0_12px_rgba(255,215,0,0.15)] bg-[#FFD700]/10" },
                { id: "work_load", label: "Workload", colorClass: "border-[#00FF9D]/50 text-white shadow-[0_0_12px_rgba(0,255,157,0.15)] bg-[#00FF9D]/10" },
                { id: "body_toxin", label: "Toxins", colorClass: "border-[#00CCFF]/50 text-white shadow-[0_0_12px_rgba(0,204,255,0.15)] bg-[#00CCFF]/10" }
              ].map((btn) => {
                const isActive = metricFilter === btn.id;
                return (
                  <button 
                    key={btn.id}
                    onClick={() => setMetricFilter(btn.id)}
                    className={`rounded-xl border px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                      isActive 
                        ? btn.colorClass
                        : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plotly Container */}
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#020617]/40 p-2 md:p-4">
            <LazyPlot
              data={plotData}
              layout={{
                autosize: true,
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                font: { color: '#9ca3af', family: 'Manrope, Inter' },
                margin: { l: 40, r: 20, t: 20, b: 40 },
                xaxis: { showgrid: true, gridcolor: 'rgba(255,255,255,0.04)' },
                yaxis: { showgrid: true, gridcolor: 'rgba(255,255,255,0.04)' },
                legend: { orientation: "h", yanchor: "bottom", y: -0.15, xanchor: "center", x: 0.5 }
              }}
              useResizeHandler={true}
              style={{ width: "100%", height: "420px" }}
              config={{ displayModeBar: false }}
            />
          </div>
        </div>

      </div>
    </section>
  );
}
