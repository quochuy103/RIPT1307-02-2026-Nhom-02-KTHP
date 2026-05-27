import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable, { Column } from '@/components/admin/DataTable';
import type { AdminUser } from '@/data/adminMockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Shield, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';

const usersQueryKey = ['admin', 'users'] as const;

const AdminUsers = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const { data: users = [], isLoading, isError, error } = useQuery({
    queryKey: usersQueryKey,
    queryFn: api.admin.getUsers,
  });

  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: usersQueryKey });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: AdminUser['role'] }) => api.admin.updateUserRole(id, role),
    onSuccess: async () => {
      await invalidateUsers();
      toast.success(t('admin.usersPage.roleUpdated'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('admin.common.updateFailed')),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name: string; phone: string } }) => api.admin.updateUser(id, payload),
    onSuccess: async () => {
      await invalidateUsers();
      toast.success(t('admin.usersPage.updated'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('admin.common.updateFailed')),
  });

  const deleteUserMutation = useMutation({
    mutationFn: api.admin.deleteUser,
    onSuccess: async () => {
      await invalidateUsers();
      toast.success(t('admin.usersPage.deleted'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('admin.common.deleteFailed')),
  });

  const filtered = roleFilter === 'all' ? users : users.filter((u) => u.role === roleFilter);

  const toggleRole = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user || user.deleted) return;
    const role: AdminUser['role'] = user.role === 'admin' ? 'user' : 'admin';
    updateRoleMutation.mutate({ id, role });
  };

  const editUser = async (user: AdminUser) => {
    if (user.deleted) {
      toast.error(t('admin.usersPage.cannotEditDeleted'));
      return;
    }

    const name = window.prompt(t('admin.usersPage.updateName'), user.name);
    if (name === null) return;

    const phone = window.prompt(t('admin.usersPage.updatePhone'), user.phone);
    if (phone === null) return;

    updateUserMutation.mutate({ id: user.id, payload: { name, phone } });
  };

  const deleteUser = async (user: AdminUser) => {
    if (user.deleted) {
      toast.info(t('admin.usersPage.alreadyDeleted'));
      return;
    }

    if (!window.confirm(t('admin.usersPage.confirmDelete', { name: user.name }))) {
      return;
    }

    deleteUserMutation.mutate(user.id);
  };

  const columns: Column<AdminUser>[] = [
    { key: 'name', label: t('admin.fields.name'), render: (u) => <span className="font-medium">{u.name}</span> },
    { key: 'email', label: t('admin.fields.email') },
    { key: 'phone', label: t('admin.fields.phone') },
    { key: 'role', label: t('admin.fields.role'), render: (u) => <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{t(`admin.common.${u.role}`)}</Badge> },
    {
      key: 'deleted',
      label: t('admin.fields.status'),
      render: (u) => <Badge variant={u.deleted ? 'destructive' : 'secondary'}>{u.deleted ? t('admin.common.deleted') : t('admin.common.active')}</Badge>,
      searchable: false,
    },
    { key: 'createdAt', label: t('admin.fields.joined') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('admin.usersPage.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('admin.usersPage.count', { count: users.length })}</p>
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.common.allRoles')}</SelectItem>
            <SelectItem value="user">{t('admin.common.user')}</SelectItem>
            <SelectItem value="admin">{t('admin.common.admin')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>{t('admin.usersPage.loadError')}</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : t('admin.common.loadFallback')}</AlertDescription>
        </Alert>
      )}

      <DataTable
        data={isLoading ? [] : filtered}
        columns={columns}
        searchPlaceholder={isLoading ? t('admin.usersPage.loading') : t('admin.usersPage.search')}
        actions={(u) => (
          <div className="flex items-center justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={() => toggleRole(u.id)} title={t('admin.usersPage.toggleRole')} disabled={u.deleted || updateRoleMutation.isPending}><Shield className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => editUser(u)} disabled={u.deleted || updateUserMutation.isPending}><Edit className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => deleteUser(u)} className="text-destructive" disabled={u.deleted || deleteUserMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />
    </div>
  );
};

export default AdminUsers;
