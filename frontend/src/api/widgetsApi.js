// Thin wrapper around the widgets endpoints.
// Every call needs the tenant's token, passed in explicitly.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

async function handleResponse(res) {
  if (res.status === 204) return null; // DELETE returns no body
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.error?.message || 'Something went wrong';
    const err = new Error(message);
    err.details = data?.error?.details;
    err.status = res.status;
    throw err;
  }
  return data;
}

function authHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function listWidgets(token) {
  const res = await fetch(`${API_BASE_URL}/api/widgets`, { headers: authHeaders(token) });
  const data = await handleResponse(res);
  return data.widgets;
}

export async function getWidget(token, id) {
  const res = await fetch(`${API_BASE_URL}/api/widgets/${id}`, { headers: authHeaders(token) });
  const data = await handleResponse(res);
  return data.widget;
}

export async function createWidget(token, values) {
  const res = await fetch(`${API_BASE_URL}/api/widgets`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(values),
  });
  const data = await handleResponse(res);
  return data.widget;
}

export async function updateWidget(token, id, values) {
  const res = await fetch(`${API_BASE_URL}/api/widgets/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(values),
  });
  const data = await handleResponse(res);
  return data.widget;
}

export async function deleteWidget(token, id) {
  const res = await fetch(`${API_BASE_URL}/api/widgets/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await handleResponse(res);
}
