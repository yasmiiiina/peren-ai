import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { onboardingApi } from "../services/onboarding";
import { digitalTwinApi } from "../services/digitalTwin";
import { useAuth } from "../auth/useAuth";
import {
  clearOnboardingDraft,
  getOnboardingDraft,
  saveOnboardingDraft,
  saveOnboardingResponse,
  setOnboardingCompleted,
} from "../utils/onboarding";
import { computePreventiveHealthRiskScore } from "../utils/riskScore";

const sections = [
  { id: "intentions", title: "Objectif du jumeau digital", subtitle: "Section 1 sur 7", menuLabel: "Objectif du jumeau digital" },
  { id: "personal-info", title: "Informations personnelles", subtitle: "Section 2 sur 7", menuLabel: "Informations personnelles" },
  { id: "context", title: "Localisation et langues", subtitle: "Section 3 sur 7", menuLabel: "Localisation et langues" },
  { id: "acquisition", title: "Source de recommandation", subtitle: "Section 4 sur 7", menuLabel: "Source de recommandation" },
  { id: "general-health", title: "Santé générale", subtitle: "Section 5 sur 7", menuLabel: "Santé générale" },
  { id: "medical-history", title: "Historique médical", subtitle: "Section 6 sur 7", menuLabel: "Historique médical" },
  { id: "medications", title: "Médicaments et allergies", subtitle: "Section 7 sur 7", menuLabel: "Médicaments et allergies" },
];

const initialForm = {
  intentions: [],
  sexAssignedAtBirth: "",
  birthDate: "",
  ethnicity: "",
  weightKg: "",
  heightCm: "",
  bloodType: "",
  dependentsCount: "",

  countryOfBirth: "",
  currentCountry: "",
  currentResidenceDuration: "",
  livedAbroad: "",
  otherCountries: "",
  motherTongue: "",
  homePrimaryLanguage: "",
  spokenLanguagesCount: "",

  partnerReferralName: "",
  heardFrom: "",

  currentConditions: "",
  familyHistoryCategories: [],
  familyHistoryDetails: "",

  hadSurgery: "",
  surgeryType: "",
  surgeryYear: "",
  pregnancyStatus: "",
  hasImplant: "",
  implantType: "",
  hospitalizedInLastFiveYears: "",
  hospitalizationReason: "",
  hospitalizationDuration: "",
  seesSpecialist: "",
  specialistType: "",
  specialistFrequency: "",

  takesPrescriptionMedication: "",
  takesNonPrescriptionMedication: "",
  hasDrugAllergies: "",
  otherMedicationAllergy: "",
};

import {
  intentionOptions,
  sexOptions,
  ethnicityOptions,
  bloodTypeOptions,
  durationOptions,
  countryOptions,
  languageOptions,
  spokenLanguagesCountOptions,
  heardFromOptions,
  familyHistoryOptions,
  MIN_WEIGHT_KG,
  MAX_WEIGHT_KG,
  MIN_HEIGHT_CM,
  MAX_HEIGHT_CM
} from "../utils/constants";

function joinClasses(...classes) {
  return classes.filter(Boolean).join(" ");
}

function toggleListValue(currentValues, value) {
  if (currentValues.includes(value)) {
    return currentValues.filter((currentValue) => currentValue !== value);
  }
  return [...currentValues, value];
}

function normalizeForSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function filterAlphabetic(value) {
  return value.replace(/[^a-zA-ZÀ-ÿ\s\-']/g, "");
}

function filterAlphanumeric(value) {
  return value.replace(/[^a-zA-ZÀ-ÿ0-9\s.,\-']/g, "");
}

function filterNumeric(value) {
  return value.replace(/[^0-9]/g, "");
}

function percentByStep(index) {
  return Math.round(((index + 1) / sections.length) * 100);
}

function isWeightReasonable(value) {
  const weight = Number(value);
  return Number.isFinite(weight) && weight >= MIN_WEIGHT_KG && weight <= MAX_WEIGHT_KG;
}

function isHeightReasonable(value) {
  const height = Number(value);
  return Number.isFinite(height) && height >= MIN_HEIGHT_CM && height <= MAX_HEIGHT_CM;
}

function isBirthDatePlausible(value) {
  if (!value) return false;
  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) return false;

  const today = new Date();
  if (birthDate > today) return false;

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age >= 13 && age <= 120;
}

function calculateBmi(weightKg, heightCm) {
  const weight = Number(weightKg);
  const height = Number(heightCm);
  if (!Number.isFinite(weight) || !Number.isFinite(height) || height <= 0) {
    return null;
  }
  return weight / ((height / 100) * (height / 100));
}

const breakdownMeta = {
  biological: {
    label: "Biologique",
    description: "Marqueurs d'âge biologique et cellulaires",
  },
  medical: {
    label: "Médical",
    description: "Antécédents médicaux et rapports cliniques",
  },
  family: {
    label: "Familial",
    description: "Profil de risque héréditaire et génétique",
  },
  lifestyle: {
    label: "Mode de vie",
    description: "Activité, nutrition et facteurs environnementaux",
  },
  engagement: {
    label: "Engagement",
    description: "Adhésion aux protocoles et participation",
  },
};

function scoreNarrative(score) {
  if (score >= 80) {
    return "Votre profil actuel indique des marqueurs de référence résilients avec une marge de perfectionnement grâce à un suivi préventif.";
  }
  if (score >= 60) {
    return "Votre profil actuel indique des marqueurs métaboliques stables avec une marge d'optimisation clinique de la vitalité physique.";
  }
  if (score >= 40) {
    return "Votre profil montre des signaux de risque préventif élevés. Une adhésion ciblée aux protocoles peut améliorer votre résilience à moyen terme.";
  }
  return "Votre profil indique un risque préventif élevé et bénéficierait d'un suivi clinique structuré et d'une intervention immédiate sur le mode de vie.";
}

function BreakdownRow({ label, description, value }) {
  return (
    <div className="grid items-center gap-4 grid-cols-1 md:grid-cols-[200px_1fr_40px]">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/5 border border-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
          style={{
            width: `${value}%`,
            transition: "width 900ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>
      <p className="text-right text-sm font-semibold text-white font-mono">{value}%</p>
    </div>
  );
}

function RecommendationCard({ title, text }) {
  return (
    <article className="rounded-2xl border border-white/5 bg-[#02050d] p-5 shadow-xl transition hover:bg-[#0d182e] hover:border-white/10">
      <h4 className="text-sm font-bold text-white">{title}</h4>
      <p className="mt-2 text-xs leading-relaxed text-gray-400">{text}</p>
    </article>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, fetchUser } = useAuth();

  const [isCompletedView, setIsCompletedView] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [showValidation, setShowValidation] = useState(false);
  const [countrySearch, setCountrySearch] = useState({
    countryOfBirth: "",
    currentCountry: "",
    otherCountries: "",
  });
  const [languageSearch, setLanguageSearch] = useState({
    motherTongue: "",
    homePrimaryLanguage: "",
  });
  const birthCountrySearchInputRef = useRef(null);
  const currentCountrySearchInputRef = useRef(null);
  const motherTongueSearchInputRef = useRef(null);
  const homePrimaryLanguageSearchInputRef = useRef(null);

  const getQuestionCountForSection = (sectionIndex) => {
    if (sectionIndex === 0) return 1;
    if (sectionIndex === 1) return 7;
    if (sectionIndex === 2) return 7;
    if (sectionIndex === 3) return 2;
    if (sectionIndex === 4) return 3;
    if (sectionIndex === 5) return 5;
    return 4;
  };

  const isQuestionValid = (sectionIndex, currentQuestionIndex) => {
    if (sectionIndex === 0) {
      return form.intentions.length > 0;
    }

    if (sectionIndex === 1) {
      if (currentQuestionIndex === 0) return Boolean(form.sexAssignedAtBirth);
      if (currentQuestionIndex === 1) return isBirthDatePlausible(form.birthDate);
      if (currentQuestionIndex === 2) return Boolean(form.ethnicity);
      if (currentQuestionIndex === 3) return isWeightReasonable(form.weightKg);
      if (currentQuestionIndex === 4) return isHeightReasonable(form.heightCm);
      if (currentQuestionIndex === 5) return Boolean(form.bloodType);
      return Boolean(form.dependentsCount);
    }

    if (sectionIndex === 2) {
      if (currentQuestionIndex === 0) return Boolean(form.countryOfBirth);
      if (currentQuestionIndex === 1) return Boolean(form.currentCountry);
      if (currentQuestionIndex === 2) return Boolean(form.currentResidenceDuration);
      if (currentQuestionIndex === 3) {
        if (!form.livedAbroad) return false;
        if (form.livedAbroad === "oui") return form.otherCountries.trim().length > 0;
        return true;
      }
      if (currentQuestionIndex === 4) return Boolean(form.motherTongue);
      if (currentQuestionIndex === 5) return Boolean(form.homePrimaryLanguage);
      return Boolean(form.spokenLanguagesCount);
    }

    if (sectionIndex === 3) {
      if (currentQuestionIndex === 0) return true;
      return Boolean(form.heardFrom);
    }

    if (sectionIndex === 4) {
      if (currentQuestionIndex === 0) return Boolean(form.currentConditions.trim());
      if (currentQuestionIndex === 1) return form.familyHistoryCategories.length > 0;
      return true;
    }

    if (sectionIndex === 5) {
      if (currentQuestionIndex === 0) {
        if (!form.hadSurgery) return false;
        return form.hadSurgery === "non" || (form.surgeryType.trim() && form.surgeryYear.trim());
      }
      if (currentQuestionIndex === 1) {
        return Boolean(form.pregnancyStatus);
      }
      if (currentQuestionIndex === 2) {
        if (!form.hasImplant) return false;
        return form.hasImplant === "non" || Boolean(form.implantType.trim());
      }
      if (currentQuestionIndex === 3) {
        if (!form.hospitalizedInLastFiveYears) return false;
        return (
          form.hospitalizedInLastFiveYears === "non" ||
          (Boolean(form.hospitalizationReason.trim()) && Boolean(form.hospitalizationDuration.trim()))
        );
      }
      if (!form.seesSpecialist) return false;
      return form.seesSpecialist === "non" || (Boolean(form.specialistType.trim()) && Boolean(form.specialistFrequency.trim()));
    }

    if (currentQuestionIndex === 0) return Boolean(form.takesPrescriptionMedication);
    if (currentQuestionIndex === 1) return Boolean(form.takesNonPrescriptionMedication);
    if (currentQuestionIndex === 2) return Boolean(form.hasDrugAllergies);
    return form.hasDrugAllergies === "non" || Boolean(form.otherMedicationAllergy.trim());
  };

  useEffect(() => {
    if (!user) return;

    if (user.onboarding_completed && !isEditing) {
      setIsCompletedView(true);
    }

    let isMounted = true;
    const hydrateFromDraft = (draft) => {
      if (!draft || !isMounted) return;
      setStarted(Boolean(draft.started));
      const draftStepIndex = Number.isInteger(draft.stepIndex) ? Math.min(Math.max(draft.stepIndex, 0), sections.length - 1) : 0;
      setStepIndex(draftStepIndex);
      const sectionQuestionCount = getQuestionCountForSection(draftStepIndex);
      setQuestionIndex(Number.isInteger(draft.questionIndex) ? Math.min(Math.max(draft.questionIndex, 0), sectionQuestionCount - 1) : 0);
      const nextForm = { ...initialForm, ...(draft.form || {}) };
      if (!nextForm.ethnicity && Array.isArray(draft.form?.ethnicities) && draft.form.ethnicities.length > 0) {
        nextForm.ethnicity = draft.form.ethnicities[0];
      }
      setForm(nextForm);
    };

    const hydrate = async () => {
      try {
        const remoteDraft = await onboardingApi.get();
        if (remoteDraft?.data) {
          hydrateFromDraft(remoteDraft.data);
          return;
        }
      } catch {
        // Fall back to local storage when backend is unavailable.
      }

      const localDraft = getOnboardingDraft(user);
      hydrateFromDraft(localDraft);
    };

    hydrate();
    return () => {
      isMounted = false;
    };
  }, [navigate, user]);

  useEffect(() => {
    if (!user || !started) return;

    const payload = { started, stepIndex, questionIndex, form };
    setSaveStatus("saving");
    const timer = setTimeout(async () => {
      try {
        saveOnboardingDraft(user, payload);
        await onboardingApi.save({ data: payload, is_final: false });
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [form, questionIndex, started, stepIndex, user]);

  const setField = (field, value) => {
    setForm((previousForm) => ({ ...previousForm, [field]: value }));
  };

  const setCountrySearchField = (field, value) => {
    setCountrySearch((previousSearch) => ({ ...previousSearch, [field]: value }));
  };

  const setLanguageSearchField = (field, value) => {
    setLanguageSearch((previousSearch) => ({ ...previousSearch, [field]: value }));
  };

  const getFilteredCountries = (searchValue) => {
    const normalizedSearch = normalizeForSearch(searchValue).trim();
    if (!normalizedSearch) {
      return countryOptions;
    }

    const startsWithMatches = countryOptions.filter((country) => normalizeForSearch(country).startsWith(normalizedSearch));
    if (startsWithMatches.length > 0) {
      return startsWithMatches;
    }

    return countryOptions.filter((country) => normalizeForSearch(country).includes(normalizedSearch));
  };

  const getFilteredLanguages = (searchValue) => {
    const normalizedSearch = normalizeForSearch(searchValue).trim();
    if (!normalizedSearch) {
      return languageOptions;
    }

    const startsWithMatches = languageOptions.filter((language) => normalizeForSearch(language).startsWith(normalizedSearch));
    if (startsWithMatches.length > 0) {
      return startsWithMatches;
    }

    return languageOptions.filter((language) => normalizeForSearch(language).includes(normalizedSearch));
  };

  const setBoundedNumberField = (field, value, maxValue) => {
    if (value === "") {
      setField(field, "");
      return;
    }

    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return;
    }

    if (numericValue > maxValue) {
      setField(field, String(maxValue));
      return;
    }

    setField(field, value);
  };

  const toggleFieldArrayValue = (field, value) => {
    setForm((previousForm) => ({
      ...previousForm,
      [field]: toggleListValue(previousForm[field], value),
    }));
  };

  const isSectionValid = (index) => {
    if (index === 0) {
      return form.intentions.length > 0;
    }

    if (index === 1) {
      return (
        Boolean(form.sexAssignedAtBirth) &&
        isBirthDatePlausible(form.birthDate) &&
        Boolean(form.ethnicity) &&
        isWeightReasonable(form.weightKg) &&
        isHeightReasonable(form.heightCm) &&
        Boolean(form.bloodType) &&
        Boolean(form.dependentsCount)
      );
    }

    if (index === 2) {
      const hasOtherCountries = form.livedAbroad === "non" || (form.livedAbroad === "oui" && form.otherCountries.trim().length > 0);
      return (
        Boolean(form.countryOfBirth) &&
        Boolean(form.currentCountry) &&
        Boolean(form.currentResidenceDuration) &&
        Boolean(form.livedAbroad) &&
        hasOtherCountries &&
        Boolean(form.motherTongue) &&
        Boolean(form.homePrimaryLanguage) &&
        Boolean(form.spokenLanguagesCount)
      );
    }

    if (index === 3) {
      return Boolean(form.heardFrom);
    }

    if (index === 4) {
      return Boolean(form.currentConditions.trim()) && form.familyHistoryCategories.length > 0;
    }

    if (index === 5) {
      const surgeryValid = form.hadSurgery === "non" || (form.hadSurgery === "oui" && form.surgeryType.trim() && form.surgeryYear.trim());
      const implantValid = form.hasImplant === "non" || (form.hasImplant === "oui" && form.implantType.trim());
      const hospitalizationValid =
        form.hospitalizedInLastFiveYears === "non" ||
        (form.hospitalizedInLastFiveYears === "oui" && form.hospitalizationReason.trim() && form.hospitalizationDuration.trim());
      const specialistValid =
        form.seesSpecialist === "non" || (form.seesSpecialist === "oui" && form.specialistType.trim() && form.specialistFrequency.trim());

      return (
        Boolean(form.hadSurgery) &&
        surgeryValid &&
        Boolean(form.pregnancyStatus) &&
        Boolean(form.hasImplant) &&
        implantValid &&
        Boolean(form.hospitalizedInLastFiveYears) &&
        hospitalizationValid &&
        Boolean(form.seesSpecialist) &&
        specialistValid
      );
    }

    const allergyDetailsValid = form.hasDrugAllergies === "non" || Boolean(form.otherMedicationAllergy.trim());
    return (
      Boolean(form.takesPrescriptionMedication) &&
      Boolean(form.takesNonPrescriptionMedication) &&
      Boolean(form.hasDrugAllergies) &&
      allergyDetailsValid
    );
  };

  const isCurrentQuestionValid = useMemo(() => isQuestionValid(stepIndex, questionIndex), [stepIndex, questionIndex, form]);
  const completedSectionsCount = useMemo(
    () => sections.reduce((count, _section, index) => count + (isSectionValid(index) ? 1 : 0), 0),
    [form]
  );
  const totalQuestions = useMemo(
    () => sections.reduce((count, _section, index) => count + getQuestionCountForSection(index), 0),
    []
  );
  const completedQuestions = useMemo(
    () => sections.reduce((count, _section, index) => (index < stepIndex ? count + getQuestionCountForSection(index) : count), 0) + questionIndex,
    [questionIndex, stepIndex]
  );
  const completionPercent = useMemo(
    () => (totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0),
    [completedQuestions, totalQuestions]
  );
  const selectedOtherCountries = useMemo(
    () => String(form.otherCountries || "").split(",").map((country) => country.trim()).filter(Boolean),
    [form.otherCountries]
  );
  const filteredBirthCountries = useMemo(() => getFilteredCountries(countrySearch.countryOfBirth), [countrySearch.countryOfBirth]);
  const filteredCurrentCountries = useMemo(() => getFilteredCountries(countrySearch.currentCountry), [countrySearch.currentCountry]);
  const filteredOtherCountries = useMemo(() => getFilteredCountries(countrySearch.otherCountries), [countrySearch.otherCountries]);
  const filteredMotherTongues = useMemo(() => getFilteredLanguages(languageSearch.motherTongue), [languageSearch.motherTongue]);
  const filteredHomePrimaryLanguages = useMemo(() => getFilteredLanguages(languageSearch.homePrimaryLanguage), [languageSearch.homePrimaryLanguage]);
  const isLastQuestionInFlow = stepIndex === sections.length - 1 && questionIndex === getQuestionCountForSection(stepIndex) - 1;
  const bmi = useMemo(() => calculateBmi(form.weightKg, form.heightCm), [form.weightKg, form.heightCm]);
  const validationMessage = useMemo(() => {
    if (!showValidation || isCurrentQuestionValid) return "";

    if (stepIndex === 1 && questionIndex === 1) {
      return "Veuillez saisir une date de naissance valide (13 a 120 ans, non future).";
    }
    if (stepIndex === 6 && questionIndex === 3 && form.hasDrugAllergies !== "non") {
      return "Veuillez preciser le medicament concerne par l'allergie.";
    }
    return "Veuillez corriger le champ requis pour continuer.";
  }, [form.hasDrugAllergies, isCurrentQuestionValid, questionIndex, showValidation, stepIndex]);
  const previousCompletedQuestionsRef = useRef(completedQuestions);
  const [questionAnimationClass, setQuestionAnimationClass] = useState("question-enter-forward");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [completionError, setCompletionError] = useState("");

  useEffect(() => {
    const previousCompletedQuestions = previousCompletedQuestionsRef.current;

    if (completedQuestions > previousCompletedQuestions) {
      setQuestionAnimationClass("question-enter-forward");
    } else if (completedQuestions < previousCompletedQuestions) {
      setQuestionAnimationClass("question-enter-backward");
    }

    previousCompletedQuestionsRef.current = completedQuestions;
  }, [completedQuestions]);

  const goNext = () => {
    setCompletionError("");
    setShowValidation(true);
    if (!isCurrentQuestionValid) return;

    const questionCount = getQuestionCountForSection(stepIndex);
    if (questionIndex < questionCount - 1) {
      setQuestionIndex((previousIndex) => previousIndex + 1);
      setShowValidation(false);
      return;
    }

    if (stepIndex === sections.length - 1) {
      const allSectionsValid = sections.every((_section, index) => isSectionValid(index));
      if (!allSectionsValid) {
        setCompletionError("Impossible de terminer: certaines sections precedentes sont incompletes.");
        return;
      }

      const finalPayload = { started: true, stepIndex, questionIndex, form };
      onboardingApi.save({ data: finalPayload, is_final: true })
        .then(async () => {
          try {
            await digitalTwinApi.process();
          } catch (err) {
            console.error("Failed to process initial digital twin:", err);
          }
          saveOnboardingResponse(user, form);
          setOnboardingCompleted(user, true);
          clearOnboardingDraft(user);
          if (fetchUser) await fetchUser();
          navigate("/dashboard", { replace: true });
        })
        .catch(() => {
          setCompletionError("Erreur de synchronisation avec le serveur. Veuillez reessayer.");
        });
      return;
    }

    setStepIndex((previousIndex) => previousIndex + 1);
    setQuestionIndex(0);
    setShowValidation(false);
  };

  const goPrevious = () => {
    setCompletionError("");
    if (questionIndex > 0) {
      setQuestionIndex((previousIndex) => previousIndex - 1);
      setShowValidation(false);
      return;
    }

    if (stepIndex === 0) return;

    const previousStep = stepIndex - 1;
    setStepIndex(previousStep);
    setQuestionIndex(getQuestionCountForSection(previousStep) - 1);
    setShowValidation(false);
  };

  if (isCompletedView && !isEditing) {
    const score = computePreventiveHealthRiskScore(form);

    const circumference = 2 * Math.PI * 54;
    const strokeOffset = circumference - (score.final_score / 100) * circumference;

    return (
      <section className="min-h-screen bg-[#02050d] py-10 text-[#c8d6e5] font-sans">
        <div className="mx-auto w-full max-w-[900px] px-4 md:px-8">
          <header className="mb-8 border-b border-white/5 pb-6 text-center">
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
              ✓ ÉVALUATION COMPLÉTÉE
            </span>
            <h1 className="mt-4 text-3xl font-extrabold text-white md:text-4xl">Vos Résultats de l'Intake Clinique</h1>
            <p className="mt-2 text-sm text-gray-400">
              Voici l'analyse détaillée de votre score de santé préventive basée sur vos réponses.
            </p>
          </header>

          <div className="space-y-8">
            {/* Main Score Card */}
            <article className="rounded-3xl border border-white/10 bg-[#0a1224] p-6 shadow-xl md:p-8">
              <div className="grid gap-6 md:grid-cols-[1fr_210px] md:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-white">Votre Score de Santé</h2>
                  <div className="mt-2 flex items-end gap-3">
                    <p className="text-7xl font-black leading-none text-white">{score.final_score}%</p>
                    <p className="pb-2 text-xl text-gray-400 font-semibold">Risque : {
                      score.risk_level === "Low" ? "Faible" : 
                      score.risk_level === "Moderate" ? "Modéré" : 
                      score.risk_level === "Elevated" ? "Élevé" : "Très élevé"
                    }</p>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-gray-300">{scoreNarrative(score.final_score)}</p>
                </div>

                <div className="grid place-items-center">
                  <div className="relative h-[170px] w-[170px]">
                    <svg viewBox="0 0 140 140" className="h-[170px] w-[170px] -rotate-90">
                      <defs>
                        <linearGradient id="scoreRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#00FF9D" />
                        </linearGradient>
                      </defs>
                      <circle cx="70" cy="70" r="54" className="fill-none stroke-white/5" strokeWidth="9" />
                      <circle
                        cx="70"
                        cy="70"
                        r="54"
                        className="fill-none"
                        stroke="url(#scoreRingGrad)"
                        strokeWidth="9"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeOffset}
                        style={{ transition: "stroke-dashoffset 1200ms cubic-bezier(0.16, 1, 0.3, 1)" }}
                      />
                    </svg>
                    <div className="absolute inset-0 grid place-items-center">
                      <p className="text-3xl font-black text-white font-mono">{score.final_score}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* Confidence indicator */}
            <div className="rounded-3xl border border-white/5 bg-[#0a1224] p-6 shadow-xl">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Indice de confiance des données</p>
                <p className="text-sm font-semibold text-white font-mono">{score.confidence}%</p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/5 border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
                  style={{
                    width: `${score.confidence}%`,
                    transition: "width 1000ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              </div>
            </div>

            {/* Editorial score breakdown */}
            <section className="rounded-3xl border border-white/10 bg-[#0a1224] p-6 shadow-xl md:p-8">
              <h3 className="mb-6 text-xs font-bold uppercase tracking-wider text-gray-400">DÉTAIL DU SCORE ÉDITORIAL</h3>
              <div className="space-y-6">
                <BreakdownRow label={breakdownMeta.biological.label} description={breakdownMeta.biological.description} value={score.breakdown.biological} />
                <BreakdownRow label={breakdownMeta.medical.label} description={breakdownMeta.medical.description} value={score.breakdown.medical} />
                <BreakdownRow label={breakdownMeta.family.label} description={breakdownMeta.family.description} value={score.breakdown.family} />
                <BreakdownRow label={breakdownMeta.lifestyle.label} description={breakdownMeta.lifestyle.description} value={score.breakdown.lifestyle} />
                <BreakdownRow label={breakdownMeta.engagement.label} description={breakdownMeta.engagement.description} value={score.breakdown.engagement} />
              </div>
            </section>

            {/* Clinical Insights */}
            <section className="rounded-3xl border border-white/10 bg-[#0a1224] p-6 shadow-xl md:p-8">
              <h2 className="text-lg font-bold text-white mb-4">Analyses Cliniques</h2>
              <div className="space-y-4">
                <article className="rounded-2xl border border-white/5 bg-[#02050d] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-sm font-bold text-white">Optimisation Nutritionnelle</h3>
                    <span className="text-lg leading-none text-gray-400 font-semibold">+</span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-gray-300">
                    Augmentez l'apport en vitamine D en fonction des niveaux d'énergie signalés et des données géographiques d'exposition aux UV. Les niveaux actuels suggèrent une amélioration potentielle de l'efficacité métabolique avec une supplémentation.
                  </p>
                </article>

                <article className="flex items-start justify-between rounded-2xl border border-white/5 bg-[#02050d] p-5">
                  <h3 className="text-sm font-bold text-white">Régulation du Cortisol</h3>
                  <span className="text-lg leading-none text-gray-400 font-semibold">+</span>
                </article>

                <article className="flex items-start justify-between rounded-2xl border border-white/5 bg-[#02050d] p-5">
                  <h3 className="text-sm font-bold text-white">Résilience Cognitive</h3>
                  <span className="text-lg leading-none text-gray-400 font-semibold">+</span>
                </article>
              </div>
            </section>

            {/* Protocols and Recommendations */}
            <section>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">PROTOCOLES & RECOMMANDATIONS</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <RecommendationCard
                  title="Protocole de Thréonate de Magnésium"
                  text="Posologie recommandée de 300 mg, 60 minutes avant le coucher pour améliorer les cycles de sommeil profond."
                />
                <RecommendationCard
                  title="Zone Aérobie de Base (Zone 2)"
                  text="Ciblez 150 minutes par semaine en zone 2 de fréquence cardiaque pour améliorer la densité mitochondriale."
                />
                <RecommendationCard
                  title="Atténuation de la Lumière Bleue"
                  text="Utilisez des filtres optiques ou des lunettes après le coucher du soleil pour préserver la synthèse naturelle de la mélatonine."
                />
              </div>
            </section>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => {
                setIsEditing(true);
                setStarted(true);
                setStepIndex(0);
                setQuestionIndex(0);
              }}
              className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 active:scale-95"
            >
              Modifier mes réponses
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-full border border-white/15 bg-white/5 px-8 py-3 text-sm font-bold text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              Retour au Dashboard
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!started) {
    return (
      <section className="grid min-h-[calc(100vh-92px)] place-items-center bg-[var(--color-page-bg)] px-4 py-8">
        <div className="w-[min(820px,100%)] rounded-[1.5rem] bg-white p-7 shadow-[var(--shadow-card)] md:p-10">
          <p className="mb-4 inline-flex rounded-full bg-[#d6d4d3] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#1b1c1c]">Clinical Intake</p>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-black md:text-5xl">Découvrez votre jumeau numérique</h1>
          <p className="mt-4 text-[1.02rem] leading-relaxed text-[var(--color-text-muted)]">
            Ce questionnaire nous permet de personnaliser votre profil bien-être, de vous proposer des recommandations adaptées et
            de mieux suivre votre évolution dans le temps.
          </p>
          <p className="mt-2 text-[0.95rem] text-[var(--color-text-muted)]">
            Vos données sont protégées et utilisées uniquement dans le cadre de votre accompagnement santé PEREN AI.
          </p>
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="mt-8 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-black to-[#3b3b3b] px-8 py-3.5 text-[0.95rem] font-extrabold text-[var(--color-button-primary-text)] shadow-[var(--shadow-card)]"
          >
            Commencer
          </button>
        </div>
      </section>
    );
  }

  const activeSection = sections[stepIndex];

  const inputClass =
    "mx-auto block w-full max-w-[560px] rounded-2xl border border-black/15 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-black/35 focus:bg-gray-50 shadow-sm";
  const labelClass = "mx-auto mb-1.5 block w-full max-w-[560px] text-center text-[0.97rem] font-bold text-white/90";
  const noteCardClass = "mx-auto mt-4 w-full max-w-[560px] rounded-2xl bg-[#FFFEE1] px-5 py-4 text-left text-[0.98rem] leading-relaxed text-slate-900 border border-yellow-200/50 shadow-sm";
  const centeredFieldClass = "mx-auto w-full max-w-[560px]";
  const noteTextClass = "mx-auto mb-2 w-full max-w-[560px] text-center text-sm text-slate-400";

  return (
    <section className="relative min-h-screen bg-[var(--color-page-bg)] pb-10 pt-4 md:pt-6 overflow-hidden">
      <div className="relative z-10 mx-auto w-full max-w-[1180px] px-3 md:px-6 lg:px-8">
          <div className="space-y-6">
            <header className="px-0 py-2 md:py-4">
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-full bg-[#d6d4d3] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#1b1c1c]">Clinical Intake</span>
                <span className="text-sm font-semibold text-[#8b8b8b]">Step {stepIndex + 1} of {sections.length}</span>
                <span className="text-sm font-semibold text-[#8b8b8b]">• Question {questionIndex + 1}/{getQuestionCountForSection(stepIndex)}</span>
                <span className="text-xs font-semibold text-[#8b8b8b]">
                  • {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "All changes saved" : saveStatus === "error" ? "Save failed" : "Draft mode"}
                </span>
              </div>
              <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-5xl">{activeSection.title}</h1>
              <p className="mt-4 max-w-4xl text-[1.04rem] leading-relaxed text-[var(--color-text-muted)]">
                Veuillez fournir des informations précises pour personnaliser votre plan bien-être avec une précision clinique.
              </p>
            </header>

            <div className="pt-2">
              <div className="mb-2 flex items-center justify-end">
                <span className="text-[0.75rem] font-semibold text-[#8b8b8b]">{completedQuestions}/{totalQuestions}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#d8d8d8]">
                <div className="h-full rounded-full bg-black transition-all" style={{ width: `${completionPercent}%` }} />
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-[var(--color-card-bg)] p-1 shadow-[var(--shadow-card)]">
            <div className="px-5 py-5 md:px-6 md:py-6">
              <div key={`${stepIndex}-${questionIndex}`} className={joinClasses("question-enter", questionAnimationClass)}>
              {stepIndex === 0 && questionIndex === 0 && (
                <div>
                  <p className="mb-2 text-center text-[1rem] text-[var(--color-text-muted)]">Sélectionnez l'objectif principal qui correspond à votre démarche.</p>
                  <p className={joinClasses(labelClass, "mb-6 text-center text-[2rem] font-semibold")}>Qu'attendez-vous de votre jumeau digital ?</p>
                  <div className="mx-auto grid w-full max-w-[560px] gap-3">
                    {intentionOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setField("intentions", [option])}
                        className={joinClasses(
                          "block rounded-[1rem] border px-5 py-4 text-left text-[1rem] font-medium transition-all",
                          form.intentions.includes(option)
                            ? "border-black bg-black text-white"
                            : "border-black/20 bg-[#ececec] text-black hover:bg-[#e5e5e5]"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {stepIndex === 1 && (
                <div className="grid gap-5">
                  {questionIndex === 0 && (
                    <div>
                      <label className={joinClasses(labelClass, "mb-6 text-center text-[2rem] font-semibold")}>Veuillez sélectionner votre genre</label>
                      <p className="mb-2 text-center text-sm text-[var(--color-text-muted)]">Utilisé pour les valeurs de référence biologiques (ex : hormones, analyses).</p>
                      <div className="mx-auto grid w-full max-w-[560px] grid-cols-1 gap-6 md:grid-cols-2">
                        {sexOptions.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setField("sexAssignedAtBirth", option)}
                            className={joinClasses(
                              "flex h-[170px] items-end justify-center rounded-[1.7rem] border px-4 pb-4 transition-all",
                              form.sexAssignedAtBirth === option ? "border-black/30 bg-[#f1f1f1]" : "border-black/15 bg-[#ececec] hover:bg-[#e6e6e6]"
                            )}
                          >
                            <span
                              className={joinClasses(
                                "rounded-full px-10 py-2.5 text-sm font-semibold transition-all",
                                form.sexAssignedAtBirth === option
                                  ? "bg-black text-white"
                                  : "bg-[#d7d7d7] text-black"
                              )}
                            >
                              {option}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {questionIndex === 1 && (
                    <div>
                      <label className={labelClass}>Date de naissance</label>
                      <p className={noteTextClass}>Utilisé pour calculer les analyses et tendances basées sur l'âge</p>
                      <input type="date" max={new Date().toISOString().split("T")[0]} className={inputClass} value={form.birthDate} onChange={(event) => setField("birthDate", event.target.value)} />
                    </div>
                  )}
                  {questionIndex === 2 && (
                    <div>
                      <label className={joinClasses(labelClass, "mb-6 text-center text-[2rem] font-semibold")}>Origine ethnique</label>
                      <p className="mb-2 text-center text-sm text-[var(--color-text-muted)]">Certains marqueurs de santé varient selon les populations.</p>
                      <div className="mx-auto grid w-full max-w-[560px] gap-3">
                        {ethnicityOptions.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setField("ethnicity", option)}
                            className={joinClasses(
                              "rounded-[1rem] border px-5 py-3.5 text-left text-[1rem] font-medium transition-all",
                              form.ethnicity === option
                                ? "border-black bg-black text-white"
                                : "border-black/20 bg-[#ececec] text-black hover:bg-[#e5e5e5]"
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {questionIndex === 3 && (
                    <div>
                      <label className={joinClasses(labelClass, "text-center")}>Quel est votre poids ? (kg) *</label>
                      <input
                        type="number"
                        min={MIN_WEIGHT_KG}
                        max={MAX_WEIGHT_KG}
                        step="0.1"
                        className={joinClasses(inputClass, centeredFieldClass)}
                        placeholder="Ex : 70"
                        value={form.weightKg}
                        onChange={(event) => setBoundedNumberField("weightKg", event.target.value, MAX_WEIGHT_KG)}
                      />
                      <p className={noteCardClass}>
                        <span className="block font-semibold">
                          {bmi
                            ? `Votre IMC actuel est ${bmi.toFixed(2)}.`
                            : "Votre IMC sera calcule des que la taille et le poids sont renseignes."}
                        </span>
                        Nous utilisons cet indice pour personnaliser vos recommandations de prevention.
                      </p>
                      <p className="mt-2 text-center text-xs text-[var(--color-text-muted)]">Valeur attendue : {MIN_WEIGHT_KG} à {MAX_WEIGHT_KG} kg.</p>
                    </div>
                  )}
                  {questionIndex === 4 && (
                    <div>
                      <label className={joinClasses(labelClass, "text-center")}>Quelle est votre taille ? (cm) *</label>
                      <input
                        type="number"
                        min={MIN_HEIGHT_CM}
                        max={MAX_HEIGHT_CM}
                        step="0.1"
                        className={joinClasses(inputClass, centeredFieldClass)}
                        placeholder="Ex : 175"
                        value={form.heightCm}
                        onChange={(event) => setBoundedNumberField("heightCm", event.target.value, MAX_HEIGHT_CM)}
                      />
                      <p className={noteCardClass}>
                        <span className="block font-semibold">Calcul de votre indice de masse corporelle</span>
                        L'IMC est largement utilisé comme indicateur de risque pour le développement ou la prévalence de plusieurs problèmes de santé.
                      </p>
                      <p className="mt-2 text-center text-xs text-[var(--color-text-muted)]">Valeur attendue : {MIN_HEIGHT_CM} à {MAX_HEIGHT_CM} cm.</p>
                    </div>
                  )}
                  {questionIndex === 5 && (
                    <div>
                      <label className={joinClasses(labelClass, "mb-6 text-center text-[2rem] font-semibold")}>Groupe sanguin</label>
                      <p className="mb-2 text-center text-sm text-[var(--color-text-muted)]">Utilisé lorsque pertinent pour les analyses de santé.</p>
                      <div className="mx-auto grid w-full max-w-[560px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {bloodTypeOptions.map((option) => {
                          const isLargeCode = option.length <= 3 && option.includes("+") || option.includes("-");
                          const isSelected = form.bloodType === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setField("bloodType", option)}
                              className={joinClasses(
                                "rounded-[1.1rem] border transition-all",
                                isLargeCode ? "h-[110px]" : "h-[110px]",
                                isSelected ? "border-black bg-black text-white" : "border-black/20 bg-[#ececec] text-black hover:bg-[#e5e5e5]",
                                option === "Je ne sais pas" ? "col-span-1" : ""
                              )}
                            >
                              <span className={joinClasses("font-bold", isLargeCode ? "text-[3.8rem] leading-none" : "text-[1.25rem]")}>{option}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {questionIndex === 6 && (
                    <div>
                      <label className={joinClasses(labelClass, "text-center")}>Nombre d'enfants ou de personnes à charge*</label>
                      <p className="mb-2 text-center text-sm text-[var(--color-text-muted)]">Cela nous aide à comprendre votre contexte de vie.</p>
                      <div className="mx-auto grid w-full max-w-[560px] grid-cols-1 gap-3">
                        {["0", "1", "2", "3", "4+"].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setField("dependentsCount", option)}
                            className={joinClasses(
                              "rounded-[1rem] border px-5 py-3.5 text-center text-[1rem] font-medium transition-all",
                              form.dependentsCount === option
                                ? "border-black bg-black text-white"
                                : "border-black/20 bg-[#ececec] text-black hover:bg-[#e5e5e5]"
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {stepIndex === 2 && (
                <div className="grid gap-5">
                  {questionIndex === 0 && (
                    <div>
                      <label className={labelClass}>Pays de naissance *</label>
                      <p className={noteTextClass}>Veuillez indiquer le pays où vous êtes né(e).</p>
                      <details
                        className={centeredFieldClass}
                        onToggle={(event) => {
                          if (event.currentTarget.open) {
                            birthCountrySearchInputRef.current?.focus();
                            birthCountrySearchInputRef.current?.select();
                          }
                        }}
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl border border-black/15 bg-[#ececec] px-4 py-3 text-slate-900 [&::-webkit-details-marker]:hidden">
                          <span>{form.countryOfBirth || "Sélectionner un pays..."}</span>
                          <span className="text-xs text-slate-500">▼</span>
                        </summary>
                        <div className="mt-2 rounded-2xl border border-black/15 bg-[#ececec] p-1">
                          <input
                            ref={birthCountrySearchInputRef}
                            type="text"
                            className="mb-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/30"
                            placeholder="Tapez une lettre (ex: F, Ca, Mar...)"
                            value={countrySearch.countryOfBirth}
                            onChange={(event) => setCountrySearchField("countryOfBirth", filterAlphabetic(event.target.value).slice(0, 50))}
                          />
                          <div className="max-h-44 overflow-y-auto">
                            {filteredBirthCountries.map((country) => (
                            <button
                              key={country}
                              type="button"
                              onClick={(event) => {
                                setField("countryOfBirth", country);
                                setCountrySearchField("countryOfBirth", "");
                                event.currentTarget.closest("details")?.removeAttribute("open");
                              }}
                              className={joinClasses(
                                "w-full rounded-xl px-4 py-2.5 text-left text-sm transition-all",
                                form.countryOfBirth === country ? "bg-black text-white" : "text-black hover:bg-[#dfdfdf]"
                              )}
                            >
                              {country}
                            </button>
                            ))}
                            {filteredBirthCountries.length === 0 && <p className="px-3 py-3 text-sm text-[var(--color-text-muted)]">Aucun pays trouvé.</p>}
                          </div>
                        </div>
                      </details>
                    </div>
                  )}
                  {questionIndex === 1 && (
                    <div>
                      <label className={labelClass}>Pays de résidence actuel *</label>
                      <details
                        className={centeredFieldClass}
                        onToggle={(event) => {
                          if (event.currentTarget.open) {
                            currentCountrySearchInputRef.current?.focus();
                            currentCountrySearchInputRef.current?.select();
                          }
                        }}
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl border border-black/15 bg-[#ececec] px-4 py-3 text-slate-900 [&::-webkit-details-marker]:hidden">
                          <span>{form.currentCountry || "Sélectionner un pays..."}</span>
                          <span className="text-xs text-slate-500">▼</span>
                        </summary>
                        <div className="mt-2 rounded-2xl border border-black/15 bg-[#ececec] p-1">
                          <input
                            ref={currentCountrySearchInputRef}
                            type="text"
                            className="mb-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/30"
                            placeholder="Tapez une lettre (ex: F, Ca, Mar...)"
                            value={countrySearch.currentCountry}
                            onChange={(event) => setCountrySearchField("currentCountry", filterAlphabetic(event.target.value).slice(0, 50))}
                          />
                          <div className="max-h-44 overflow-y-auto">
                            {filteredCurrentCountries.map((country) => (
                            <button
                              key={country}
                              type="button"
                              onClick={(event) => {
                                setField("currentCountry", country);
                                setCountrySearchField("currentCountry", "");
                                event.currentTarget.closest("details")?.removeAttribute("open");
                              }}
                              className={joinClasses(
                                "w-full rounded-xl px-4 py-2.5 text-left text-sm transition-all",
                                form.currentCountry === country ? "bg-black text-white" : "text-black hover:bg-[#dfdfdf]"
                              )}
                            >
                              {country}
                            </button>
                            ))}
                            {filteredCurrentCountries.length === 0 && <p className="px-3 py-3 text-sm text-[var(--color-text-muted)]">Aucun pays trouvé.</p>}
                          </div>
                        </div>
                      </details>
                    </div>
                  )}
                  {questionIndex === 2 && (
                    <div>
                      <label className={joinClasses(labelClass, "text-center")}>Durée de résidence dans votre pays actuel *</label>
                      <div className="mx-auto grid w-full max-w-[560px] gap-3">
                        {durationOptions.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setField("currentResidenceDuration", option)}
                            className={joinClasses(
                              "rounded-[1rem] border px-5 py-3.5 text-left text-[1rem] font-medium transition-all",
                              form.currentResidenceDuration === option
                                ? "border-black bg-black text-white"
                                : "border-black/20 bg-[#ececec] text-black hover:bg-[#e5e5e5]"
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {questionIndex === 3 && (
                    <div>
                      <label className={labelClass}>Avez-vous vécu dans d'autres pays ?*</label>
                      <p className={noteTextClass}>Veuillez indiquer si vous avez vécu dans d'autres pays que votre pays de résidence actuel.</p>
                      <div className="mx-auto mt-1 grid w-full max-w-[560px] grid-cols-1 gap-3 sm:grid-cols-2">
                        {["oui", "non"].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setField("livedAbroad", value)}
                            className={joinClasses(
                              "rounded-full border px-5 py-2.5 text-center text-[0.95rem] font-semibold uppercase transition-all",
                              form.livedAbroad === value
                                ? "border-black bg-black text-white"
                                : "border-black/20 bg-[#ececec] text-black hover:bg-[#e5e5e5]"
                            )}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                      {form.livedAbroad === "oui" && (
                        <div className="mt-4">
                          <label className={labelClass}>Veuillez indiquer les autres pays dans lesquels vous avez vécu : *</label>
                          <p className={noteTextClass}>Veuillez énumérer les autres pays dans lesquels vous avez vécu, séparés par des virgules.</p>
                          <div className={joinClasses("max-h-56 overflow-y-auto rounded-2xl border border-black/15 bg-[#ececec] p-1", centeredFieldClass)}>
                            <input
                              type="text"
                              className="mb-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/30"
                              placeholder="Tapez une lettre (ex: F, Ca, Mar...)"
                              value={countrySearch.otherCountries}
                              onChange={(event) => setCountrySearchField("otherCountries", filterAlphabetic(event.target.value).slice(0, 50))}
                            />
                            {filteredOtherCountries.map((country) => {
                              const isSelected = selectedOtherCountries.includes(country);
                              return (
                                <button
                                  key={country}
                                  type="button"
                                  onClick={() => {
                                    const nextCountries = toggleListValue(selectedOtherCountries, country);
                                    setField("otherCountries", nextCountries.join(", "));
                                  }}
                                  className={joinClasses(
                                    "mb-1 flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm transition-all last:mb-0",
                                    isSelected ? "bg-black text-white" : "text-black hover:bg-[#dfdfdf]"
                                  )}
                                >
                                  <span>{country}</span>
                                  <span className={joinClasses("text-xs", isSelected ? "opacity-100" : "opacity-0")}>✓</span>
                                </button>
                              );
                            })}
                            {filteredOtherCountries.length === 0 && <p className="px-3 py-3 text-sm text-[var(--color-text-muted)]">Aucun pays trouvé.</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {questionIndex === 4 && (
                    <div>
                      <label className={joinClasses(labelClass, "text-center")}>Langue maternelle*</label>
                      <p className={noteTextClass}>Langue apprise dans la petite enfance.</p>
                      <details
                        className={centeredFieldClass}
                        onToggle={(event) => {
                          if (event.currentTarget.open) {
                            motherTongueSearchInputRef.current?.focus();
                            motherTongueSearchInputRef.current?.select();
                          }
                        }}
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl border border-black/15 bg-[#ececec] px-4 py-3 text-slate-900 [&::-webkit-details-marker]:hidden">
                          <span>{form.motherTongue || "Sélectionner une langue..."}</span>
                          <span className="text-xs text-slate-500">▼</span>
                        </summary>
                        <div className="mt-2 rounded-2xl border border-black/15 bg-[#ececec] p-1">
                          <input
                            ref={motherTongueSearchInputRef}
                            type="text"
                            className="mb-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/30"
                            placeholder="Tapez une langue (ex: Ara, Fra, Ang...)"
                            value={languageSearch.motherTongue}
                            onChange={(event) => setLanguageSearchField("motherTongue", filterAlphabetic(event.target.value).slice(0, 50))}
                          />
                          <div className="max-h-44 overflow-y-auto">
                            {filteredMotherTongues.map((language) => (
                              <button
                                key={language}
                                type="button"
                                onClick={(event) => {
                                  setField("motherTongue", language);
                                  setLanguageSearchField("motherTongue", "");
                                  event.currentTarget.closest("details")?.removeAttribute("open");
                                }}
                                className={joinClasses(
                                  "w-full rounded-xl px-4 py-2.5 text-left text-sm transition-all",
                                  form.motherTongue === language ? "bg-black text-white" : "text-black hover:bg-[#dfdfdf]"
                                )}
                              >
                                {language}
                              </button>
                            ))}
                            {filteredMotherTongues.length === 0 && <p className="px-3 py-3 text-sm text-[var(--color-text-muted)]">Aucune langue trouvée.</p>}
                          </div>
                        </div>
                      </details>
                    </div>
                  )}
                  {questionIndex === 5 && (
                    <div>
                      <label className={joinClasses(labelClass, "text-center")}>Langue principale parlée à la maison*</label>
                      <p className={noteTextClass}>Utilisé pour adapter le contenu et la communication.</p>
                      <details
                        className={centeredFieldClass}
                        onToggle={(event) => {
                          if (event.currentTarget.open) {
                            homePrimaryLanguageSearchInputRef.current?.focus();
                            homePrimaryLanguageSearchInputRef.current?.select();
                          }
                        }}
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl border border-black/15 bg-[#ececec] px-4 py-3 text-slate-900 [&::-webkit-details-marker]:hidden">
                          <span>{form.homePrimaryLanguage || "Sélectionner une langue..."}</span>
                          <span className="text-xs text-slate-500">▼</span>
                        </summary>
                        <div className="mt-2 rounded-2xl border border-black/15 bg-[#ececec] p-1">
                          <input
                            ref={homePrimaryLanguageSearchInputRef}
                            type="text"
                            className="mb-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/30"
                            placeholder="Tapez une langue (ex: Ara, Fra, Ang...)"
                            value={languageSearch.homePrimaryLanguage}
                            onChange={(event) => setLanguageSearchField("homePrimaryLanguage", filterAlphabetic(event.target.value).slice(0, 50))}
                          />
                          <div className="max-h-44 overflow-y-auto">
                            {filteredHomePrimaryLanguages.map((language) => (
                              <button
                                key={language}
                                type="button"
                                onClick={(event) => {
                                  setField("homePrimaryLanguage", language);
                                  setLanguageSearchField("homePrimaryLanguage", "");
                                  event.currentTarget.closest("details")?.removeAttribute("open");
                                }}
                                className={joinClasses(
                                  "w-full rounded-xl px-4 py-2.5 text-left text-sm transition-all",
                                  form.homePrimaryLanguage === language ? "bg-black text-white" : "text-black hover:bg-[#dfdfdf]"
                                )}
                              >
                                {language}
                              </button>
                            ))}
                            {filteredHomePrimaryLanguages.length === 0 && <p className="px-3 py-3 text-sm text-[var(--color-text-muted)]">Aucune langue trouvée.</p>}
                          </div>
                        </div>
                      </details>
                    </div>
                  )}
                  {questionIndex === 6 && (
                    <div>
                      <label className={joinClasses(labelClass, "text-center")}>Nombre de langues parlées*</label>
                      <p className="mb-2 text-center text-sm text-[var(--color-text-muted)]">Veuillez sélectionner le nombre de langues dans lesquelles vous pouvez communiquer.</p>
                      <div className="mx-auto grid w-full max-w-[560px] grid-cols-1 gap-3">
                        {spokenLanguagesCountOptions.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setField("spokenLanguagesCount", option)}
                            className={joinClasses(
                              "rounded-[1rem] border px-5 py-3.5 text-center text-[1rem] font-medium transition-all",
                              form.spokenLanguagesCount === option
                                ? "border-black bg-black text-white"
                                : "border-black/20 bg-[#ececec] text-black hover:bg-[#e5e5e5]"
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {stepIndex === 3 && (
                <div className="grid gap-6">
                  {questionIndex === 0 && (
                    <div>
                      <label className={labelClass}>Recommandé par un partenaire PEREN AI ?</label>
                      <p className={noteTextClass}>Veuillez entrer le nom du partenaire PEREN AI qui vous a recommandé(e), si applicable.</p>
                      <input
                        className={inputClass}
                        placeholder="Nom du partenaire (facultatif)"
                        value={form.partnerReferralName}
                        onChange={(event) => setField("partnerReferralName", filterAlphabetic(event.target.value).slice(0, 50))}
                        maxLength={50}
                      />
                    </div>
                  )}
                  {questionIndex === 1 && (
                    <div>
                      <label className={joinClasses(labelClass, "text-center")}>Comment avez-vous entendu parler de nous ? *</label>
                      <div className="mx-auto grid w-full max-w-[560px] gap-3">
                        {heardFromOptions.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setField("heardFrom", option)}
                            className={joinClasses(
                              "rounded-[1rem] border px-5 py-3.5 text-left text-[1rem] font-medium transition-all",
                              form.heardFrom === option
                                ? "border-black bg-black text-white"
                                : "border-black/20 bg-[#ececec] text-black hover:bg-[#e5e5e5]"
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {stepIndex === 4 && (
                <div className="grid gap-6">
                  {questionIndex === 0 && (
                    <div>
                      <h3 className="text-[1.35rem] font-extrabold tracking-tight text-white">Conditions de santé</h3>
                      <label className={joinClasses(labelClass, "text-center")}>Conditions de santé actuelles ou passées</label>
                      <div className={joinClasses("rounded-xl border border-black/15 bg-[#ececec] p-1 shadow-[var(--shadow-card)]", centeredFieldClass)}>
                        <textarea
                          className="min-h-[150px] w-full rounded-xl border border-transparent bg-[#ececec] px-5 py-4 text-slate-900 outline-none placeholder:text-slate-400"
                          rows={4}
                          value={form.currentConditions}
                          onChange={(event) => setField("currentConditions", filterAlphanumeric(event.target.value).slice(0, 300))}
                          maxLength={300}
                          placeholder="Décrivez les conditions diagnostiquées, chirurgies récentes ou maladies chroniques..."
                        />
                      </div>
                      <p className={noteCardClass}>
                        Cela aide votre jumeau virtuel à comprendre les tendances et les facteurs de risque. Ceci n'est pas un diagnostic médical.
                      </p>
                    </div>
                  )}
                  {questionIndex === 1 && (
                    <div>
                      <h3 className="text-[1.35rem] font-extrabold tracking-tight text-white">Antécédents de santé familiaux</h3>
                      <p className={joinClasses(noteTextClass, "mt-1")}>Famille proche : parents, frères et sœurs, enfants. Sélectionnez toutes les options applicables.</p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {familyHistoryOptions.map((option) => (
                          <label
                            key={option}
                            className={joinClasses(
                              "flex cursor-pointer items-center justify-between rounded-xl px-4 py-4 text-[0.92rem] font-semibold transition-all",
                              form.familyHistoryCategories.includes(option) ? "bg-black text-white" : "bg-white text-[#595959] hover:bg-[#f4f4f4]"
                            )}
                          >
                            <span>{option}</span>
                            <input type="checkbox" checked={form.familyHistoryCategories.includes(option)} onChange={() => toggleFieldArrayValue("familyHistoryCategories", option)} className="h-4 w-4 rounded border-black/20 bg-white/90 accent-black" />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {questionIndex === 2 && (
                    <div>
                      <label className={joinClasses(labelClass, "text-center")}>Détails supplémentaires sur les antécédents familiaux (optionnel)</label>
                      <textarea
                        className={joinClasses(inputClass, centeredFieldClass)}
                        rows={3}
                        value={form.familyHistoryDetails}
                        onChange={(event) => setField("familyHistoryDetails", filterAlphanumeric(event.target.value).slice(0, 300))}
                        maxLength={300}
                      />
                      <p className={noteCardClass}>
                        <span className="mb-1 block font-semibold">Tout ce que vous jugez pertinent.</span>
                        Exemples : « Mère - cancer du sein à 52 ans », « Père - diabète de type 2 », « Frère/Sœur - maladie auto-immune »
                      </p>
                    </div>
                  )}
                </div>
              )}

              {stepIndex === 5 && (
                <div className="grid gap-6">
                  {questionIndex === 0 && (
                    <div>
                      <label className={labelClass}>Avez-vous déjà été opéré(e) ?*</label>
                      <p className={noteTextClass}>Cela inclut toute procédure médicale ou chirurgicale.</p>
                      <div className="mx-auto mt-1 grid w-full max-w-[560px] grid-cols-1 gap-3 sm:grid-cols-2">
                        {["oui", "non"].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setField("hadSurgery", value)}
                            className={joinClasses(
                              "rounded-full border px-5 py-2.5 text-center text-[0.95rem] font-semibold uppercase transition-all",
                              form.hadSurgery === value
                                ? "border-black bg-black text-white"
                                : "border-black/20 bg-[#ececec] text-black hover:bg-[#e5e5e5]"
                            )}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                      {form.hadSurgery === "oui" && (
                        <div className="mt-3 grid grid-cols-2 gap-4 max-[980px]:grid-cols-1">
                          <div>
                            <label className={labelClass}>Type d'intervention chirurgicale</label>
                            <p className={noteTextClass}>Veuillez préciser le type d'intervention chirurgicale que vous avez subi.</p>
                            <input
                              className={inputClass}
                              placeholder="Type d’intervention"
                              value={form.surgeryType}
                              onChange={(event) => setField("surgeryType", filterAlphabetic(event.target.value).slice(0, 50))}
                              maxLength={50}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Année d'intervention</label>
                            <p className={noteTextClass}>Veuillez indiquer l'année de l'intervention (ex. : 2021).</p>
                            <input
                              className={inputClass}
                              placeholder="Année"
                              value={form.surgeryYear}
                              onChange={(event) => setField("surgeryYear", filterNumeric(event.target.value).slice(0, 4))}
                              maxLength={4}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {questionIndex === 1 && (
                    <div>
                      <label className={labelClass}>Êtes-vous actuellement enceinte ?</label>
                      <div className="mx-auto grid w-full max-w-[560px] grid-cols-3 gap-3 max-[700px]:grid-cols-1">
                        {["Oui", "Non", "Non applicable"].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setField("pregnancyStatus", option)}
                            className={joinClasses(
                              "rounded-[1rem] border px-5 py-3 text-center text-[0.95rem] font-medium transition-all",
                              form.pregnancyStatus === option
                                ? "border-black bg-black text-white"
                                : "border-black/20 bg-[#ececec] text-black hover:bg-[#e5e5e5]"
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {questionIndex === 2 && (
                    <div>
                      <label className={labelClass}>Avez-vous des dispositifs médicaux implantés ? Par exemple : pacemaker, pompe à insuline, capteur implantable.*</label>
                      <p className={noteTextClass}>Veuillez indiquer si vous avez des dispositifs médicaux implantés dans votre corps.<br />Cela aide à adapter certaines analyses de santé.</p>
                      <div className="mx-auto mt-1 grid w-full max-w-[560px] grid-cols-1 gap-3 sm:grid-cols-2">
                        {["oui", "non"].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setField("hasImplant", value)}
                            className={joinClasses(
                              "rounded-full border px-5 py-2.5 text-center text-[0.95rem] font-semibold uppercase transition-all",
                              form.hasImplant === value
                                ? "border-black bg-black text-white"
                                : "border-black/20 bg-[#ececec] text-black hover:bg-[#e5e5e5]"
                            )}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                      {form.hasImplant === "oui" && (
                        <div className="mt-3">
                          <label className={labelClass}>Type de dispositif implanté :</label>
                          <p className={noteTextClass}>Veuillez préciser le type de dispositif médical que vous avez implanté.</p>
                          <input
                            className={inputClass}
                            placeholder="Type de dispositif"
                            value={form.implantType}
                            onChange={(event) => setField("implantType", filterAlphabetic(event.target.value).slice(0, 50))}
                            maxLength={50}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {questionIndex === 3 && (
                    <div>
                      <label className={labelClass}>Avez-vous été hospitalisé au cours des 5 dernières années ?*</label>
                      <p className={noteTextClass}>Cela inclut les séjours hospitaliers de nuit pour toute raison.</p>
                      <div className="mx-auto mt-1 grid w-full max-w-[560px] grid-cols-1 gap-3 sm:grid-cols-2">
                        {["oui", "non"].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setField("hospitalizedInLastFiveYears", value)}
                            className={joinClasses(
                              "rounded-full border px-5 py-2.5 text-center text-[0.95rem] font-semibold uppercase transition-all",
                              form.hospitalizedInLastFiveYears === value
                                ? "border-black bg-black text-white"
                                : "border-black/20 bg-[#ececec] text-black hover:bg-[#e5e5e5]"
                            )}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                      {form.hospitalizedInLastFiveYears === "oui" && (
                        <div className="mt-3 grid grid-cols-2 gap-4 max-[980px]:grid-cols-1">
                          <div>
                            <label className={labelClass}>Raison de l'hospitalisation</label>
                            <p className={noteTextClass}>Veuillez décrire brièvement la raison de votre hospitalisation.</p>
                            <input
                              className={inputClass}
                              placeholder="Raison"
                              value={form.hospitalizationReason}
                              onChange={(event) => setField("hospitalizationReason", filterAlphabetic(event.target.value).slice(0, 100))}
                              maxLength={100}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Durée du séjour hospitalier</label>
                            <p className={noteTextClass}>Veuillez indiquer la durée de votre hospitalisation (ex. : 3 jours, 1 semaine).</p>
                            <input
                              className={inputClass}
                              placeholder="Durée"
                              value={form.hospitalizationDuration}
                              onChange={(event) => setField("hospitalizationDuration", filterAlphanumeric(event.target.value).slice(0, 30))}
                              maxLength={30}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {questionIndex === 4 && (
                    <div>
                      <label className={labelClass}>Consultez-vous régulièrement un spécialiste ? *</label>
                      <div className="mx-auto mt-1 grid w-full max-w-[560px] grid-cols-1 gap-3 sm:grid-cols-2">
                        {["oui", "non"].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setField("seesSpecialist", value)}
                            className={joinClasses(
                              "rounded-full border px-5 py-2.5 text-center text-[0.95rem] font-semibold uppercase transition-all",
                              form.seesSpecialist === value
                                ? "border-black bg-black text-white"
                                : "border-black/20 bg-[#ececec] text-black hover:bg-[#e5e5e5]"
                            )}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                      {form.seesSpecialist === "oui" && (
                        <div className="mt-3 grid grid-cols-2 gap-4 max-[980px]:grid-cols-1">
                          <div>
                            <label className={labelClass}>Type de spécialiste :</label>
                            <p className={noteTextClass}>Veuillez préciser le type de spécialiste médical que vous consultez régulièrement.</p>
                            <input
                              className={inputClass}
                              placeholder="Type de spécialiste"
                              value={form.specialistType}
                              onChange={(event) => setField("specialistType", filterAlphabetic(event.target.value).slice(0, 50))}
                              maxLength={50}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Fréquence des consultations spécialisées :</label>
                            <p className={noteTextClass}>Veuillez indiquer à quelle fréquence vous consultez ce spécialiste (ex. : mensuel, tous les 6 mois).</p>
                            <input
                              className={inputClass}
                              placeholder="Fréquence"
                              value={form.specialistFrequency}
                              onChange={(event) => setField("specialistFrequency", filterAlphanumeric(event.target.value).slice(0, 30))}
                              maxLength={30}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {stepIndex === 6 && (
                <div className="grid gap-6">
                  {questionIndex === 0 && (
                    <div>
                      <label className={joinClasses(labelClass, "text-center")}>Prenez-vous actuellement des médicaments sur ordonnance ?</label>
                      <div className="mx-auto mt-1 grid w-full max-w-[560px] grid-cols-1 gap-3 sm:grid-cols-2">
                        {["oui", "non"].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setField("takesPrescriptionMedication", value)}
                            className={joinClasses(
                              "rounded-full border px-5 py-2.5 text-center text-[0.95rem] font-semibold uppercase transition-all",
                              form.takesPrescriptionMedication === value
                                ? "border-black bg-black text-white"
                                : "border-black/20 bg-[#ececec] text-black hover:bg-[#e5e5e5]"
                            )}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                      <p className={noteCardClass}>
                        Ces informations aident à éviter des analyses non pertinentes ou non sécuritaires. Vous pouvez les mettre à jour à tout moment.
                      </p>
                    </div>
                  )}
                  {questionIndex === 1 && (
                    <div>
                      <label className={labelClass}>Prenez-vous régulièrement des médicaments sans ordonnance ?*</label>
                      <p className={noteTextClass}>Exemples : analgésiques, antiallergiques, somnifères.</p>
                      <div className="mx-auto mt-1 grid w-full max-w-[560px] grid-cols-1 gap-3 sm:grid-cols-2">
                        {["oui", "non"].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setField("takesNonPrescriptionMedication", value)}
                            className={joinClasses(
                              "rounded-full border px-5 py-2.5 text-center text-[0.95rem] font-semibold uppercase transition-all",
                              form.takesNonPrescriptionMedication === value
                                ? "border-black bg-black text-white"
                                : "border-black/20 bg-[#ececec] text-black hover:bg-[#e5e5e5]"
                            )}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {questionIndex === 2 && (
                    <div>
                      <label className={labelClass}>Avez-vous des allergies ou des réactions connues à des médicaments ?</label>
                      <div className="mx-auto mt-1 grid w-full max-w-[560px] grid-cols-1 gap-3 sm:grid-cols-2">
                        {["oui", "non"].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              setField("hasDrugAllergies", value);
                              if (value === "non") {
                                setField("otherMedicationAllergy", "");
                              }
                            }}
                            className={joinClasses(
                              "rounded-full border px-5 py-2.5 text-center text-[0.95rem] font-semibold uppercase transition-all",
                              form.hasDrugAllergies === value
                                ? "border-black bg-black text-white"
                                : "border-black/20 bg-[#ececec] text-black hover:bg-[#e5e5e5]"
                            )}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {questionIndex === 3 && (
                    <div>
                      <label className={labelClass}>Autre médicament</label>
                      <p className={noteTextClass}>
                        {form.hasDrugAllergies === "non"
                          ? "Aucun detail requis si vous n'avez pas d'allergies medicamenteuses."
                          : "Entrez le medicament auquel vous etes allergique."}
                      </p>
                      <input
                        className={inputClass}
                        placeholder={form.hasDrugAllergies === "non" ? "Aucune allergie" : "Precisez..."}
                        value={form.otherMedicationAllergy}
                        onChange={(event) => setField("otherMedicationAllergy", filterAlphabetic(event.target.value).slice(0, 50))}
                        maxLength={50}
                        disabled={form.hasDrugAllergies === "non"}
                      />
                    </div>
                  )}
                </div>
              )}
              </div>

              {showValidation && !isCurrentQuestionValid && (
                <p className="mt-6 rounded-xl bg-[#ffefef] px-4 py-3 text-[0.92rem] text-[var(--color-error)]">{validationMessage}</p>
              )}
              {completionError && (
                <p className="mt-4 rounded-xl bg-[#ffefef] px-4 py-3 text-[0.92rem] text-[var(--color-error)]">{completionError}</p>
              )}
            </div>

            <footer className="mt-8 flex flex-col gap-6 px-5 pb-5 pt-2 md:flex-row md:items-center md:justify-between md:px-6 md:pb-6">
              <div className="flex items-center gap-2">
                {sections.map((section, index) => (
                  <span
                    key={section.id}
                    className={joinClasses("h-2.5 w-2.5 rounded-full", stepIndex === index ? "bg-black" : "bg-[#d8d8d8]")}
                  />
                ))}
              </div>

              <div className="ml-auto flex w-full gap-3 md:w-auto">
                <button
                  type="button"
                  onClick={goPrevious}
                  disabled={stepIndex === 0}
                  className={joinClasses(
                    "flex-1 rounded-full border px-6 py-3 text-[0.95rem] font-bold md:flex-none",
                    stepIndex === 0
                      ? "border-black/10 text-[#b0b0b0] cursor-not-allowed"
                      : "border-black/20 text-black hover:bg-[#f2f2f2]"
                  )}
                >
                  Précédent
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className={joinClasses(
                    "flex-1 rounded-full bg-gradient-to-r from-black to-[#3b3b3b] px-7 py-3 text-[0.95rem] font-extrabold text-[var(--color-button-primary-text)] shadow-[var(--shadow-card)] transition-opacity md:flex-none",
                    isCurrentQuestionValid ? "opacity-100" : "opacity-70"
                  )}
                >
                  {isLastQuestionInFlow ? "Terminer" : "Continuer"}
                </button>
              </div>
            </footer>
          </div>
      </div>
      </div>

      <div className="sr-only">Progression {percentByStep(stepIndex)}%</div>
    </section>
  );
}
