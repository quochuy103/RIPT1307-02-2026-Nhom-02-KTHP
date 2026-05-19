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

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  confirmed: 'default', done: 'secondary', cancelled: 'destructive', pending: 'outline'
};
const bookingsQueryKey = ['admin', 'bookings'] as const;

const AdminBookings = () => {
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
      toast.success(`Booking ${variables.status}`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Update failed'),
  });

  const filtered = statusFilter === 'all' ? bookings : bookings.filter((b) => b.status === statusFilter);

  const updateStatus = (id: string, status: AdminBooking['status']) => updateStatusMutation.mutate({ id, status });

  const columns: Column<AdminBooking>[] = [
    { key: 'userName', label: 'Client', render: (b) => <span className="font-medium">{b.userName}</span> },
    { key: 'serviceName', label: 'Service' },
    { key: 'barberName', label: 'Barber' },
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time' },
    { key: 'price', label: 'Price', render: (b) => `$${b.price}` },
    { key: 'status', label: 'Status', render: (b) => <Badge variant={statusColors[b.status]}>{b.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Booking Management</h1>
          <p className="text-sm text-muted-foreground">{bookings.length} total bookings</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Could not load bookings</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : 'Please check your admin access and API route.'}</AlertDescription>
        </Alert>
      )}

      <DataTable
        data={isLoading ? [] : filtered}
        columns={columns}
        searchPlaceholder={isLoading ? 'Loading bookings...' : 'Search bookings...'}
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

      <FormModal open={!!viewBooking} onClose={() => setViewBooking(null)} title="Booking Details" onSubmit={() => setViewBooking(null)} submitLabel="Close">
        {viewBooking && (
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Client:</span> {viewBooking.userName}</p>
            <p><span className="text-muted-foreground">Service:</span> {viewBooking.serviceName}</p>
            <p><span className="text-muted-foreground">Barber:</span> {viewBooking.barberName}</p>
            <p><span className="text-muted-foreground">Date:</span> {viewBooking.date}</p>
            <p><span className="text-muted-foreground">Time:</span> {viewBooking.time}</p>
            <p><span className="text-muted-foreground">Price:</span> ${viewBooking.price}</p>
            <p><span className="text-muted-foreground">Status:</span> <Badge variant={statusColors[viewBooking.status]}>{viewBooking.status}</Badge></p>
          </div>
        )}
      </FormModal>
    </div>
  );
};

export default AdminBookings;
