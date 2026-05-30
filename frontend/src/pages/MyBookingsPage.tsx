import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Scissors, Star, UserRound, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { ApiError, api, type Booking } from '@/lib/api';
import BookingReviewModal, { type BookingReviewTarget } from '@/components/BookingReviewModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  BOOKING_NOTICE_MINUTES,
  MAX_CANCELLATIONS_PER_DATE,
  canCancelBooking,
  hasReachedCancellationLimitForDate,
} from '@/lib/booking-policy';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  if (error instanceof ApiError && error.status === 400 && error.message.includes('at most 3 bookings for the selected appointment date')) {
    return `You can only cancel ${MAX_CANCELLATIONS_PER_DATE} bookings for the same appointment date.`;
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
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<BookingReviewTarget | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'done' | 'cancelled'>('all');

  const loadBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setBookings(await api.bookings.getMine(statusFilter === 'all' ? undefined : statusFilter));
    } catch (err) {
      setError(getBookingError(err, t('myBookings.loadError')));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, t]);

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

  const openReviewModal = (booking: Booking) => {
    setSelectedBookingForReview({
      bookingId: Number(booking.id),
      serviceName: booking.serviceName,
      barberName: booking.barberName,
      date: booking.date,
      time: booking.time,
    });
    setIsReviewModalOpen(true);
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

        <div className="mb-6 flex justify-end">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.common.allStatus')}</SelectItem>
              <SelectItem value="pending">{t('myBookings.status.pending', { defaultValue: 'Pending' })}</SelectItem>
              <SelectItem value="confirmed">{t('myBookings.status.confirmed', { defaultValue: 'Confirmed' })}</SelectItem>
              <SelectItem value="done">{t('myBookings.status.done', { defaultValue: 'Done' })}</SelectItem>
              <SelectItem value="cancelled">{t('myBookings.status.cancelled', { defaultValue: 'Cancelled' })}</SelectItem>
            </SelectContent>
          </Select>
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
              const canCancelByStatus = cancellableStatuses.has(booking.status);
              const hasReachedCancellationLimit = hasReachedCancellationLimitForDate(bookings, booking.date);
              const canCancel = canCancelBooking(booking) && !hasReachedCancellationLimit;
              const canReview = booking.reviewEligible && !booking.reviewSubmitted;
              return (
                <Card key={booking.id} className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="font-display text-xl font-semibold">{booking.serviceName}</h2>
                          <Badge variant={statusColors[booking.status.toLowerCase()] ?? 'outline'}>{t(`myBookings.status.${booking.status.toLowerCase()}`, { defaultValue: booking.status })}</Badge>
                          {booking.reviewSubmitted && (
                            <Badge variant="secondary">
                              {booking.overallRating ? `${booking.overallRating}/5` : t('myBookings.reviewed', { defaultValue: 'Đã đánh giá' })}
                            </Badge>
                          )}
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

                      <div className="flex flex-col items-stretch gap-2 md:items-end">
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
                        {canCancelByStatus && !canCancel && (
                          <p className="max-w-56 text-xs text-muted-foreground md:text-right">
                            {hasReachedCancellationLimit
                              ? `You already cancelled ${MAX_CANCELLATIONS_PER_DATE} bookings on ${booking.date}.`
                              : t('myBookings.cancelWindowNotice', {
                                  minutes: BOOKING_NOTICE_MINUTES,
                                  defaultValue: 'Bookings can only be cancelled at least {{minutes}} minutes before the appointment.',
                                })}
                          </p>
                        )}
                        {canReview && (
                          <Button
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => openReviewModal(booking)}
                          >
                            <Star className="mr-2 h-4 w-4" />
                            {t('myBookings.reviewAction', { defaultValue: 'Đánh giá' })}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <BookingReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedBookingForReview(null);
        }}
        onSubmitSuccess={() => {
          void loadBookings();
        }}
        target={selectedBookingForReview}
      />
    </div>
  );
};

export default MyBookingsPage;
