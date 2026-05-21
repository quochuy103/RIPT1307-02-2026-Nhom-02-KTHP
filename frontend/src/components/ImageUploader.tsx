import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, X } from 'lucide-react';

interface PresignResponse {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  expiresInSeconds: number;
  headers: Record<string, string>;
}

interface ImageUploaderProps {
  context: 'BARBER' | 'GALLERY' | 'PRODUCT' | 'AVATAR';
  currentUrl?: string;
  onUploaded: (publicUrl: string, objectKey: string) => void;
  onError?: (message: string) => void;
}

const MAX_SIZE = 5 * 1024 * 1024;

export default function ImageUploader({ context, currentUrl, onUploaded, onError }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(currentUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > MAX_SIZE) {
      onError?.('File must be under 5 MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      onError?.('Only JPEG, PNG, WebP, and GIF images are allowed');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('cutie_cuts_token');

      const presignRes = await fetch('http://localhost:8081/api/uploads/presign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          context,
          fileName: file.name,
          contentType: file.type,
          sizeBytes: file.size,
        }),
      });

      if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => ({}));
        throw new Error(err.message || err.error || `Presign failed (${presignRes.status})`);
      }

      const presign = (await presignRes.json()) as PresignResponse;

      const uploadRes = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Direct upload to storage failed (${uploadRes.status})`);
      }

      setPreview(presign.publicUrl);
      onUploaded(presign.publicUrl, presign.objectKey);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      onError?.(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {preview && (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="h-24 w-24 rounded-lg object-cover border border-border"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <button
            type="button"
            className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-0.5"
            onClick={() => setPreview(undefined)}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-1 h-4 w-4" />
          )}
          {uploading ? 'Uploading...' : preview ? 'Change Image' : 'Upload Image'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
