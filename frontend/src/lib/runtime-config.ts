const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const getConfiguredApiBaseUrl = () => {
  const explicitBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  const legacyBaseUrl = import.meta.env.VITE_API_URL as string | undefined;
  const configured = explicitBaseUrl || legacyBaseUrl;

  if (configured && configured.trim()) {
    const normalizedConfiguredUrl = trimTrailingSlash(configured.trim());

    if (
      typeof window !== 'undefined'
      && window.location.protocol === 'https:'
      && normalizedConfiguredUrl.startsWith('http://')
    ) {
      return '';
    }

    return normalizedConfiguredUrl;
  }

  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return 'http://localhost:8081';
  }


  // No VITE_API_BASE_URL set and not on dev port — use same-origin.
  // Works with nginx proxy or when frontend/backend share origin.
  // If backend is on a different host, set VITE_API_BASE_URL.
  return '';
};

const getBooleanEnv = (value: string | undefined) => value?.trim().toLowerCase() === 'true';

export const API_BASE_URL = getConfiguredApiBaseUrl();
export const API_BASE_HAS_API_PREFIX = API_BASE_URL.endsWith('/api');
export const API_DEBUG = getBooleanEnv(import.meta.env.VITE_API_DEBUG as string | undefined);
