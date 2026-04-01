import { useState } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import { mockBarbers, AdminBarber } from '@/data/adminMockData';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import FormModal from '@/components/admin/FormModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const emptyBarber: Omit<AdminBarber, 'id'> = { name: '', experience: 0, avatar: '', specialties: [] };

const AdminBarbers = () => {
  const [barbers, setBarbers] = useState(mockBarbers);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBarber | null>(null);
  const [form, setForm] = useState(emptyBarber);

  const openCreate = () => { setEditing(null); setForm(emptyBarber); setModalOpen(true); };
  const openEdit = (b: AdminBarber) => { setEditing(b); setForm(b); setModalOpen(true); };

  const handleSubmit = () => {
    if (!form.name) { toast.error('Name is required'); return; }
    if (editing) {
      setBarbers((prev) => prev.map((b) => b.id === editing.id ? { ...b, ...form } : b));
      toast.success('Barber updated');
    } else {
      setBarbers((prev) => [...prev, { ...form, id: String(Date.now()) }]);
      toast.success('Barber added');
    }
    setModalOpen(false);
  };

  const deleteBarber = (id: string) => {
    setBarbers((prev) => prev.filter((b) => b.id !== id));
    toast.success('Barber deleted');
  };

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

      <DataTable data={barbers} columns={columns} searchPlaceholder="Search barbers..." actions={(b) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(b)}><Edit className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => deleteBarber(b.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
        </div>
      )} />

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Barber' : 'Add Barber'} onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Experience (years)</Label><Input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: Number(e.target.value) })} /></div>
          <div><Label>Avatar URL</Label><Input value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} /></div>
          <div><Label>Specialties (comma-separated)</Label><Input value={form.specialties.join(', ')} onChange={(e) => setForm({ ...form, specialties: e.target.value.split(',').map((s) => s.trim()) })} /></div>
        </div>
      </FormModal>
    </div>
  );
};

export default AdminBarbers;
