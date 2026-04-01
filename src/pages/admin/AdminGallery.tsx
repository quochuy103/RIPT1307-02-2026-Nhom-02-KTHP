import { useState } from 'react';
import { mockGallery } from '@/data/adminMockData';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import FormModal from '@/components/admin/FormModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AdminGallery = () => {
  const [images, setImages] = useState(mockGallery);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ url: '', alt: '' });

  const handleUpload = () => {
    if (!form.url) { toast.error('URL is required'); return; }
    setImages((prev) => [...prev, { id: String(Date.now()), url: form.url, alt: form.alt, uploadedAt: new Date().toISOString().split('T')[0] }]);
    toast.success('Image added');
    setModalOpen(false);
    setForm({ url: '', alt: '' });
  };

  const deleteImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    toast.success('Image deleted');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gallery Management</h1>
          <p className="text-sm text-muted-foreground">{images.length} images</p>
        </div>
        <Button onClick={() => { setForm({ url: '', alt: '' }); setModalOpen(true); }}>
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

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Image" onSubmit={handleUpload}>
        <div className="space-y-3">
          <div><Label>Image URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
          <div><Label>Alt Text</Label><Input value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} placeholder="Description" /></div>
        </div>
      </FormModal>
    </div>
  );
};

export default AdminGallery;
