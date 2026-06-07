import { useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface GalleryForm {
  objectKey: string;
  contentType: string;
  fileSize: number;
  alt: string;
  category: string;
  previewUrl: string;
}

const AdminGallery = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<GalleryForm>({ objectKey: '', contentType: '', fileSize: 0, alt: '', category: 'fade', previewUrl: '' });
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: images = [], isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'gallery', { categoryFilter }],
    queryFn: async () => {
      const result = await api.admin.getGalleryFiltered({
        category: categoryFilter === 'all' ? undefined : categoryFilter,
      });
      return result.content;
    },
  });

  const handleUpload = async () => {
    if (!form.objectKey) {
      toast.error(t('admin.common.uploadImageFirst'));
      return;
    }
    try {
      const metadata: UploadMetadata = { alt: form.alt, category: form.category };
      await confirmUpload('GALLERY', form.objectKey, form.contentType, form.fileSize, metadata);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'gallery'] });
      toast.success(t('admin.galleryPage.added'));
      setModalOpen(false);
      setForm({ objectKey: '', contentType: '', fileSize: 0, alt: '', category: 'fade', previewUrl: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('admin.common.saveFailed'));
    }
  };

  const deleteImage = async (id: string) => {
    try {
      await api.admin.deleteGalleryImage(id);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'gallery'] });
      toast.success(t('admin.galleryPage.deleted'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('admin.common.deleteFailed'));
    }
  };

  const resetFilters = () => {
    setCategoryFilter('all');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('admin.galleryPage.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('admin.galleryPage.count', { count: images.length })}</p>
        </div>
        <Button onClick={() => { setForm({ objectKey: '', contentType: '', fileSize: 0, alt: '', category: 'fade', previewUrl: '' }); setModalOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" /> {t('admin.galleryPage.add')}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.galleryPage.allCategories')}</SelectItem>
            <SelectItem value="fade">{t('admin.galleryPage.categories.fade')}</SelectItem>
            <SelectItem value="classic">{t('admin.galleryPage.categories.classic')}</SelectItem>
            <SelectItem value="modern">{t('admin.galleryPage.categories.modern')}</SelectItem>
            <SelectItem value="color">{t('admin.galleryPage.categories.color')}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={resetFilters}>
          {t('common.reset')}
        </Button>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>{t('admin.galleryPage.loadError')}</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : t('admin.common.loadFallback')}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading && Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="aspect-square animate-pulse rounded-xl border border-border bg-card" />
        ))}
        {images.map((image) => (
          <div key={image.id} className="group relative overflow-hidden rounded-xl border border-border">
            <img src={image.url} alt={image.alt} className="aspect-square w-full object-cover" />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-background/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex w-full items-center justify-between p-3">
                <span className="truncate text-xs text-foreground">{image.alt}</span>
                <Button size="sm" variant="ghost" onClick={() => deleteImage(image.id)} className="shrink-0 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={t('admin.galleryPage.add')} onSubmit={handleUpload} submitLabel={t('admin.galleryPage.publish')}>
        <div className="space-y-3">
          <div>
            <Label>{t('admin.fields.image')}</Label>
            <ImageUploader
              context="GALLERY"
              onUploaded={(publicUrl, objectKey, contentType, fileSize) =>
                setForm((current) => ({ ...current, objectKey, contentType, fileSize, previewUrl: publicUrl }))
              }
              onError={(msg) => toast.error(msg)}
            />
          </div>
          <div><Label>{t('admin.fields.altText')}</Label><Input value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} placeholder={t('admin.galleryPage.description')} /></div>
          <div className="space-y-2">
            <Label>{t('admin.fields.category')}</Label>
            <Select value={form.category} onValueChange={(category) => setForm((current) => ({ ...current, category }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fade">{t('admin.galleryPage.categories.fade')}</SelectItem>
                <SelectItem value="classic">{t('admin.galleryPage.categories.classic')}</SelectItem>
                <SelectItem value="modern">{t('admin.galleryPage.categories.modern')}</SelectItem>
                <SelectItem value="color">{t('admin.galleryPage.categories.color')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormModal>
    </div>
  );
};

export default AdminGallery;
