export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const { headers, ...restOptions } = options ?? {};
  const response = await fetch(url, {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? `Request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

export function authHeaders(token?: string | null): Record<string, string> {
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`
  };
}
