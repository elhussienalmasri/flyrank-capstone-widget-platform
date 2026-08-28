// Thin wrapper around the platform-admin endpoints. Uses the exact
// same Bearer token as every other authenticated call — the admin
// is just a tenant with role === 'admin', not a separate credential.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

async function handleResponse(res) {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.error?.message || 'Something went wrong';
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

function authHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function listAccounts(token) {
  const res = await fetch(`${API_BASE_URL}/api/admin/accounts`, { headers: authHeaders(token) });
  const data = await handleResponse(res);
  return data.accounts;
}

export async function deleteAccount(token, tenantId) {
  const res = await fetch(`${API_BASE_URL}/api/admin/accounts/${tenantId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await handleResponse(res);
}
