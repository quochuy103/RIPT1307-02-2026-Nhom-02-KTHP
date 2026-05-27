import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable, { Column } from '@/components/admin/DataTable';
import type { AdminProduct } from '@/data/adminMockData';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import FormModal from '@/components/admin/FormModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ImageUploader from '@/components/ImageUploader';
import { useTranslation } from 'react-i18next';

const emptyProduct: Omit<AdminProduct, 'id'> = { name: '', price: 0, image: '/placeholder.svg', description: '', stock: 0, category: '' };

interface ProductFormState extends Omit<AdminProduct, 'id'> {
  objectKey: string;
  contentType: string;
  fileSize: number;
}

const emptyForm: ProductFormState = { ...emptyProduct, objectKey: '', contentType: '', fileSize: 0 };
const productsQueryKey = ['admin', 'products'] as const;

const AdminProducts = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);

  const { data: products = [], isLoading, isError, error } = useQuery({
    queryKey: productsQueryKey,
    queryFn: api.admin.getProducts,
  });

  const invalidateProducts = () => queryClient.invalidateQueries({ queryKey: productsQueryKey });

  const createMutation = useMutation({
    mutationFn: api.admin.createProduct,
    onSuccess: async () => {
      await invalidateProducts();
      toast.success(t('admin.productsPage.created'));
      setModalOpen(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('admin.common.saveFailed')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Omit<AdminProduct, 'id'> }) => api.admin.updateProduct(id, payload),
    onSuccess: async () => {
      await invalidateProducts();
      toast.success(t('admin.productsPage.updated'));
      setModalOpen(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('admin.common.saveFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: api.admin.deleteProduct,
    onSuccess: async () => {
      await invalidateProducts();
      toast.success(t('admin.productsPage.deleted'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('admin.common.deleteFailed')),
  });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (p: AdminProduct) => { setEditing(p); setForm({ ...p, objectKey: '', contentType: '', fileSize: 0 }); setModalOpen(true); };

  const handleSubmit = () => {
    if (!form.name) { toast.error(t('admin.common.nameRequired')); return; }
    if (!editing && (!form.image || form.image === '/placeholder.svg' || !form.objectKey)) { toast.error(t('admin.common.imageRequired')); return; }
    if (editing) updateMutation.mutate({ id: editing.id, payload: form });
    else createMutation.mutate(form);
  };

  const deleteProduct = (id: string) => deleteMutation.mutate(id);

  const columns: Column<AdminProduct>[] = [
    { key: 'image', label: t('admin.fields.image'), searchable: false, render: (p) => (
      <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover bg-secondary" />
    )},
    { key: 'name', label: t('admin.fields.name'), render: (p) => <span className="font-medium">{p.name}</span> },
    { key: 'category', label: t('admin.fields.category') },
    { key: 'price', label: t('admin.fields.price'), render: (p) => `${p.price.toLocaleString('vi-VN')}đ` },
    { key: 'stock', label: t('admin.fields.stock'), render: (p) => (
      <Badge variant={p.stock > 20 ? 'default' : p.stock > 0 ? 'outline' : 'destructive'}>
        {p.stock}
      </Badge>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('admin.productsPage.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('admin.productsPage.count', { count: products.length })}</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> {t('admin.productsPage.add')}</Button>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>{t('admin.productsPage.loadError')}</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : t('admin.common.loadFallback')}</AlertDescription>
        </Alert>
      )}

      <DataTable data={isLoading ? [] : products} columns={columns} searchPlaceholder={isLoading ? t('admin.productsPage.loading') : t('admin.productsPage.search')} actions={(p) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => deleteProduct(p.id)} className="text-destructive" disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
        </div>
      )} />

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('admin.productsPage.edit') : t('admin.productsPage.add')} onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div><Label>{t('admin.fields.name')}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>{t('admin.fields.category')}</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t('admin.fields.price')}</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
            <div><Label>{t('admin.fields.stock')}</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></div>
          </div>
          <div>
            <Label>{t('admin.fields.image')}</Label>
            <ImageUploader
              context="PRODUCT"
              currentUrl={form.image !== '/placeholder.svg' ? form.image : undefined}
              onUploaded={(publicUrl, objectKey, contentType, fileSize) => setForm({ ...form, image: publicUrl, objectKey, contentType, fileSize })}
              onError={(msg) => toast.error(msg)}
            />
            <Input
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder={t('admin.productsPage.manualUrl')}
              className="mt-2"
            />
          </div>
          <div><Label>{t('admin.fields.description')}</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
      </FormModal>
    </div>
  );
};

export default AdminProducts;
