import { API_BASE_HAS_API_PREFIX, API_BASE_URL } from '@/lib/runtime-config';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export type UploadContext = 'AVATAR' | 'GALLERY' | 'PRODUCT' | 'BARBER';

export interface UploadMetadata {
  alt?: string;
  category?: string;
}

export interface UploadResult {
  publicUrl: string;
  objectKey: string;
}

interface PresignResponse {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  headers?: Record<string, string>;
}

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

function getToken(): string | null {
  return localStorage.getItem('cutie_cuts_token');
}

async function apiRequest<T>(path: string, init?: RequestInit, auth = true): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  headers.set('Content-Type', 'application/json');

  if (auth) {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const normalizedPath = API_BASE_HAS_API_PREFIX && path.startsWith('/api/') ? path.slice(4) : path;
  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, { ...init, headers });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json() as { message?: string; error?: string };
      if (body.message) message = body.message;
      else if (body.error) message = body.error;
    } catch { /* ignore */ }
    throw new UploadError(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as T;
}

function validateFile(file: File): void {
  if (!file) {
    throw new UploadError('No file selected');
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new UploadError('Only JPEG, PNG, WebP, and GIF images are allowed');
  }

  if (file.size > MAX_SIZE) {
    throw new UploadError('File must be under 5 MB');
  }

  if (file.size <= 0) {
    throw new UploadError('File is empty');
  }
}

async function requestPresign(
  context: UploadContext,
  file: File,
): Promise<PresignResponse> {
  const body = JSON.stringify({
    context,
    fileName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
  });

  return apiRequest('/api/uploads/presign', { method: 'POST', body });
}

function resolveUploadUrl(uploadUrl: string): string {
  if (/^https?:\/\//i.test(uploadUrl)) {
    return uploadUrl;
  }

  if (typeof window === 'undefined') {
    return uploadUrl;
  }

  const baseOrigin = API_BASE_URL
    ? new URL(API_BASE_URL, window.location.origin).origin
    : window.location.origin;

  return new URL(uploadUrl, baseOrigin).toString();
}

async function putToStorage(uploadUrl: string, file: File, presignHeaders?: Record<string, string>): Promise<void> {
  const headers = new Headers(presignHeaders ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', file.type);
  }

  const response = await fetch(resolveUploadUrl(uploadUrl), {
    method: 'PUT',
    headers,
    body: file,
  });

  if (!response.ok) {
    let detail = '';
    try {
      detail = (await response.text()).trim();
    } catch {
      detail = '';
    }

    const suffix = detail ? `: ${detail.slice(0, 160)}` : '';
    throw new UploadError(`Direct upload to storage failed (${response.status})${suffix}`);
  }
}

export async function confirmUpload(
  context: UploadContext,
  objectKey: string,
  contentType: string,
  fileSize: number,
  metadata?: UploadMetadata,
): Promise<UploadResult> {
  if (context === 'AVATAR') {
    const result = await apiRequest<{ url: string; objectKey: string }>(
      '/api/users/me/avatar/confirm',
      {
        method: 'POST',
        body: JSON.stringify({ objectKey, contentType, fileSize }),
      },
    );
    return { publicUrl: result.url, objectKey: result.objectKey };
  }

  if (context === 'GALLERY') {
    const result = await apiRequest<{ url: string }>(
      '/api/gallery/confirm',
      {
        method: 'POST',
        body: JSON.stringify({
          objectKey,
          contentType,
          fileSize,
          alt: metadata?.alt ?? '',
          category: metadata?.category ?? 'fade',
        }),
      },
    );
    return { publicUrl: result.url, objectKey };
  }

  // BARBER / PRODUCT: no confirm endpoint — return derived URL
  return { publicUrl: '', objectKey };
}

export interface PresignResult {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  contentType: string;
  fileSize: number;
}

export async function uploadToStorage(file: File, context: UploadContext): Promise<PresignResult> {
  validateFile(file);
  const presign = await requestPresign(context, file);
  await putToStorage(presign.uploadUrl, file, presign.headers);
  return {
    uploadUrl: presign.uploadUrl,
    objectKey: presign.objectKey,
    publicUrl: presign.publicUrl,
    contentType: file.type,
    fileSize: file.size,
  };
}

export async function uploadImage(options: {
  file: File;
  context: UploadContext;
  metadata?: UploadMetadata;
  onProgress?: (phase: 'validating' | 'presigning' | 'uploading' | 'confirming' | 'done') => void;
}): Promise<UploadResult> {
  const { file, context, metadata, onProgress } = options;

  onProgress?.('validating');
  validateFile(file);

  onProgress?.('presigning');
  const presign = await requestPresign(context, file);

  onProgress?.('uploading');
  await putToStorage(presign.uploadUrl, file, presign.headers);

  onProgress?.('confirming');
  if (context === 'AVATAR' || context === 'GALLERY') {
    const result = await confirmUpload(context, presign.objectKey, file.type, file.size, metadata);
    onProgress?.('done');
    return result;
  }

  // BARBER / PRODUCT: no confirmation — return presign result
  onProgress?.('done');
  return { publicUrl: presign.publicUrl, objectKey: presign.objectKey };
}
