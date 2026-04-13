import { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import { mockServices, AdminService } from '@/data/adminMockData';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import FormModal from '@/components/admin/FormModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

const emptyService: Omit<AdminService, 'id'> = { name: '', price: 0, duration: 0, category: '', description: '' };

const AdminServices = () => {
  const [services, setServices] = useState(mockServices);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminService | null>(null);
  const [form, setForm] = useState(emptyService);

  useEffect(() => {
    const load = async () => {
      try {
        setServices(await api.admin.getServices());
      } catch {
        // keep fallback
      }
    };
    void load();
  }, []);

  const openCreate = () => { setEditing(null); setForm(emptyService); setModalOpen(true); };
  const openEdit = (s: AdminService) => { setEditing(s); setForm(s); setModalOpen(true); };

  const handleSubmit = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    try {
      if (editing) {
        await api.admin.updateService(editing.id, form);
        setServices((prev) => prev.map((s) => s.id === editing.id ? { ...s, ...form } : s));
        toast.success('Service updated');
      } else {
        await api.admin.createService(form);
        setServices(await api.admin.getServices());
        toast.success('Service created');
      }
      setModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    }
  };

  const deleteService = async (id: string) => {
    try {
      await api.admin.deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast.success('Service deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    }
  };

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

      <DataTable data={services} columns={columns} searchPlaceholder="Search services..." actions={(s) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Edit className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => deleteService(s.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
