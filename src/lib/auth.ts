export const authCookieName = 'round-auth';

export function accessPassword() {
  return process.env.ROUND_ACCESS_PASSWORD || 'round2026';
}

export function authToken() {
  return process.env.ROUND_AUTH_TOKEN || 'round-local-session';
}
