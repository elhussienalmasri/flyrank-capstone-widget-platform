// Provider A — ip-api.com. Free, no key, 45 req/min.
// Every provider in this folder exposes the same shape:
//   async lookup(ip) => { country, city } | throws
// so enrichment.service.js can swap/chain them without caring which
// one it's talking to.
import env from '../../config/env.js';

export const name = 'ip-api';

export async function lookup(ip) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.geoProviderTimeoutMs);

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`ip-api responded ${res.status}`);

    const data = await res.json();
    if (data.status !== 'success') throw new Error('ip-api lookup failed');

    return { country: data.country, city: data.city };
  } finally {
    clearTimeout(timeout);
  }
}
