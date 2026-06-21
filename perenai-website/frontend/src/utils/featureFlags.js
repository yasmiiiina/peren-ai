// Feature flag manager matching the Excel specification
// Permet d'activer ou désactiver des fonctionnalités selon le profil de l'utilisateur.

export const PROFILE_DETAILS = {
  individu: { label: "Individu", group: "Individuel (B2C)" },
  athlete: { label: "Athlète", group: "Individuel (B2C)" },
  patient: { label: "Patient", group: "Individuel (B2C)" },
  medecin: { label: "Médecin", group: "Professionnel (B2B2C)" },
  lab: { label: "Laboratoire", group: "Professionnel (B2B2C)" },
  recherche: { label: "Centre de Recherche", group: "Professionnel (B2B)" },
  pharma: { label: "Pharma", group: "Professionnel (B2B)" },
};

export const FEATURES = {
  dashboard: { label: "Jumeau Numérique / Dashboard", description: "Accès au dashboard principal avec l'avatar 3D du corps" },
  onboarding: { label: "Assessment Santé / Questionnaire", description: "Questionnaire d'onboarding complet" },
  facescan: { label: "Face Scan", description: "Simulation de scan facial et wellness score" },
  blood_test: { label: "Test Sanguin & Lab Locator", description: "Choix du test, carte des labos, téléchargement des résultats" },
  wearables: { label: "Connecter Wearable", description: "Synchronisation de capteurs Apple, Oura, Garmin" },
  add_doctor_lab: { label: "Ajout médecin / labo", description: "Liaison d'un médecin ou laboratoire partenaire" },
  doctor_dashboard: { label: "Espace Médecin (Backoffice B2B)", description: "Gestion des patients, simulations d'impact et rapports" },
  lab_dashboard: { label: "Espace Labo (Backoffice B2B)", description: "Réception des commandes, saisie des bilans" },
  research_dashboard: { label: "Espace Recherche (B2B)", description: "Génération de cohortes et téléchargement de datasets" },
  pharma_dashboard: { label: "Espace Pharma (B2B)", description: "Simulations populationnelles et études d'impact" }
};

export const DEFAULT_FLAGS = {
  individu: {
    dashboard: true,
    onboarding: true,
    facescan: true,
    blood_test: true,
    wearables: true,
    add_doctor_lab: true,
    doctor_dashboard: false,
    lab_dashboard: false,
    research_dashboard: false,
    pharma_dashboard: false,
  },
  athlete: {
    dashboard: true,
    onboarding: true,
    facescan: true,
    blood_test: true,
    wearables: true,
    add_doctor_lab: true, // Peut ajouter médecin / coachs
    doctor_dashboard: false,
    lab_dashboard: false,
    research_dashboard: false,
    pharma_dashboard: false,
  },
  patient: {
    dashboard: true,
    onboarding: true,
    facescan: true,
    blood_test: true,
    wearables: true,
    add_doctor_lab: true,
    doctor_dashboard: false,
    lab_dashboard: false,
    research_dashboard: false,
    pharma_dashboard: false,
  },
  medecin: {
    dashboard: true, // Affiche la liste des patients et analyses
    onboarding: false,
    facescan: true, // Partage/visualisation du scan patient
    blood_test: false,
    wearables: false,
    add_doctor_lab: false,
    doctor_dashboard: true,
    lab_dashboard: false,
    research_dashboard: false,
    pharma_dashboard: false,
  },
  lab: {
    dashboard: false,
    onboarding: false,
    facescan: false,
    blood_test: true, // Saisie et localisation
    wearables: false,
    add_doctor_lab: false,
    doctor_dashboard: false,
    lab_dashboard: true,
    research_dashboard: false,
    pharma_dashboard: false,
  },
  recherche: {
    dashboard: false,
    onboarding: false,
    facescan: false,
    blood_test: false,
    wearables: false,
    add_doctor_lab: false,
    doctor_dashboard: false,
    lab_dashboard: false,
    research_dashboard: true,
    pharma_dashboard: false,
  },
  pharma: {
    dashboard: false,
    onboarding: false,
    facescan: false,
    blood_test: false,
    wearables: false,
    add_doctor_lab: false,
    doctor_dashboard: false,
    lab_dashboard: false,
    research_dashboard: false,
    pharma_dashboard: true,
  }
};

const STORAGE_KEY = "peren_profile_feature_flags";

export function getFeatureFlags() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FLAGS));
    return DEFAULT_FLAGS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return DEFAULT_FLAGS;
  }
}

export function saveFeatureFlags(flags) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
}

export function resetFeatureFlags() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FLAGS));
  return DEFAULT_FLAGS;
}

export function isFeatureEnabled(profileType, featureName) {
  const flags = getFeatureFlags();
  const profile = profileType || "individu";
  if (!flags[profile]) return false;
  return !!flags[profile][featureName];
}
