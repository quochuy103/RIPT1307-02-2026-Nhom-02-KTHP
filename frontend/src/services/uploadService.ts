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

interface ImageUploadResponse {
  imageUrl: string;
  objectKey: string;
  bucket: string;
  contentType: string;
  sizeBytes: number;
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
  // Only set JSON content type if not already set (multipart sets its own boundary)
  if (!headers.has('Content-Type') && !(init?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

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

async function uploadMultipart(file: File, context: UploadContext): Promise<ImageUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('context', context);

  return apiRequest('/api/uploads/image', {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type header — browser sets it with multipart boundary
  });
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

  // BARBER / PRODUCT: no confirm endpoint — return the imageUrl
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
  const result = await uploadMultipart(file, context);
  return {
    uploadUrl: result.imageUrl, // no longer used for PUT, kept for backward compat
    objectKey: result.objectKey,
    publicUrl: result.imageUrl,
    contentType: result.contentType,
    fileSize: result.sizeBytes,
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

  onProgress?.('uploading');
  const result = await uploadMultipart(file, context);

  onProgress?.('confirming');
  if (context === 'AVATAR' || context === 'GALLERY') {
    const confirmed = await confirmUpload(context, result.objectKey, result.contentType, result.sizeBytes, metadata);
    onProgress?.('done');
    return confirmed;
  }

  // BARBER / PRODUCT: no confirmation — return upload result
  onProgress?.('done');
  return { publicUrl: result.imageUrl, objectKey: result.objectKey };
}
