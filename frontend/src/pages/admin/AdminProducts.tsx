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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { compareAdminText, formatAdminCurrency } from '@/lib/admin-format';

const emptyProduct: Omit<AdminProduct, 'id'> = { name: '', price: 0, image: '/placeholder.svg', description: '', stock: 0, category: '' };

interface ProductFormState extends Omit<AdminProduct, 'id'> {
  objectKey: string;
  contentType: string;
  fileSize: number;
}

const emptyForm: ProductFormState = { ...emptyProduct, objectKey: '', contentType: '', fileSize: 0 };
const productsQueryKey = ['admin', 'products'] as const;

const AdminProducts = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [search, setSearch] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'out'>('all');

  const { data: productOptions = [] } = useQuery({
    queryKey: ['admin', 'products', 'options'],
    queryFn: api.admin.getProducts,
  });

  const { data: products = [], isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'products', { search, categoryFilter, minPriceFilter, stockFilter }],
    queryFn: async () => {
      const result = await api.admin.getProductsFiltered({
        search: search === 'all' ? undefined : search,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        minPrice: minPriceFilter ? Number(minPriceFilter) : undefined,
        inStock: stockFilter === 'all' ? undefined : stockFilter === 'in',
      });
      return result.content;
    },
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
  const openEdit = (product: AdminProduct) => { setEditing(product); setForm({ ...product, objectKey: '', contentType: '', fileSize: 0 }); setModalOpen(true); };

  const handleSubmit = () => {
    if (!form.name) {
      toast.error(t('admin.common.nameRequired'));
      return;
    }
    if (!editing && (!form.image || form.image === '/placeholder.svg' || !form.objectKey)) {
      toast.error(t('admin.common.imageRequired'));
      return;
    }

    if (editing) updateMutation.mutate({ id: editing.id, payload: form });
    else createMutation.mutate(form);
  };

  const deleteProduct = (id: string) => deleteMutation.mutate(id);

  const resetFilters = () => {
    setSearch('all');
    setCategoryFilter('all');
    setMinPriceFilter('');
    setStockFilter('all');
  };

  const productNameOptions = Array.from(new Set(productOptions.map((product) => product.name).filter(Boolean)))
    .sort((a, b) => compareAdminText(a, b, i18n.language));
  const productCategoryOptions = Array.from(new Set(productOptions.map((product) => product.category).filter(Boolean)))
    .sort((a, b) => compareAdminText(a, b, i18n.language));

  const columns: Column<AdminProduct>[] = [
    { key: 'image', label: t('admin.fields.image'), searchable: false, render: (product) => (
      <img src={product.image} alt={product.name} className="h-10 w-10 rounded-lg object-cover bg-secondary" />
    )},
    { key: 'name', label: t('admin.fields.name'), render: (product) => <span className="font-medium">{product.name}</span> },
    { key: 'category', label: t('admin.fields.category') },
    { key: 'price', label: t('admin.fields.price'), render: (product) => formatAdminCurrency(product.price, i18n.language) },
    { key: 'stock', label: t('admin.fields.stock'), render: (product) => (
      <Badge variant={product.stock > 20 ? 'default' : product.stock > 0 ? 'outline' : 'destructive'}>
        {product.stock}
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

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Select value={search} onValueChange={setSearch}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.productsPage.allProducts')}</SelectItem>
            {productNameOptions.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.common.allCategories')}</SelectItem>
            {productCategoryOptions.map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="number" min="0" value={minPriceFilter} onChange={(e) => setMinPriceFilter(e.target.value)} placeholder={t('admin.productsPage.minPrice')} />
        <Select value={stockFilter} onValueChange={(value) => setStockFilter(value as 'all' | 'in' | 'out')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.productsPage.allStock')}</SelectItem>
            <SelectItem value="in">{t('admin.productsPage.inStock')}</SelectItem>
            <SelectItem value="out">{t('admin.productsPage.outOfStock')}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={resetFilters}>
          {t('common.reset')}
        </Button>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>{t('admin.productsPage.loadError')}</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : t('admin.common.loadFallback')}</AlertDescription>
        </Alert>
      )}

      <DataTable data={isLoading ? [] : products} columns={columns} showSearch={false} actions={(product) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(product)}><Edit className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => deleteProduct(product.id)} className="text-destructive" disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
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
