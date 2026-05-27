import { useEffect, useState } from 'react';
import { mockGallery } from '@/data/adminMockData';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import FormModal from '@/components/admin/FormModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import ImageUploader from '@/components/ImageUploader';
import { confirmUpload, type UploadMetadata } from '@/services/uploadService';

interface GalleryForm {
  objectKey: string;
  contentType: string;
  fileSize: number;
  alt: string;
  category: string;
  previewUrl: string;
}

const AdminGallery = () => {
  const [images, setImages] = useState(mockGallery);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<GalleryForm>({ objectKey: '', contentType: '', fileSize: 0, alt: '', category: 'fade', previewUrl: '' });

  useEffect(() => {
    const load = async () => {
      try {
        setImages(await api.admin.getGallery());
      } catch {
        // keep fallback
      }
    };
    void load();
  }, []);

  const handleUpload = async () => {
    if (!form.objectKey) { toast.error('Please upload an image first'); return; }
    try {
      const metadata: UploadMetadata = { alt: form.alt, category: form.category };
      await confirmUpload('GALLERY', form.objectKey, form.contentType, form.fileSize, metadata);
      setImages(await api.admin.getGallery());
      toast.success('Image added');
      setModalOpen(false);
      setForm({ objectKey: '', contentType: '', fileSize: 0, alt: '', category: 'fade', previewUrl: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const deleteImage = async (id: string) => {
    try {
      await api.admin.deleteGalleryImage(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
      toast.success('Image deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gallery Management</h1>
          <p className="text-sm text-muted-foreground">{images.length} images</p>
        </div>
        <Button onClick={() => { setForm({ objectKey: '', contentType: '', fileSize: 0, alt: '', category: 'fade', previewUrl: '' }); setModalOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Add Image
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img) => (
          <div key={img.id} className="group relative overflow-hidden rounded-xl border border-border">
            <img src={img.url} alt={img.alt} className="aspect-square w-full object-cover" />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-background/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex w-full items-center justify-between p-3">
                <span className="text-xs text-foreground truncate">{img.alt}</span>
                <Button size="sm" variant="ghost" onClick={() => deleteImage(img.id)} className="text-destructive shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Image" onSubmit={handleUpload} submitLabel="Publish Image">
        <div className="space-y-3">
          <div>
            <Label>Image</Label>
            <ImageUploader
              context="GALLERY"
              onUploaded={(publicUrl, objectKey, contentType, fileSize) =>
                setForm((current) => ({ ...current, objectKey, contentType, fileSize, previewUrl: publicUrl }))
              }
              onError={(msg) => toast.error(msg)}
            />
          </div>
          <div><Label>Alt Text</Label><Input value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} placeholder="Description" /></div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(category) => setForm((current) => ({ ...current, category }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fade">Fade</SelectItem>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="color">Color</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormModal>
    </div>
  );
};

export default AdminGallery;
