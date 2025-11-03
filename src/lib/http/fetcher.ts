import { HttpError } from './errors';

export async function http<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    },
  });

  // Try to parse JSON; gracefully handle empty bodies
  const body = await res
    .json()
    .catch(() => undefined as unknown);

  // Consider standardized shape { success, data, error }
  const isAppError = typeof body === 'object' && body !== null && 'success' in (body as any) && (body as any).success === false;

  if (!res.ok || isAppError) {
    const errorPayload = (isAppError ? (body as any).error : body) ?? undefined;
    throw new HttpError(res.status, errorPayload);
  }

  const data = (body && typeof body === 'object' && 'data' in (body as any)) ? (body as any).data : body;
  return data as T;
}

// export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
//   return http<T>(input, init);
// }

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}


