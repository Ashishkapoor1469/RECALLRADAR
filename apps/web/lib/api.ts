export const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_API_URL || 'https://recallradar-api-upim.onrender.com';

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

