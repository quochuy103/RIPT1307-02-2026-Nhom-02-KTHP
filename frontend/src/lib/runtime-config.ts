const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const getConfiguredApiBaseUrl = () => {
  const explicitBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  const legacyBaseUrl = import.meta.env.VITE_API_URL as string | undefined;
  const configured = explicitBaseUrl || legacyBaseUrl;

  if (configured && configured.trim()) {
    return trimTrailingSlash(configured.trim());
  }

  if (typeof window !== 'undefined' && window.location.port === '8080') {
    return 'http://localhost:8081';
  }

  return '';
};

const getBooleanEnv = (value: string | undefined) => value?.trim().toLowerCase() === 'true';

export const API_BASE_URL = getConfiguredApiBaseUrl();
export const API_BASE_HAS_API_PREFIX = API_BASE_URL.endsWith('/api');
export const API_DEBUG = getBooleanEnv(import.meta.env.VITE_API_DEBUG as string | undefined);
