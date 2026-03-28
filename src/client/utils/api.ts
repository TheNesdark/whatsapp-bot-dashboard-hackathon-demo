const PASSWORD_STORAGE = 'dashboard_password';

export function getPassword(): string {
    return localStorage.getItem(PASSWORD_STORAGE) || '';
}

export function savePassword(password: string): void {
    localStorage.setItem(PASSWORD_STORAGE, password);
}

export function clearPassword(): void {
    localStorage.removeItem(PASSWORD_STORAGE);
}

/**
 * Wrapper around fetch that automatically injects x-api-key header.
 * Throws an ApiUnauthorizedError if the server responds with 401.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const password = getPassword();
  const headers = new Headers(options.headers);
  if (password) headers.set('x-api-key', password);
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    throw new ApiUnauthorizedError();
  }
  if (!res.ok && res.status >= 500) {
    throw new Error(`Server error: ${res.status} ${res.statusText}`);
  }
  return res;
}

/** Llama a apiFetch, parsea JSON y lanza si !res.ok. Útil para GET y mutaciones. */
export async function apiFetchOk<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const res = await apiFetch(url, options);
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

export class ApiUnauthorizedError extends Error {
    constructor() {
        super('Unauthorized');
        this.name = 'ApiUnauthorizedError';
    }
}
