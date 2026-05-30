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
import { useTranslation } from 'react-i18next';

const emptyBarber: Omit<AdminBarber, 'id'> = { name: '', experience: 0, avatar: '', specialties: [] };

interface BarberFormState extends Omit<AdminBarber, 'id'> {
  objectKey: string;
  contentType: string;
  fileSize: number;
}

const emptyForm: BarberFormState = { ...emptyBarber, objectKey: '', contentType: '', fileSize: 0 };
const barbersQueryKey = ['admin', 'barbers'] as const;

const AdminBarbers = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBarber | null>(null);
  const [form, setForm] = useState<BarberFormState>(emptyForm);
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [minExperienceFilter, setMinExperienceFilter] = useState('');
  const [specialtiesInput, setSpecialtiesInput] = useState('');

  const { data: barbers = [], isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'barbers', { search, specialtyFilter, minExperienceFilter }],
    queryFn: async () => {
      const result = await api.admin.getBarbersFiltered({
        search,
        specialty: specialtyFilter || undefined,
        minExperience: minExperienceFilter ? Number(minExperienceFilter) : undefined,
      });
      return result.content;
    },
  });

  const invalidateBarbers = () => queryClient.invalidateQueries({ queryKey: barbersQueryKey });

  const createMutation = useMutation({
    mutationFn: api.admin.createBarber,
    onSuccess: async () => {
      await invalidateBarbers();
      toast.success(t('admin.barbersPage.added'));
      setModalOpen(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('admin.common.saveFailed')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Omit<AdminBarber, 'id'> }) => api.admin.updateBarber(id, payload),
    onSuccess: async () => {
      await invalidateBarbers();
      toast.success(t('admin.barbersPage.updated'));
      setModalOpen(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('admin.common.saveFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: api.admin.deleteBarber,
    onSuccess: async () => {
      await invalidateBarbers();
      toast.success(t('admin.barbersPage.deleted'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('admin.common.deleteFailed')),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSpecialtiesInput('');
    setModalOpen(true);
  };
  const openEdit = (barber: AdminBarber) => {
    setEditing(barber);
    setForm({ ...barber, objectKey: '', contentType: '', fileSize: 0 });
    setSpecialtiesInput(barber.specialties.join(', '));
    setModalOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      ...form,
      name: form.name.trim(),
      specialties: specialtiesInput.split(',').map((specialty) => specialty.trim()).filter(Boolean),
    };

    if (!payload.name) {
      toast.error(t('admin.common.nameRequired'));
      return;
    }
    if (!form.avatar) {
      toast.error(t('admin.barbersPage.avatarRequired'));
      return;
    }
    if (payload.specialties.length === 0) {
      toast.error(t('admin.barbersPage.specialtiesRequired'));
      return;
    }

    if (editing) updateMutation.mutate({ id: editing.id, payload });
    else createMutation.mutate(payload);
  };

  const deleteBarber = (id: string) => deleteMutation.mutate(id);

  const resetFilters = () => {
    setSearch('');
    setSpecialtyFilter('');
    setMinExperienceFilter('');
  };

  const columns: Column<AdminBarber>[] = [
    { key: 'avatar', label: t('admin.fields.avatar'), searchable: false, render: (barber) => (
      <Avatar className="h-8 w-8"><AvatarImage src={barber.avatar} /><AvatarFallback>{barber.name.charAt(0)}</AvatarFallback></Avatar>
    )},
    { key: 'name', label: t('admin.fields.name'), render: (barber) => <span className="font-medium">{barber.name}</span> },
    { key: 'experience', label: t('admin.fields.experience'), render: (barber) => `${barber.experience} ${t('common.yearsExperience')}` },
    { key: 'specialties', label: t('admin.fields.specialties'), render: (barber) => barber.specialties.join(', ') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('admin.barbersPage.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('admin.barbersPage.count', { count: barbers.length })}</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> {t('admin.barbersPage.add')}</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.barbersPage.search')} />
        <Input value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)} placeholder={t('admin.fields.specialties')} />
        <Input type="number" min="0" value={minExperienceFilter} onChange={(e) => setMinExperienceFilter(e.target.value)} placeholder={t('admin.fields.experience', { defaultValue: 'Kinh nghiệm tối thiểu' })} />
        <Button variant="outline" onClick={resetFilters}>
          {t('common.reset', { defaultValue: 'Reset' })}
        </Button>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>{t('admin.barbersPage.loadError')}</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : t('admin.common.loadFallback')}</AlertDescription>
        </Alert>
      )}

      <DataTable data={isLoading ? [] : barbers} columns={columns} showSearch={false} actions={(barber) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(barber)}><Edit className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => deleteBarber(barber.id)} className="text-destructive" disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
        </div>
      )} />

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('admin.barbersPage.edit') : t('admin.barbersPage.add')} onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div><Label>{t('admin.fields.name')}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>{t('admin.fields.experience')}</Label><Input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: Number(e.target.value) })} /></div>
          <div>
            <Label>{t('admin.barbersPage.avatarImage')}</Label>
            <ImageUploader
              context="BARBER"
              currentUrl={form.avatar}
              onUploaded={(publicUrl, objectKey, contentType, fileSize) => setForm({ ...form, avatar: publicUrl, objectKey, contentType, fileSize })}
              onError={(msg) => toast.error(msg)}
            />
            {form.avatar && (
              <Input
                value={form.avatar}
                placeholder={t('admin.barbersPage.manualUrl')}
                onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                className="mt-2"
              />
            )}
          </div>
          <div>
            <Label>{t('admin.fields.specialties')}</Label>
            <Input
              value={specialtiesInput}
              placeholder={t('admin.barbersPage.specialtiesPlaceholder')}
              onChange={(e) => setSpecialtiesInput(e.target.value)}
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
};

export default AdminBarbers;
