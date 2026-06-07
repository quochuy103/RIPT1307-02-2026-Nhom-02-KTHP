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
import { formatAdminCurrency } from '@/lib/admin-format';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { orderStatuses, type OrderStatus, type OrderStatusUpdate } from '@/types/order';
import { Input } from '@/components/ui/input';
import FilterDatePicker from '@/components/admin/FilterDatePicker';

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
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [totalFilter, setTotalFilter] = useState('');
  const [viewOrder, setViewOrder] = useState<AdminOrder | null>(null);

  const { data: orders = [], isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'orders', { statusFilter, userIdFilter, selectedDate, totalFilter }],
    queryFn: async () => {
      const result = await api.admin.getOrdersFiltered({
        status: statusFilter === 'all' ? undefined : statusFilter,
        userId: userIdFilter || undefined,
        dateFrom: selectedDate || undefined,
        dateTo: selectedDate || undefined,
        minTotal: totalFilter ? Number(totalFilter) : undefined,
      });
      return result.content;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatusUpdate }) => api.admin.updateOrderStatus(id, status),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ordersQueryKey });
      toast.success(t('admin.ordersPage.updated', { status: statusLabel(variables.status) }));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('admin.common.updateFailed')),
  });

  const updateStatus = (id: string, status: OrderStatusUpdate) => updateStatusMutation.mutate({ id, status });

  const statusLabel = (status: OrderStatus) => t(`admin.status.${status}`);

  const columns: Column<AdminOrder>[] = [
    { key: 'customerName', label: t('admin.fields.customer'), render: (order) => <span className="font-medium">{order.customerName}</span> },
    { key: 'products', label: t('admin.fields.products'), render: (order) => order.products.map((product) => product.name).join(', '), searchable: false },
    { key: 'totalPrice', label: t('admin.fields.total'), render: (order) => formatAdminCurrency(order.totalPrice, i18n.language) },
    { key: 'address', label: t('admin.fields.address') },
    { key: 'status', label: t('admin.fields.status'), render: (order) => <Badge variant={statusColors[order.status]}>{statusLabel(order.status)}</Badge> },
    { key: 'createdAt', label: t('admin.fields.date') },
  ];

  const resetFilters = () => {
    setStatusFilter('all');
    setUserIdFilter('');
    setSelectedDate('');
    setTotalFilter('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('admin.ordersPage.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('admin.ordersPage.count', { count: orders.length })}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.common.allStatus')}</SelectItem>
            {orderStatuses.map((status) => (
              <SelectItem key={status} value={status}>{statusLabel(status)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} placeholder={t('admin.ordersPage.userIdPlaceholder')} />
        <FilterDatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          placeholder={t('admin.ordersPage.selectDate')}
        />
        <Input type="number" min="0" value={totalFilter} onChange={(e) => setTotalFilter(e.target.value)} placeholder={t('admin.ordersPage.minTotal')} />
        <Button variant="outline" onClick={resetFilters}>
          {t('common.reset')}
        </Button>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>{t('admin.ordersPage.loadError')}</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : t('admin.common.loadFallback')}</AlertDescription>
        </Alert>
      )}

      <DataTable data={isLoading ? [] : orders} columns={columns} showSearch={false} actions={(order) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => setViewOrder(order)}><Eye className="h-4 w-4" /></Button>
          {order.status === 'pending' && <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, 'shipping')} disabled={updateStatusMutation.isPending}>{t('admin.ordersPage.ship')}</Button>}
          {order.status === 'paid' && <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, 'shipping')} disabled={updateStatusMutation.isPending}>{t('admin.ordersPage.ship')}</Button>}
          {order.status === 'shipping' && <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, 'shipped')} disabled={updateStatusMutation.isPending}>{t('admin.ordersPage.markShipped')}</Button>}
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
              <p className="mb-1 text-muted-foreground">{t('admin.fields.products')}:</p>
              {viewOrder.products.map((product, index) => (
                <p key={index} className="ml-2">{product.name} × {product.qty} - {formatAdminCurrency(product.price * product.qty, i18n.language)}</p>
              ))}
            </div>
            <p className="font-bold">{t('admin.fields.total')}: {formatAdminCurrency(viewOrder.totalPrice, i18n.language)}</p>
          </div>
        )}
      </FormModal>
    </div>
  );
};

export default AdminOrders;
