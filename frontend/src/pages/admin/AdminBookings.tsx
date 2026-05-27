import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable, { Column } from '@/components/admin/DataTable';
import type { AdminBooking } from '@/data/adminMockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FormModal from '@/components/admin/FormModal';
import { api } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  confirmed: 'default', done: 'secondary', cancelled: 'destructive', pending: 'outline'
};
const bookingsQueryKey = ['admin', 'bookings'] as const;

const AdminBookings = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewBooking, setViewBooking] = useState<AdminBooking | null>(null);

  const { data: bookings = [], isLoading, isError, error } = useQuery({
    queryKey: bookingsQueryKey,
    queryFn: api.admin.getBookings,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminBooking['status'] }) => api.admin.updateBookingStatus(id, status),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: bookingsQueryKey });
      toast.success(t('admin.bookingsPage.updated', { status: t(`admin.status.${variables.status}`) }));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('admin.common.updateFailed')),
  });

  const filtered = statusFilter === 'all' ? bookings : bookings.filter((b) => b.status === statusFilter);

  const updateStatus = (id: string, status: AdminBooking['status']) => updateStatusMutation.mutate({ id, status });

  const columns: Column<AdminBooking>[] = [
    { key: 'userName', label: t('admin.fields.client'), render: (b) => <span className="font-medium">{b.userName}</span> },
    { key: 'serviceName', label: t('admin.fields.service') },
    { key: 'barberName', label: t('admin.fields.barber') },
    { key: 'date', label: t('admin.fields.date') },
    { key: 'time', label: t('admin.fields.time') },
    { key: 'price', label: t('admin.fields.price'), render: (b) => `${b.price.toLocaleString('vi-VN')}đ` },
    { key: 'status', label: t('admin.fields.status'), render: (b) => <Badge variant={statusColors[b.status]}>{t(`admin.status.${b.status}`)}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('admin.bookingsPage.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('admin.bookingsPage.count', { count: bookings.length })}</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.common.allStatus')}</SelectItem>
            <SelectItem value="pending">{t('admin.status.pending')}</SelectItem>
            <SelectItem value="confirmed">{t('admin.status.confirmed')}</SelectItem>
            <SelectItem value="done">{t('admin.status.done')}</SelectItem>
            <SelectItem value="cancelled">{t('admin.status.cancelled')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>{t('admin.bookingsPage.loadError')}</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : t('admin.common.loadFallback')}</AlertDescription>
        </Alert>
      )}

      <DataTable
        data={isLoading ? [] : filtered}
        columns={columns}
        searchPlaceholder={isLoading ? t('admin.bookingsPage.loading') : t('admin.bookingsPage.search')}
        actions={(b) => (
          <div className="flex items-center justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={() => setViewBooking(b)}><Eye className="h-4 w-4" /></Button>
            {b.status === 'pending' && (
              <>
                <Button size="sm" variant="ghost" onClick={() => updateStatus(b.id, 'confirmed')} disabled={updateStatusMutation.isPending}><CheckCircle className="h-4 w-4 text-green-400" /></Button>
                <Button size="sm" variant="ghost" onClick={() => updateStatus(b.id, 'cancelled')} disabled={updateStatusMutation.isPending}><XCircle className="h-4 w-4 text-destructive" /></Button>
              </>
            )}
          </div>
        )}
      />

      <FormModal open={!!viewBooking} onClose={() => setViewBooking(null)} title={t('admin.bookingsPage.details')} onSubmit={() => setViewBooking(null)} submitLabel={t('admin.modal.close')}>
        {viewBooking && (
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">{t('admin.fields.client')}:</span> {viewBooking.userName}</p>
            <p><span className="text-muted-foreground">{t('admin.fields.service')}:</span> {viewBooking.serviceName}</p>
            <p><span className="text-muted-foreground">{t('admin.fields.barber')}:</span> {viewBooking.barberName}</p>
            <p><span className="text-muted-foreground">{t('admin.fields.date')}:</span> {viewBooking.date}</p>
            <p><span className="text-muted-foreground">{t('admin.fields.time')}:</span> {viewBooking.time}</p>
            <p><span className="text-muted-foreground">{t('admin.fields.price')}:</span> {viewBooking.price.toLocaleString('vi-VN')}đ</p>
            <p><span className="text-muted-foreground">{t('admin.fields.status')}:</span> <Badge variant={statusColors[viewBooking.status]}>{t(`admin.status.${viewBooking.status}`)}</Badge></p>
          </div>
        )}
      </FormModal>
    </div>
  );
};

export default AdminBookings;
