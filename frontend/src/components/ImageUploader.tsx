import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, X } from 'lucide-react';
import { uploadImage, uploadToStorage, type UploadContext, type PresignResult } from '@/services/uploadService';

interface ImageUploaderProps {
  context: UploadContext;
  currentUrl?: string;
  onUploaded: (publicUrl: string, objectKey: string, contentType: string, fileSize: number) => void;
  onError?: (message: string) => void;
}

export default function ImageUploader({ context, currentUrl, onUploaded, onError }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(currentUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      let result: { publicUrl: string; objectKey: string; contentType: string; fileSize: number };

      if (context === 'AVATAR') {
        const r = await uploadImage({ file, context: 'AVATAR' });
        result = { publicUrl: r.publicUrl, objectKey: r.objectKey, contentType: file.type, fileSize: file.size };
      } else if (context === 'GALLERY') {
        const r = await uploadToStorage(file, 'GALLERY');
        result = { publicUrl: r.publicUrl, objectKey: r.objectKey, contentType: r.contentType, fileSize: r.fileSize };
      } else {
        const r = await uploadToStorage(file, context);
        result = { publicUrl: r.publicUrl, objectKey: r.objectKey, contentType: r.contentType, fileSize: r.fileSize };
      }

      setPreview(result.publicUrl);
      onUploaded(result.publicUrl, result.objectKey, result.contentType, result.fileSize);
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
