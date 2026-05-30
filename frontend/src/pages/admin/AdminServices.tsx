import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable, { Column } from '@/components/admin/DataTable';
import type { AdminService } from '@/data/adminMockData';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import FormModal from '@/components/admin/FormModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const emptyService: Omit<AdminService, 'id'> = { name: '', price: 0, duration: 0, category: '', description: '' };
const servicesQueryKey = ['admin', 'services'] as const;

const AdminServices = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminService | null>(null);
  const [form, setForm] = useState(emptyService);
  const [search, setSearch] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [minDurationFilter, setMinDurationFilter] = useState('');

  const { data: serviceOptions = [] } = useQuery({
    queryKey: ['admin', 'services', 'options'],
    queryFn: api.admin.getServices,
  });

  const { data: services = [], isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'services', { search, categoryFilter, minPriceFilter, minDurationFilter }],
    queryFn: async () => {
      const result = await api.admin.getServicesFiltered({
        search: search === 'all' ? undefined : search,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        minPrice: minPriceFilter ? Number(minPriceFilter) : undefined,
        minDuration: minDurationFilter ? Number(minDurationFilter) : undefined,
      });
      return result.content;
    },
  });

  const invalidateServices = () => queryClient.invalidateQueries({ queryKey: servicesQueryKey });

  const createMutation = useMutation({
    mutationFn: api.admin.createService,
    onSuccess: async () => {
      await invalidateServices();
      toast.success(t('admin.servicesPage.created'));
      setModalOpen(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('admin.common.saveFailed')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Omit<AdminService, 'id'> }) => api.admin.updateService(id, payload),
    onSuccess: async () => {
      await invalidateServices();
      toast.success(t('admin.servicesPage.updated'));
      setModalOpen(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('admin.common.saveFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: api.admin.deleteService,
    onSuccess: async () => {
      await invalidateServices();
      toast.success(t('admin.servicesPage.deleted'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('admin.common.deleteFailed')),
  });

  const openCreate = () => { setEditing(null); setForm(emptyService); setModalOpen(true); };
  const openEdit = (service: AdminService) => { setEditing(service); setForm(service); setModalOpen(true); };

  const handleSubmit = () => {
    if (!form.name) {
      toast.error(t('admin.common.nameRequired'));
      return;
    }

    if (editing) updateMutation.mutate({ id: editing.id, payload: form });
    else createMutation.mutate(form);
  };

  const deleteService = (id: string) => deleteMutation.mutate(id);

  const resetFilters = () => {
    setSearch('all');
    setCategoryFilter('all');
    setMinPriceFilter('');
    setMinDurationFilter('');
  };

  const serviceNameOptions = Array.from(new Set(serviceOptions.map((service) => service.name).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, 'vi'));
  const serviceCategoryOptions = Array.from(new Set(serviceOptions.map((service) => service.category).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, 'vi'));

  const columns: Column<AdminService>[] = [
    { key: 'name', label: t('admin.fields.name'), render: (service) => <span className="font-medium">{service.name}</span> },
    { key: 'category', label: t('admin.fields.category') },
    { key: 'price', label: t('admin.fields.price'), render: (service) => `${service.price.toLocaleString('vi-VN')}đ` },
    { key: 'duration', label: t('admin.fields.duration'), render: (service) => `${service.duration} ${t('services.min')}` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('admin.servicesPage.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('admin.servicesPage.count', { count: services.length })}</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> {t('admin.servicesPage.add')}</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Select value={search} onValueChange={setSearch}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.servicesPage.search', { defaultValue: 'Tất cả dịch vụ' })}</SelectItem>
            {serviceNameOptions.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.common.allCategories', { defaultValue: 'Tất cả danh mục' })}</SelectItem>
            {serviceCategoryOptions.map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="number" min="0" value={minPriceFilter} onChange={(e) => setMinPriceFilter(e.target.value)} placeholder={t('admin.fields.price', { defaultValue: 'Giá tối thiểu' })} />
        <Input type="number" min="0" value={minDurationFilter} onChange={(e) => setMinDurationFilter(e.target.value)} placeholder={t('admin.fields.duration', { defaultValue: 'Thời lượng tối thiểu' })} />
        <Button variant="outline" onClick={resetFilters}>
          {t('common.reset', { defaultValue: 'Reset' })}
        </Button>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>{t('admin.servicesPage.loadError')}</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : t('admin.common.loadFallback')}</AlertDescription>
        </Alert>
      )}

      <DataTable data={isLoading ? [] : services} columns={columns} showSearch={false} actions={(service) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(service)}><Edit className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => deleteService(service.id)} className="text-destructive" disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
        </div>
      )} />

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('admin.servicesPage.edit') : t('admin.servicesPage.add')} onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div><Label>{t('admin.fields.name')}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>{t('admin.fields.category')}</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t('admin.fields.price')}</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
            <div><Label>{t('admin.fields.duration')}</Label><Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} /></div>
          </div>
          <div><Label>{t('admin.fields.description')}</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
      </FormModal>
    </div>
  );
};

export default AdminServices;
