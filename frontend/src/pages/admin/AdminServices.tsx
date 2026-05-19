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

const emptyService: Omit<AdminService, 'id'> = { name: '', price: 0, duration: 0, category: '', description: '' };
const servicesQueryKey = ['admin', 'services'] as const;

const AdminServices = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminService | null>(null);
  const [form, setForm] = useState(emptyService);

  const { data: services = [], isLoading, isError, error } = useQuery({
    queryKey: servicesQueryKey,
    queryFn: api.admin.getServices,
  });

  const invalidateServices = () => queryClient.invalidateQueries({ queryKey: servicesQueryKey });

  const createMutation = useMutation({
    mutationFn: api.admin.createService,
    onSuccess: async () => {
      await invalidateServices();
      toast.success('Service created');
      setModalOpen(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Save failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Omit<AdminService, 'id'> }) => api.admin.updateService(id, payload),
    onSuccess: async () => {
      await invalidateServices();
      toast.success('Service updated');
      setModalOpen(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: api.admin.deleteService,
    onSuccess: async () => {
      await invalidateServices();
      toast.success('Service deleted');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Delete failed'),
  });

  const openCreate = () => { setEditing(null); setForm(emptyService); setModalOpen(true); };
  const openEdit = (s: AdminService) => { setEditing(s); setForm(s); setModalOpen(true); };

  const handleSubmit = () => {
    if (!form.name) { toast.error('Name is required'); return; }
    if (editing) updateMutation.mutate({ id: editing.id, payload: form });
    else createMutation.mutate(form);
  };

  const deleteService = (id: string) => deleteMutation.mutate(id);

  const columns: Column<AdminService>[] = [
    { key: 'name', label: 'Name', render: (s) => <span className="font-medium">{s.name}</span> },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price', render: (s) => `$${s.price}` },
    { key: 'duration', label: 'Duration', render: (s) => `${s.duration} min` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Service Management</h1>
          <p className="text-sm text-muted-foreground">{services.length} services</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Add Service</Button>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Could not load services</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : 'Please check your admin access and API route.'}</AlertDescription>
        </Alert>
      )}

      <DataTable data={isLoading ? [] : services} columns={columns} searchPlaceholder={isLoading ? 'Loading services...' : 'Search services...'} actions={(s) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Edit className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => deleteService(s.id)} className="text-destructive" disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
        </div>
      )} />

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Service' : 'Add Service'} onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Price ($)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
            <div><Label>Duration (min)</Label><Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
      </FormModal>
    </div>
  );
};

export default AdminServices;
