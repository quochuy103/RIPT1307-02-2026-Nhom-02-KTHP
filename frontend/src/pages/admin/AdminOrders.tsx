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
import { useTranslation } from 'react-i18next';
import { orderStatuses, type OrderStatus, type OrderStatusUpdate } from '@/types/order';

const statusColors: Record<OrderStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'outline',
  paid: 'secondary',
  shipping: 'secondary',
  shipped: 'default',
  delivered: 'default',
  cancelled: 'destructive',
};
const ordersQueryKey = ['admin', 'orders'] as const;

const AdminOrders = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewOrder, setViewOrder] = useState<AdminOrder | null>(null);

  const { data: orders = [], isLoading, isError, error } = useQuery({
    queryKey: ordersQueryKey,
    queryFn: api.admin.getOrders,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatusUpdate }) => api.admin.updateOrderStatus(id, status),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ordersQueryKey });
      toast.success(t('admin.ordersPage.updated', { status: statusLabel(variables.status) }));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('admin.common.updateFailed')),
  });

  const filtered = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);

  const updateStatus = (id: string, status: OrderStatusUpdate) => updateStatusMutation.mutate({ id, status });

  const statusLabel = (status: OrderStatus) => t(`admin.status.${status}`);

  const columns: Column<AdminOrder>[] = [
    { key: 'customerName', label: t('admin.fields.customer'), render: (o) => <span className="font-medium">{o.customerName}</span> },
    { key: 'products', label: t('admin.fields.products'), render: (o) => o.products.map((p) => p.name).join(', '), searchable: false },
    { key: 'totalPrice', label: t('admin.fields.total'), render: (o) => `${o.totalPrice.toLocaleString('vi-VN')}đ` },
    { key: 'address', label: t('admin.fields.address') },
    { key: 'status', label: t('admin.fields.status'), render: (o) => <Badge variant={statusColors[o.status]}>{statusLabel(o.status)}</Badge> },
    { key: 'createdAt', label: t('admin.fields.date') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('admin.ordersPage.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('admin.ordersPage.count', { count: orders.length })}</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.common.allStatus')}</SelectItem>
            {orderStatuses.map((status) => (
              <SelectItem key={status} value={status}>{statusLabel(status)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>{t('admin.ordersPage.loadError')}</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : t('admin.common.loadFallback')}</AlertDescription>
        </Alert>
      )}

      <DataTable data={isLoading ? [] : filtered} columns={columns} searchPlaceholder={isLoading ? t('admin.ordersPage.loading') : t('admin.ordersPage.search')} actions={(o) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => setViewOrder(o)}><Eye className="h-4 w-4" /></Button>
          {o.status === 'pending' && <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, 'shipping')} disabled={updateStatusMutation.isPending}>{t('admin.ordersPage.ship')}</Button>}
          {o.status === 'paid' && <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, 'shipping')} disabled={updateStatusMutation.isPending}>{t('admin.ordersPage.ship')}</Button>}
          {o.status === 'shipping' && <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, 'shipped')} disabled={updateStatusMutation.isPending}>{t('admin.ordersPage.markShipped')}</Button>}
        </div>
      )} />

      <FormModal open={!!viewOrder} onClose={() => setViewOrder(null)} title={t('admin.ordersPage.details')} onSubmit={() => setViewOrder(null)} submitLabel={t('admin.modal.close')}>
        {viewOrder && (
          <div className="space-y-3 text-sm">
            <p><span className="text-muted-foreground">{t('admin.fields.customer')}:</span> {viewOrder.customerName}</p>
            <p><span className="text-muted-foreground">{t('admin.fields.address')}:</span> {viewOrder.address}</p>
            <p><span className="text-muted-foreground">{t('admin.fields.date')}:</span> {viewOrder.createdAt}</p>
            <p><span className="text-muted-foreground">{t('admin.fields.status')}:</span> <Badge variant={statusColors[viewOrder.status]}>{statusLabel(viewOrder.status)}</Badge></p>
            <div>
              <p className="text-muted-foreground mb-1">{t('admin.fields.products')}:</p>
              {viewOrder.products.map((p, i) => (
                <p key={i} className="ml-2">{p.name} × {p.qty} - {(p.price * p.qty).toLocaleString('vi-VN')}đ</p>
              ))}
            </div>
            <p className="font-bold">{t('admin.fields.total')}: {viewOrder.totalPrice.toLocaleString('vi-VN')}đ</p>
          </div>
        )}
      </FormModal>
    </div>
  );
};

export default AdminOrders;
