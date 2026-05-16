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

const usersQueryKey = ['admin', 'users'] as const;

const AdminUsers = () => {
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
      toast.success('User role updated');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Update failed'),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name: string; phone: string } }) => api.admin.updateUser(id, payload),
    onSuccess: async () => {
      await invalidateUsers();
      toast.success('User updated');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Update failed'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: api.admin.deleteUser,
    onSuccess: async () => {
      await invalidateUsers();
      toast.success('User soft deleted');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Delete failed'),
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
      toast.error('Deleted users cannot be edited');
      return;
    }

    const name = window.prompt('Update user name', user.name);
    if (name === null) return;

    const phone = window.prompt('Update user phone', user.phone);
    if (phone === null) return;

    updateUserMutation.mutate({ id: user.id, payload: { name, phone } });
  };

  const deleteUser = async (user: AdminUser) => {
    if (user.deleted) {
      toast.info('User already deleted');
      return;
    }

    if (!window.confirm(`Soft delete user ${user.name}?`)) {
      return;
    }

    deleteUserMutation.mutate(user.id);
  };

  const columns: Column<AdminUser>[] = [
    { key: 'name', label: 'Name', render: (u) => <span className="font-medium">{u.name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'role', label: 'Role', render: (u) => <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge> },
    {
      key: 'deleted',
      label: 'Status',
      render: (u) => <Badge variant={u.deleted ? 'destructive' : 'secondary'}>{u.deleted ? 'deleted' : 'active'}</Badge>,
      searchable: false,
    },
    { key: 'createdAt', label: 'Joined' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">{users.length} total users</p>
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Could not load users</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : 'Please check your admin access and API route.'}</AlertDescription>
        </Alert>
      )}

      <DataTable
        data={isLoading ? [] : filtered}
        columns={columns}
        searchPlaceholder={isLoading ? 'Loading users...' : 'Search users...'}
        actions={(u) => (
          <div className="flex items-center justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={() => toggleRole(u.id)} title="Toggle role" disabled={u.deleted || updateRoleMutation.isPending}><Shield className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => editUser(u)} disabled={u.deleted || updateUserMutation.isPending}><Edit className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => deleteUser(u)} className="text-destructive" disabled={u.deleted || deleteUserMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />
    </div>
  );
};

export default AdminUsers;
