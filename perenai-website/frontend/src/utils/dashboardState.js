import { buildUserKey } from "./onboarding";

const BLOOD_TEST_COMPLETED_PREFIX = "peren_blood_test_completed";
const FACE_SCAN_COMPLETED_PREFIX = "peren_face_scan_completed";
const WEARABLE_CONNECTION_PREFIX = "peren_wearable_connection";

export function isBloodTestCompleted(user) {
  const key = `${BLOOD_TEST_COMPLETED_PREFIX}:${buildUserKey(user)}`;
  return localStorage.getItem(key) === "true";
}

export function setBloodTestCompleted(user, completed = true) {
  const key = `${BLOOD_TEST_COMPLETED_PREFIX}:${buildUserKey(user)}`;
  localStorage.setItem(key, completed ? "true" : "false");
}

export function isFaceScanCompleted(user) {
  const key = `${FACE_SCAN_COMPLETED_PREFIX}:${buildUserKey(user)}`;
  return localStorage.getItem(key) === "true";
}

export function setFaceScanCompleted(user, completed = true) {
  const key = `${FACE_SCAN_COMPLETED_PREFIX}:${buildUserKey(user)}`;
  localStorage.setItem(key, completed ? "true" : "false");
}

export function getWearableConnection(user, id) {
  const key = `${WEARABLE_CONNECTION_PREFIX}:${buildUserKey(user)}:${id}`;
  return localStorage.getItem(key) || "disconnected";
}

export function setWearableConnection(user, id, status) {
  const key = `${WEARABLE_CONNECTION_PREFIX}:${buildUserKey(user)}:${id}`;
  localStorage.setItem(key, status);
}

export function isAnyWearableConnected(user) {
  const ids = ["apple-health", "oura", "garmin"];
  return ids.some((id) => getWearableConnection(user, id) === "connected");
}
