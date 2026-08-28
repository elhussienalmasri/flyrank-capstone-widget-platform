// IP -> geo enrichment with a fallback chain: try provider A, then
// provider B on failure. If both are down, return null — the
// submission still gets stored, just without geo data. Degrade,
// never fail the request over this.
import * as ipApiProvider from '../providers/geo/ipApiProvider.js';
import * as ipapiCoProvider from '../providers/geo/ipapiCoProvider.js';

// Tests inject a different chain via the `providers` param (see
// tests/enrichment.test.js) so the fallback is deterministic and
// never touches the real network.
const defaultProviders = [ipApiProvider, ipapiCoProvider];

export async function enrich(ip, providers = defaultProviders) {
  if (!ip || ip === '::1' || ip === '127.0.0.1') {
    // Local/dev requests have no meaningful public IP to look up.
    return { country: null, city: null, provider: null };
  }

  for (const provider of providers) {
    try {
      const { country, city } = await provider.lookup(ip);
      return { country, city, provider: provider.name };
    } catch (err) {
      console.warn(`[enrichment] provider "${provider.name}" failed: ${err.message}`);
      // fall through to the next provider
    }
  }

  // Every provider failed — degrade gracefully.
  return { country: null, city: null, provider: null };
}
