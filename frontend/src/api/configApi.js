// Public feature flags — no auth token needed.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export async function getConfig() {
  const res = await fetch(`${API_BASE_URL}/api/config`);
  if (!res.ok) throw new Error('Failed to load platform config');
  return res.json();
}
