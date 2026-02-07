import { DEVICE_ID_KEY, TRIAL_START_KEY, TRIAL_DURATION_DAYS } from './constants';

export function getOrCreateDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
    // Record trial start date on first visit
    localStorage.setItem(TRIAL_START_KEY, new Date().toISOString());
  }
  // Migration: existing users without a trial start date get one now
  if (!localStorage.getItem(TRIAL_START_KEY)) {
    localStorage.setItem(TRIAL_START_KEY, new Date().toISOString());
  }
  return id;
}

/**
 * Get the number of days remaining in the trial.
 * Returns 0 if trial has expired or no start date recorded.
 */
export function getTrialDaysRemaining() {
  const startStr = localStorage.getItem(TRIAL_START_KEY);
  if (!startStr) return 0;
  const start = new Date(startStr);
  const now = new Date();
  const elapsed = (now - start) / (1000 * 60 * 60 * 24);
  const remaining = TRIAL_DURATION_DAYS - elapsed;
  return Math.max(0, Math.ceil(remaining));
}

/**
 * Check if the user is currently within their trial period.
 */
export function isTrialActive() {
  return getTrialDaysRemaining() > 0;
}
