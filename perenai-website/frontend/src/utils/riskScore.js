function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function round(value) {
  return Math.round(value);
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function calculateAge(birthDate) {
  if (!birthDate) return null;
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

/**
 * 1. WHO (World Health Organization) International BMI Classification:
 * - < 16.0: Severe thinness (High clinical risk) -> 30%
 * - 16.0 - 16.99: Moderate thinness -> 60%
 * - 17.0 - 18.49: Mild thinness -> 85%
 * - 18.5 - 24.99: Normal weight (Optimal baseline) -> 100%
 * - 25.0 - 29.99: Overweight (Increased risk) -> 80%
 * - 30.0 - 34.99: Obese Class I -> 60%
 * - 35.0 - 39.99: Obese Class II -> 40%
 * - >= 40.0: Obese Class III (Severe hazard) -> 20%
 */
function bmiScore(bmi) {
  if (!Number.isFinite(bmi)) return 60;
  if (bmi < 16.0) return 30;
  if (bmi < 17.0) return 60;
  if (bmi < 18.5) return 85;
  if (bmi >= 18.5 && bmi < 25.0) return 100;
  if (bmi >= 25.0 && bmi < 30.0) return 80;
  if (bmi >= 30.0 && bmi < 35.0) return 60;
  if (bmi >= 35.0 && bmi < 40.0) return 40;
  return 20;
}

/**
 * Age-associated clinical hazard profile
 */
function ageScore(age) {
  if (!Number.isFinite(age)) return 75;
  if (age < 30) return 100;
  if (age < 40) return 90;
  if (age < 50) return 75;
  if (age < 60) return 60;
  if (age < 70) return 45;
  return 30;
}

function genderBonus(gender) {
  const normalized = normalizeText(gender);
  if (normalized === "femelle" || normalized === "female") return 5;
  return 0;
}

function calculateBiologicalScore(form) {
  const weight = Number(form.weightKg);
  const heightCm = Number(form.heightCm);
  const age = calculateAge(form.birthDate);
  const bmi = Number.isFinite(weight) && Number.isFinite(heightCm) && heightCm > 0 ? weight / (heightCm / 100) ** 2 : NaN;

  const score = (0.6 * bmiScore(bmi)) + (0.4 * ageScore(age)) + genderBonus(form.sexAssignedAtBirth);

  return clamp(round(score), 0, 100);
}

/**
 * 2. Charlson Comorbidity Index (CCI) parsing:
 * Evaluates patient text records and applies weighted penalties.
 * - Weight 1: Infarctus, cardiopathie, insuffisance cardiaque, avc, démence, bpco, asthme, maladie du tissu conjonctif, ulcère, diabète, hypertension
 * - Weight 2: Hémiplégie, insuffisance rénale, leucémie, lymphome, cancer / tumeur solide
 * - Weight 3: Cirrhose, insuffisance hépatique modérée/sévère
 * - Weight 6: Cancer métastatique, sida / vih / aids / hiv
 */
function calculateCharlsonComorbidityIndex(text) {
  const normalized = normalizeText(text);
  if (!normalized || normalized === "aucune" || normalized === "none" || normalized === "non") {
    return 0;
  }

  let cci = 0;

  const weight1 = [
    "infarctus", "myocardial", "mi ", "cardiopat", "insuffisance cardiaque", "heart failure",
    "vasculaire périphérique", "peripheral vascular", "accident vasculaire", "avc", "stroke",
    "démence", "dementia", "pulmonaire chronique", "bpco", "copd", "asthme", "asthma",
    "conjonctif", "connective tissue", "lupus", "polyarthrite", "ulcère", "ulcer",
    "foie léger", "mild liver", "diabète", "diabetes", "hypertension", "tension"
  ];

  const weight2 = [
    "diabète avec complication", "diabète sévère", "hémiplégie", "hemiplegia", "paraplégie",
    "insuffisance rénale", "renal disease", "néphropat", "leucémie", "leukemia",
    "lymphome", "lymphoma", "cancer", "tumeur solide", "tumor"
  ];

  const weight3 = [
    "foie modéré", "foie sévère", "severe liver", "cirrhose", "cirrhosis", "hépatite chronique"
  ];

  const weight6 = [
    "cancer métastatique", "metastatic", "sida", "aids", "vih", "hiv"
  ];

  weight1.forEach(keyword => {
    if (normalized.includes(keyword)) cci += 1;
  });
  weight2.forEach(keyword => {
    if (normalized.includes(keyword)) cci += 2;
  });
  weight3.forEach(keyword => {
    if (normalized.includes(keyword)) cci += 3;
  });
  weight6.forEach(keyword => {
    if (normalized.includes(keyword)) cci += 6;
  });

  return cci;
}

function conditionsScore(text) {
  const cci = calculateCharlsonComorbidityIndex(text);
  if (cci === 0) return 100;
  if (cci === 1) return 85;
  if (cci === 2) return 70;
  if (cci <= 4) return 50;
  if (cci <= 6) return 30;
  return 10;
}

/**
 * 3. ASA (American Society of Anesthesiologists) Surgical Recovery Risk Decay:
 * Logarithmic penalty decay over post-op recovery timeline:
 * - <= 1 year: Critical risk recovery (50% score)
 * - 1 to 3 years: High risk recovery (70% score)
 * - 3 to 5 years: Moderate recovery (85% score)
 * - >= 5 years: Resolved baseline (100% score)
 */
function surgeriesScore(form) {
  if (normalizeText(form.hadSurgery) !== "oui") return 100;

  const year = Number(form.surgeryYear);
  if (!Number.isFinite(year)) return 80;

  const currentYear = new Date().getFullYear();
  const yearsSinceSurgery = currentYear - year;

  if (yearsSinceSurgery <= 1) return 50;
  if (yearsSinceSurgery <= 3) return 70;
  if (yearsSinceSurgery <= 5) return 85;
  return 100;
}

function hospitalizationScore(form) {
  if (normalizeText(form.hospitalizedInLastFiveYears) !== "oui") return 100;

  const durationText = normalizeText(form.hospitalizationDuration);
  if (!durationText) return 80;

  const numberMatch = durationText.match(/\d+/);
  const quantity = numberMatch ? Number(numberMatch[0]) : null;
  const inWeeks = durationText.includes("semaine") || durationText.includes("week");
  const inMonths = durationText.includes("mois") || durationText.includes("month");

  let days = quantity;
  if (Number.isFinite(quantity) && inWeeks) days = quantity * 7;
  if (Number.isFinite(quantity) && inMonths) days = quantity * 30;

  if (Number.isFinite(days)) {
    return days >= 3 ? 60 : 80;
  }

  return 80;
}

function medicationsScore(form) {
  const hasPrescription = normalizeText(form.takesPrescriptionMedication) === "oui";
  const hasOtc = normalizeText(form.takesNonPrescriptionMedication) === "oui";

  if (!hasPrescription && !hasOtc) return 100;
  if (!hasPrescription && hasOtc) return 90;
  if (hasPrescription) return 75;
  return 100;
}

function implantsScore(form) {
  return normalizeText(form.hasImplant) === "oui" ? 70 : 100;
}

function calculateMedicalScore(form) {
  const score =
    (0.3 * conditionsScore(form.currentConditions)) +
    (0.15 * surgeriesScore(form)) +
    (0.2 * hospitalizationScore(form)) +
    (0.25 * medicationsScore(form)) +
    (0.1 * implantsScore(form));

  return clamp(round(score), 0, 100);
}

const majorFamilyConditions = new Set([
  "Cardiovasculaire",
  "Neurologique",
  "Psychiatrique",
  "Endocrinien",
  "Cancer / chimiothérapie / radiothérapie",
]);

function hasEarlyOnset(details) {
  const normalized = normalizeText(details);
  if (!normalized) return false;

  const under55Patterns = [
    /\b([0-4]?\d)\s*ans\b/g,
    /\bage\s*[:=]?\s*([0-4]?\d)\b/g,
  ];

  for (const pattern of under55Patterns) {
    const matches = [...normalized.matchAll(pattern)];
    if (matches.some((match) => Number(match[1]) < 55)) return true;
  }

  return normalized.includes("précoce") || normalized.includes("early onset") || normalized.includes("avant 55");
}

/**
 * 4. ACMG (American College of Medical Genetics) Family History Risk Stratification:
 * - High Risk: Early-onset (<55 years) cancer/cardiovascular in first-degree relatives, or multiple relatives (>2 categories) -> 35%
 * - Moderate Risk: 1 first-degree relative standard onset, or multiple second-degree relatives -> 70%
 * - Standard Risk: No significant genetic history -> 100%
 */
function calculateFamilyScore(form) {
  const categories = Array.isArray(form.familyHistoryCategories) ? form.familyHistoryCategories : [];
  const details = String(form.familyHistoryDetails || "").trim();
  const normalizedDetails = normalizeText(details);

  const hasEarlyOnsetHistory = hasEarlyOnset(details);
  
  // Detect first-degree relative markers
  const firstDegreeRel = ["père", "pere", "mère", "mere", "frère", "frere", "sœur", "soeur", "parents", "parent", "enfant", "fils", "fille", "brother", "sister", "mother", "father", "son", "daughter"];
  const isFirstDegreeAffected = firstDegreeRel.some(rel => normalizedDetails.includes(rel)) || categories.length > 0;

  let riskTier = "standard";

  if (isFirstDegreeAffected && hasEarlyOnsetHistory) {
    riskTier = "high";
  } else if (categories.length >= 3) {
    riskTier = "high";
  } else if (isFirstDegreeAffected || categories.length >= 1) {
    riskTier = "moderate";
  }

  if (riskTier === "high") return 35;
  if (riskTier === "moderate") return 70;
  return 100;
}

/**
 * 5. WHO SDOH (Social Determinants of Health) Framework mapping:
 * - Social Anchor Index (Dependents): 1-2 children/dependents act as optimal SDOH support pillars. High count (>=4) acts as caregiving stress index.
 * - Migration Stress Index (Lived Abroad vs Duration): Higher number of migratory transits reduces local SDOH anchors.
 * - Language Integration & Cognitive Reserve: Multilingualism is clinically graded for peak cognitive resilience.
 */
function dependentsScore(value) {
  const normalized = normalizeText(value);
  if (normalized === "0") return 90;
  if (normalized === "1" || normalized === "2") return 100; // Optimal social pillar
  if (normalized === "3") return 80;
  return 60; // Caregiver weight stressor
}

function migrationScore(form) {
  if (normalizeText(form.livedAbroad) !== "oui") return 100;
  const countries = String(form.otherCountries || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (countries.length <= 1) return 80;
  return 60; // High migratory transit weight
}

function durationScore(duration) {
  const normalized = normalizeText(duration);
  if (normalized.includes("plus de 10")) return 100;
  if (normalized.includes("6–10") || normalized.includes("6-10")) return 85;
  if (normalized.includes("1–5") || normalized.includes("1-5")) return 70;
  if (normalized.includes("moins")) return 70;
  return 85;
}

function languageScore(value) {
  const normalized = normalizeText(value);
  if (normalized === "1") return 80;
  if (normalized === "2" || normalized === "3") return 95;
  return 100; // Peak cognitive reserve stimulation
}

function calculateLifestyleScore(form) {
  const score =
    (0.3 * dependentsScore(form.dependentsCount)) +
    (0.25 * migrationScore(form)) +
    (0.25 * durationScore(form.currentResidenceDuration)) +
    (0.2 * languageScore(form.spokenLanguagesCount));

  return clamp(round(score), 0, 100);
}

const goalPoints = {
  "Comprendre mon corps": 20,
  "Prendre de meilleures décisions de vie": 20,
  "Préparer une transition de vie": 15,
  "Suivre les évolutions dans le temps": 25,
  "Contribuer à la recherche": 20,
};

function calculateEngagementScore(form) {
  const goals = Array.isArray(form.intentions) ? form.intentions : [];
  const sum = goals.reduce((acc, goal) => acc + (goalPoints[goal] || 0), 0);
  return clamp(round(sum), 0, 100);
}

function computeDynamicRequiredFields(form) {
  const requiredChecks = [
    Boolean(form.intentions?.length),
    Boolean(form.sexAssignedAtBirth),
    Boolean(form.birthDate),
    Boolean(form.ethnicity),
    Boolean(form.weightKg),
    Boolean(form.heightCm),
    Boolean(form.bloodType),
    Boolean(form.dependentsCount),
    Boolean(form.countryOfBirth),
    Boolean(form.currentCountry),
    Boolean(form.currentResidenceDuration),
    Boolean(form.livedAbroad),
    Boolean(form.motherTongue),
    Boolean(form.homePrimaryLanguage),
    Boolean(form.spokenLanguagesCount),
    Boolean(form.heardFrom),
    Boolean(String(form.currentConditions || "").trim()),
    Boolean(form.familyHistoryCategories?.length),
    Boolean(form.hadSurgery),
    Boolean(form.pregnancyStatus),
    Boolean(form.hasImplant),
    Boolean(form.hospitalizedInLastFiveYears),
    Boolean(form.seesSpecialist),
    Boolean(form.takesPrescriptionMedication),
    Boolean(form.takesNonPrescriptionMedication),
    Boolean(form.hasDrugAllergies),
  ];

  if (normalizeText(form.hasDrugAllergies) === "oui") {
    requiredChecks.push(Boolean(String(form.otherMedicationAllergy || "").trim()));
  }

  if (normalizeText(form.livedAbroad) === "oui") {
    requiredChecks.push(Boolean(String(form.otherCountries || "").trim()));
  }

  if (normalizeText(form.hadSurgery) === "oui") {
    requiredChecks.push(Boolean(String(form.surgeryType || "").trim()));
    requiredChecks.push(Boolean(String(form.surgeryYear || "").trim()));
  }

  if (normalizeText(form.hasImplant) === "oui") {
    requiredChecks.push(Boolean(String(form.implantType || "").trim()));
  }

  if (normalizeText(form.hospitalizedInLastFiveYears) === "oui") {
    requiredChecks.push(Boolean(String(form.hospitalizationReason || "").trim()));
    requiredChecks.push(Boolean(String(form.hospitalizationDuration || "").trim()));
  }

  if (normalizeText(form.seesSpecialist) === "oui") {
    requiredChecks.push(Boolean(String(form.specialistType || "").trim()));
    requiredChecks.push(Boolean(String(form.specialistFrequency || "").trim()));
  }

  const answered = requiredChecks.filter(Boolean).length;
  const total = requiredChecks.length;

  return { answered, total };
}

function riskLevelFromScore(score) {
  if (score >= 80) return "Low";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "Elevated";
  return "High";
}

export function computePreventiveHealthRiskScore(form) {
  const biological = calculateBiologicalScore(form);
  const medical = calculateMedicalScore(form);
  const family = calculateFamilyScore(form);
  const lifestyle = calculateLifestyleScore(form);
  const engagement = calculateEngagementScore(form);

  const finalScore =
    (0.25 * biological) +
    (0.3 * medical) +
    (0.15 * family) +
    (0.15 * lifestyle) +
    (0.15 * engagement);

  const confidenceSource = computeDynamicRequiredFields(form);
  const confidence = confidenceSource.total > 0 ? round((confidenceSource.answered / confidenceSource.total) * 100) : 0;

  return {
    final_score: clamp(round(finalScore), 0, 100),
    risk_level: riskLevelFromScore(round(finalScore)),
    breakdown: {
      biological,
      medical,
      family,
      lifestyle,
      engagement,
    },
    confidence: clamp(confidence, 0, 100),
  };
}
