export const BACKEND_HTTP = process.env.NEXT_PUBLIC_BACKEND_HTTP || 'http://localhost:4000';
export const BACKEND_WS = process.env.NEXT_PUBLIC_BACKEND_WS || 'http://localhost:4000';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_HTTP}${path}`, { cache: 'no-store', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}