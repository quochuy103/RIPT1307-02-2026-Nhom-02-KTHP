import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable, { Column } from '@/components/admin/DataTable';
import type { AdminBarber } from '@/data/adminMockData';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import FormModal from '@/components/admin/FormModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ImageUploader from '@/components/ImageUploader';

const emptyBarber: Omit<AdminBarber, 'id'> = { name: '', experience: 0, avatar: '', specialties: [] };
const barbersQueryKey = ['admin', 'barbers'] as const;

const AdminBarbers = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBarber | null>(null);
  const [form, setForm] = useState(emptyBarber);

  const { data: barbers = [], isLoading, isError, error } = useQuery({
    queryKey: barbersQueryKey,
    queryFn: api.admin.getBarbers,
  });

  const invalidateBarbers = () => queryClient.invalidateQueries({ queryKey: barbersQueryKey });

  const createMutation = useMutation({
    mutationFn: api.admin.createBarber,
    onSuccess: async () => {
      await invalidateBarbers();
      toast.success('Barber added');
      setModalOpen(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Save failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Omit<AdminBarber, 'id'> }) => api.admin.updateBarber(id, payload),
    onSuccess: async () => {
      await invalidateBarbers();
      toast.success('Barber updated');
      setModalOpen(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: api.admin.deleteBarber,
    onSuccess: async () => {
      await invalidateBarbers();
      toast.success('Barber deleted');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Delete failed'),
  });

  const openCreate = () => { setEditing(null); setForm(emptyBarber); setModalOpen(true); };
  const openEdit = (b: AdminBarber) => { setEditing(b); setForm(b); setModalOpen(true); };

  const handleSubmit = () => {
    if (!form.name) { toast.error('Name is required'); return; }
    if (!form.avatar) { toast.error('Avatar image is required'); return; }
    if (editing) updateMutation.mutate({ id: editing.id, payload: form });
    else createMutation.mutate(form);
  };

  const deleteBarber = (id: string) => deleteMutation.mutate(id);

  const columns: Column<AdminBarber>[] = [
    { key: 'avatar', label: 'Avatar', searchable: false, render: (b) => (
      <Avatar className="h-8 w-8"><AvatarImage src={b.avatar} /><AvatarFallback>{b.name.charAt(0)}</AvatarFallback></Avatar>
    )},
    { key: 'name', label: 'Name', render: (b) => <span className="font-medium">{b.name}</span> },
    { key: 'experience', label: 'Experience', render: (b) => `${b.experience} years` },
    { key: 'specialties', label: 'Specialties', render: (b) => b.specialties.join(', ') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Barber Management</h1>
          <p className="text-sm text-muted-foreground">{barbers.length} barbers</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Add Barber</Button>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Could not load barbers</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : 'Please check your admin access and API route.'}</AlertDescription>
        </Alert>
      )}

      <DataTable data={isLoading ? [] : barbers} columns={columns} searchPlaceholder={isLoading ? 'Loading barbers...' : 'Search barbers...'} actions={(b) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(b)}><Edit className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => deleteBarber(b.id)} className="text-destructive" disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
        </div>
      )} />

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Barber' : 'Add Barber'} onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Experience (years)</Label><Input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: Number(e.target.value) })} /></div>
          <div>
            <Label>Avatar Image</Label>
            <ImageUploader
              context="BARBER"
              currentUrl={form.avatar}
              onUploaded={(publicUrl) => setForm({ ...form, avatar: publicUrl })}
              onError={(msg) => toast.error(msg)}
            />
            {form.avatar && (
              <Input
                value={form.avatar}
                placeholder="Or paste image URL manually"
                onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                className="mt-2"
              />
            )}
          </div>
          <div><Label>Specialties (comma-separated)</Label><Input value={form.specialties.join(', ')} onChange={(e) => setForm({ ...form, specialties: e.target.value.split(',').map((s) => s.trim()) })} /></div>
        </div>
      </FormModal>
    </div>
  );
};

export default AdminBarbers;
