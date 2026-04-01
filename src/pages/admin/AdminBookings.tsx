import { useState } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import { mockBookings, AdminBooking } from '@/data/adminMockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FormModal from '@/components/admin/FormModal';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  confirmed: 'default', done: 'secondary', cancelled: 'destructive', pending: 'outline'
};

const AdminBookings = () => {
  const [bookings, setBookings] = useState(mockBookings);
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewBooking, setViewBooking] = useState<AdminBooking | null>(null);

  const filtered = statusFilter === 'all' ? bookings : bookings.filter((b) => b.status === statusFilter);

  const updateStatus = (id: string, status: AdminBooking['status']) => {
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
    toast.success(`Booking ${status}`);
  };

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

      <DataTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search bookings..."
        actions={(b) => (
          <div className="flex items-center justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={() => setViewBooking(b)}><Eye className="h-4 w-4" /></Button>
            {b.status === 'pending' && (
              <>
                <Button size="sm" variant="ghost" onClick={() => updateStatus(b.id, 'confirmed')}><CheckCircle className="h-4 w-4 text-green-400" /></Button>
                <Button size="sm" variant="ghost" onClick={() => updateStatus(b.id, 'cancelled')}><XCircle className="h-4 w-4 text-destructive" /></Button>
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
