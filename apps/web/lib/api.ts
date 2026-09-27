export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_API_URL ||
  'https://recallradar-api-upim.onrender.com' ||
  'https://nondefinable-samatha-unnimbly.ngrok-free.dev';

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export function apiFetch(pathOrUrl: string, init?: RequestInit): Promise<Response> {
  const url = pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')
    ? pathOrUrl
    : getApiUrl(pathOrUrl);

  const headers = new Headers(init?.headers || {});
  // Bypass ngrok free-tier warning page so browser AJAX/fetch never gets blocked
  if (!headers.has('ngrok-skip-browser-warning')) {
    headers.set('ngrok-skip-browser-warning', 'true');
  }

  return fetch(url, {
    ...init,
    headers,
  });
}
