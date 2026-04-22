import { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import { mockUsers, AdminUser } from '@/data/adminMockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Shield, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';

const AdminUsers = () => {
  const [users, setUsers] = useState(mockUsers);
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    const load = async () => {
      try {
        setUsers(await api.admin.getUsers());
      } catch {
        // keep fallback
      }
    };
    void load();
  }, []);

  const filtered = roleFilter === 'all' ? users : users.filter((u) => u.role === roleFilter);

  const toggleRole = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user || user.deleted) return;
    const role: AdminUser['role'] = user.role === 'admin' ? 'user' : 'admin';
    try {
      const updated = await api.admin.updateUserRole(id, role) as AdminUser;
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, ...updated, id } as AdminUser : u));
      toast.success('User role updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
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

    try {
      const updated = await api.admin.updateUser(user.id, { name, phone }) as AdminUser;
      setUsers((prev) => prev.map((item) => item.id === user.id ? { ...item, ...updated, id: user.id } as AdminUser : item));
      toast.success('User updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
  };

  const deleteUser = async (user: AdminUser) => {
    if (user.deleted) {
      toast.info('User already deleted');
      return;
    }

    if (!window.confirm(`Soft delete user ${user.name}?`)) {
      return;
    }

    try {
      await api.admin.deleteUser(user.id);
      const deletedAt = new Date().toISOString().slice(0, 10);
      setUsers((prev) => prev.map((item) => item.id === user.id ? { ...item, deleted: true, deletedAt } : item));
      toast.success('User soft deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    }
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

      <DataTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search users..."
        actions={(u) => (
          <div className="flex items-center justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={() => toggleRole(u.id)} title="Toggle role" disabled={u.deleted}><Shield className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => editUser(u)} disabled={u.deleted}><Edit className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => deleteUser(u)} className="text-destructive" disabled={u.deleted}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />
    </div>
  );
};

export default AdminUsers;
