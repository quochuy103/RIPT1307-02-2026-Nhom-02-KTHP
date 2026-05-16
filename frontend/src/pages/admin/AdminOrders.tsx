import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable, { Column } from '@/components/admin/DataTable';
import type { AdminOrder } from '@/data/adminMockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FormModal from '@/components/admin/FormModal';
import { api } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const statusColors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  shipped: 'default', shipping: 'secondary', paid: 'secondary', pending: 'outline', cancelled: 'destructive'
};
const ordersQueryKey = ['admin', 'orders'] as const;

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewOrder, setViewOrder] = useState<AdminOrder | null>(null);

  const { data: orders = [], isLoading, isError, error } = useQuery({
    queryKey: ordersQueryKey,
    queryFn: api.admin.getOrders,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminOrder['status'] }) => api.admin.updateOrderStatus(id, status),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ordersQueryKey });
      toast.success(`Order status updated to ${variables.status}`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Update failed'),
  });

  const filtered = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);

  const updateStatus = (id: string, status: AdminOrder['status']) => updateStatusMutation.mutate({ id, status });

  const columns: Column<AdminOrder>[] = [
    { key: 'customerName', label: 'Customer', render: (o) => <span className="font-medium">{o.customerName}</span> },
    { key: 'products', label: 'Products', render: (o) => o.products.map((p) => p.name).join(', '), searchable: false },
    { key: 'totalPrice', label: 'Total', render: (o) => `$${o.totalPrice.toFixed(2)}` },
    { key: 'address', label: 'Address' },
    { key: 'status', label: 'Status', render: (o) => <Badge variant={statusColors[o.status]}>{o.status}</Badge> },
    { key: 'createdAt', label: 'Date' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Order Management</h1>
          <p className="text-sm text-muted-foreground">{orders.length} total orders</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="shipping">Shipping</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Could not load orders</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : 'Please check your admin access and API route.'}</AlertDescription>
        </Alert>
      )}

      <DataTable data={isLoading ? [] : filtered} columns={columns} searchPlaceholder={isLoading ? 'Loading orders...' : 'Search orders...'} actions={(o) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => setViewOrder(o)}><Eye className="h-4 w-4" /></Button>
          {o.status === 'pending' && <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, 'shipping')} disabled={updateStatusMutation.isPending}>Ship</Button>}
          {o.status === 'shipping' && <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, 'shipped')} disabled={updateStatusMutation.isPending}>Deliver</Button>}
        </div>
      )} />

      <FormModal open={!!viewOrder} onClose={() => setViewOrder(null)} title="Order Details" onSubmit={() => setViewOrder(null)} submitLabel="Close">
        {viewOrder && (
          <div className="space-y-3 text-sm">
            <p><span className="text-muted-foreground">Customer:</span> {viewOrder.customerName}</p>
            <p><span className="text-muted-foreground">Address:</span> {viewOrder.address}</p>
            <p><span className="text-muted-foreground">Date:</span> {viewOrder.createdAt}</p>
            <p><span className="text-muted-foreground">Status:</span> <Badge variant={statusColors[viewOrder.status]}>{viewOrder.status}</Badge></p>
            <div>
              <p className="text-muted-foreground mb-1">Products:</p>
              {viewOrder.products.map((p, i) => (
                <p key={i} className="ml-2">{p.name} × {p.qty} — ${(p.price * p.qty).toFixed(2)}</p>
              ))}
            </div>
            <p className="font-bold">Total: ${viewOrder.totalPrice.toFixed(2)}</p>
          </div>
        )}
      </FormModal>
    </div>
  );
};

export default AdminOrders;
