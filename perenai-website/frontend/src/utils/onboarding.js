const ONBOARDING_COMPLETED_PREFIX = "peren_onboarding_completed";
const ONBOARDING_DRAFT_PREFIX = "peren_onboarding_draft";
const ONBOARDING_RESPONSE_PREFIX = "peren_onboarding_response";

export function buildUserKey(user) {
  if (!user) return "anonymous";
  if (user.id !== undefined && user.id !== null) return String(user.id);
  if (user.email) return String(user.email).toLowerCase();
  return "anonymous";
}

function completedStorageKey(user) {
  return `${ONBOARDING_COMPLETED_PREFIX}:${buildUserKey(user)}`;
}

function draftStorageKey(user) {
  return `${ONBOARDING_DRAFT_PREFIX}:${buildUserKey(user)}`;
}

function responseStorageKey(user) {
  return `${ONBOARDING_RESPONSE_PREFIX}:${buildUserKey(user)}`;
}

export function isOnboardingCompleted(user) {
  return localStorage.getItem(completedStorageKey(user)) === "true";
}

export function setOnboardingCompleted(user, completed = true) {
  localStorage.setItem(completedStorageKey(user), completed ? "true" : "false");
}

export function saveOnboardingDraft(user, draft) {
  localStorage.setItem(draftStorageKey(user), JSON.stringify(draft));
}

export function getOnboardingDraft(user) {
  const rawDraft = localStorage.getItem(draftStorageKey(user));
  if (!rawDraft) return null;

  try {
    return JSON.parse(rawDraft);
  } catch {
    return null;
  }
}

export function clearOnboardingDraft(user) {
  localStorage.removeItem(draftStorageKey(user));
}

export function saveOnboardingResponse(user, response) {
  localStorage.setItem(responseStorageKey(user), JSON.stringify(response));
}

export function getOnboardingResponse(user) {
  const rawResponse = localStorage.getItem(responseStorageKey(user));
  if (!rawResponse) return null;

  try {
    return JSON.parse(rawResponse);
  } catch {
    return null;
  }
}

export function clearOnboardingResponse(user) {
  localStorage.removeItem(responseStorageKey(user));
}
