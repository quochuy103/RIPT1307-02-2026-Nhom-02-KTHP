import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Scissors, UserRound, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { ApiError, api, type Booking } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  confirmed: 'default',
  done: 'secondary',
  cancelled: 'destructive',
  pending: 'outline',
};

const cancellableStatuses = new Set(['pending', 'confirmed']);

const getBookingError = (error: unknown, fallback: string) => {
  if (error instanceof ApiError && error.status === 401) {
    return 'Please sign in again to manage your bookings.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const MyBookingsPage = () => {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setBookings(await api.bookings.getMine());
    } catch (err) {
      setError(getBookingError(err, t('myBookings.loadError')));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const cancelBooking = async (booking: Booking) => {
    if (!window.confirm(t('myBookings.cancelConfirm'))) return;

    try {
      setCancellingId(booking.id);
      await api.bookings.cancel(booking.id);
      await loadBookings();
      toast.success(t('myBookings.cancelSuccess'));
    } catch (err) {
      toast.error(getBookingError(err, t('myBookings.cancelError')));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
            {t('myBookings.title')} <span className="text-gradient-gold">{t('myBookings.highlight')}</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">{t('myBookings.subtitle')}</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-36 rounded-lg border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-sm text-destructive mb-4">{error}</p>
              <Button variant="outline" onClick={loadBookings}>{t('common.retry')}</Button>
            </CardContent>
          </Card>
        ) : bookings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {t('myBookings.empty')}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const canCancel = cancellableStatuses.has(booking.status);
              return (
                <Card key={booking.id} className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="font-display text-xl font-semibold">{booking.serviceName}</h2>
                          <Badge variant={statusColors[booking.status] ?? 'outline'}>{t(`myBookings.status.${booking.status}`, { defaultValue: booking.status })}</Badge>
                        </div>

                        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          <span className="flex items-center gap-2">
                            <UserRound className="h-4 w-4 text-primary" />
                            {booking.barberName}
                          </span>
                          <span className="flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 text-primary" />
                            {booking.date} - {booking.time}
                          </span>
                          {booking.price !== undefined && (
                            <span className="flex items-center gap-2">
                              <Scissors className="h-4 w-4 text-primary" />
                              ${booking.price}
                            </span>
                          )}
                          {booking.duration !== undefined && (
                            <span>{booking.duration} {t('services.min')}</span>
                          )}
                        </div>
                      </div>

                      {canCancel && (
                        <Button
                          variant="outline"
                          className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          disabled={cancellingId === booking.id}
                          onClick={() => void cancelBooking(booking)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          {cancellingId === booking.id ? t('common.saving') : t('myBookings.cancel')}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;
