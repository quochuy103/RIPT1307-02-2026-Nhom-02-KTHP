import { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import { mockUsers, AdminUser } from '@/data/adminMockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Shield } from 'lucide-react';
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
    if (!user) return;
    const role: AdminUser['role'] = user.role === 'admin' ? 'user' : 'admin';
    try {
      await api.admin.updateUserRole(id, role);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } as AdminUser : u));
      toast.success('User role updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await api.admin.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success('User deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const columns: Column<AdminUser>[] = [
    { key: 'name', label: 'Name', render: (u) => <span className="font-medium">{u.name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'role', label: 'Role', render: (u) => <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge> },
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
            <Button size="sm" variant="ghost" onClick={() => toggleRole(u.id)} title="Toggle role"><Shield className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => toast.info('Edit user')}><Edit className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => deleteUser(u.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />
    </div>
  );
};

export default AdminUsers;
