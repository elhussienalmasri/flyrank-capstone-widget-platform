// Provider B (fallback) — ipapi.co. ~1,000 free lookups/day, no key.
import env from '../../config/env.js';

export const name = 'ipapi.co';

export async function lookup(ip) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.geoProviderTimeoutMs);

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, { signal: controller.signal });
    if (!res.ok) throw new Error(`ipapi.co responded ${res.status}`);

    const data = await res.json();
    if (data.error) throw new Error(data.reason || 'ipapi.co lookup failed');

    return { country: data.country_name, city: data.city };
  } finally {
    clearTimeout(timeout);
  }
}
