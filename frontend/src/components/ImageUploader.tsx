import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, X, RotateCw, ZoomIn, ZoomOut, Check, Crop, RefreshCw } from 'lucide-react';
import { uploadImage, uploadToStorage, type UploadContext } from '@/services/uploadService';
import { useTranslation } from 'react-i18next';

interface ImageUploaderProps {
  context: UploadContext;
  currentUrl?: string;
  onUploaded: (publicUrl: string, objectKey: string, contentType: string, fileSize: number) => void;
  onError?: (message: string) => void;
}

export default function ImageUploader({ context, currentUrl, onUploaded, onError }: ImageUploaderProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(currentUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '4:3'>(
    context === 'AVATAR' ? '1:1' : '4:3'
  );

  // Drag, Zoom & Rotate math state
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [baseWidth, setBaseWidth] = useState(0);
  const [baseHeight, setBaseHeight] = useState(0);
  const [baseX, setBaseX] = useState(0);
  const [baseY, setBaseY] = useState(0);

  const imageRef = useRef<HTMLImageElement>(null);

  const W = 320;
  const H = aspectRatio === '1:1' ? 320 : aspectRatio === '16:9' ? 180 : 240;

  // Recalculate dimensions when image or aspect ratio changes
  useEffect(() => {
    if (!imageRef.current || !imageSrc) return;
    const img = imageRef.current;
    
    const containerAspect = W / H;
    const imgAspect = img.naturalWidth / img.naturalHeight;
    let w = W;
    let h = H;

    if (imgAspect > containerAspect) {
      h = H;
      w = H * imgAspect;
    } else {
      w = W;
      h = W / imgAspect;
    }

    setBaseWidth(w);
    setBaseHeight(h);
    setBaseX((W - w) / 2);
    setBaseY((H - h) / 2);
    setOffset({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  }, [aspectRatio, imageSrc, H]);

  const getMinZoom = (currentRotation: number) => {
    if (!imageRef.current) return 1;
    const isRotated90 = currentRotation === 90 || currentRotation === 270;
    if (!isRotated90) return 1;
    
    const scaleX = W / baseHeight;
    const scaleY = H / baseWidth;
    return Math.max(1, scaleX, scaleY);
  };

  const constrainOffset = (x: number, y: number, currentZoom: number, currentRotation: number = rotation) => {
    const isRotated90 = currentRotation === 90 || currentRotation === 270;
    const wImg = (isRotated90 ? baseHeight : baseWidth) * currentZoom;
    const hImg = (isRotated90 ? baseWidth : baseHeight) * currentZoom;

    const minX = (W - wImg) / 2;
    const maxX = (wImg - W) / 2;
    const minY = (H - hImg) / 2;
    const maxY = (hImg - H) / 2;

    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const rawX = e.clientX - dragStart.x;
    const rawY = e.clientY - dragStart.y;
    setOffset(constrainOffset(rawX, rawY, zoom));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const rawX = touch.clientX - dragStart.x;
    const rawY = touch.clientY - dragStart.y;
    setOffset(constrainOffset(rawX, rawY, zoom));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

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
      const msg = err instanceof Error ? err.message : t('common.uploadFailed');
      onError?.(msg);
    } finally {
      setUploading(false);
    }
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const cropAndUpload = () => {
    if (!imageRef.current || !selectedFile) return;
    const img = imageRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = W * 2; 
    canvas.height = H * 2;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.scale(2, 2);
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      
      ctx.translate(W / 2, H / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-W / 2, -H / 2);
      
      const containerAspect = W / H;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      let w = W;
      let h = H;

      if (imgAspect > containerAspect) {
        h = H;
        w = H * imgAspect;
      } else {
        w = W;
        h = W / imgAspect;
      }
      
      const bx = (W - w) / 2;
      const by = (H - h) / 2;
      
      const drawWidth = w * zoom;
      const drawHeight = h * zoom;
      const drawX = bx + offset.x;
      const drawY = by + offset.y;
      
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    }
    
    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], selectedFile.name, { type: 'image/jpeg' });
        handleFile(croppedFile);
        setCropModalOpen(false);
      }
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="space-y-2">
      {preview && (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="h-24 w-24 rounded-lg object-cover border border-border shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <button
            type="button"
            className="absolute -top-2 -right-2 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground p-0.5 shadow-md transition-colors"
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
          {uploading ? t('common.uploading') : preview ? t('common.changeImage') : t('common.uploadImage')}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onSelectFile}
        />
      </div>

      {/* DRAGGABLE & ZOOMABLE PRESET-CROP MODAL */}
      {cropModalOpen && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Crop className="h-4 w-4 text-primary" /> {t('admin.imageCropper.title', { defaultValue: 'Chỉnh sửa tỷ lệ ảnh' })}
              </span>
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Crop Workspace Container */}
            <div className="flex flex-col items-center justify-center p-6 bg-black/20">
              <div
                className="relative overflow-hidden border-2 border-primary/30 rounded-lg bg-black/40 flex items-center justify-center cursor-grab active:cursor-grabbing select-none shadow-inner"
                style={{ width: `${W}px`, height: `${H}px` }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="To Crop"
                  className="max-w-none pointer-events-none transition-transform duration-75 origin-center"
                  style={{
                    width: `${baseWidth}px`,
                    height: `${baseHeight}px`,
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  }}
                />
                
                {/* Visual Letterbox Crop Mask */}
                <div className="absolute inset-0 pointer-events-none border border-primary/60 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
              </div>
              <span className="text-[11px] text-muted-foreground mt-2">
                {t('admin.imageCropper.instruction', { defaultValue: 'Kéo để di chuyển • Sử dụng thanh trượt để phóng to' })}
              </span>
            </div>

            {/* Crop Controls Panel */}
            <div className="px-6 py-4 space-y-4 border-t border-border bg-card">
              {/* Aspect Ratio Presets */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Tỷ lệ khung hình</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={aspectRatio === '1:1' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setAspectRatio('1:1')}
                  >
                    1:1 (Vuông)
                  </Button>
                  <Button
                    type="button"
                    variant={aspectRatio === '4:3' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setAspectRatio('4:3')}
                  >
                    4:3 (Chuẩn)
                  </Button>
                  <Button
                    type="button"
                    variant={aspectRatio === '16:9' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setAspectRatio('16:9')}
                  >
                    16:9 (Rộng)
                  </Button>
                </div>
              </div>

              {/* Slider for zoom */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
                  <span>Phóng to</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <ZoomOut className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="range"
                    min={getMinZoom(rotation)}
                    max="3"
                    step="0.01"
                    value={zoom}
                    onChange={(e) => {
                      const nextZoom = parseFloat(e.target.value);
                      setZoom(nextZoom);
                      setOffset(prev => constrainOffset(prev.x, prev.y, nextZoom));
                    }}
                    className="flex-1 h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <ZoomIn className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Helper Tools: Rotation & Reset */}
              <div className="flex justify-between items-center py-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nextRotation = ((rotation + 90) % 360) as 0 | 90 | 180 | 270;
                    setRotation(nextRotation);
                    
                    const nextMinZoom = getMinZoom(nextRotation);
                    const nextZoom = Math.max(zoom, nextMinZoom);
                    setZoom(nextZoom);
                    
                    setOffset(prev => constrainOffset(prev.x, prev.y, nextZoom, nextRotation));
                  }}
                  className="flex items-center gap-1"
                >
                  <RotateCw className="h-3.5 w-3.5" /> Xoay 90°
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setZoom(1);
                    setRotation(0);
                    setOffset({ x: 0, y: 0 });
                  }}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Đặt lại
                </Button>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-muted/30">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCropModalOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={cropAndUpload}
                className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" /> Áp dụng & Tải lên
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
