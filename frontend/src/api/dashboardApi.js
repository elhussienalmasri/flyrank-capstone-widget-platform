// Thin wrapper around the owner dashboard endpoints:
// aggregate stats + the raw submission list, optionally filtered by widget.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

async function handleResponse(res) {
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
  return { Authorization: `Bearer ${token}` };
}

export async function getOverview(token) {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/overview`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function listSubmissions(token, { widgetId } = {}) {
  const url = new URL(`${API_BASE_URL}/api/dashboard/submissions`);
  if (widgetId) url.searchParams.set('widgetId', widgetId);

  const res = await fetch(url, { headers: authHeaders(token) });
  const data = await handleResponse(res);
  return data.submissions;
}

// Registered accounts from `signup` widgets. There's no separate
// "logins" list — logging in only verifies against an existing
// visitor, it never creates a new one. Optional widgetId filter
// narrows to visitors who signed up through one specific widget.
export async function listVisitors(token, { widgetId } = {}) {
  const url = new URL(`${API_BASE_URL}/api/dashboard/visitors`);
  if (widgetId) url.searchParams.set('widgetId', widgetId);

  const res = await fetch(url, { headers: authHeaders(token) });
  const data = await handleResponse(res);
  return data.visitors;
}

export async function deleteSubmission(token, id) {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/submissions/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (res.status === 204) return;
  await handleResponse(res);
}

export async function deleteVisitor(token, id) {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/visitors/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (res.status === 204) return;
  await handleResponse(res);
}
