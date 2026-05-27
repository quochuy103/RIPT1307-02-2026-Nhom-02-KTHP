import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { services, barbers, timeSlots } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { ApiError, api, type Booking } from '@/lib/api';
import {
  BOOKING_NOTICE_MINUTES,
  MAX_BOOKINGS_PER_DATE,
  getAvailableTimeSlots,
  hasReachedBookingLimitForDate,
  isBookingTimeSelectable,
  isPastBookingDate,
  toApiTime,
} from '@/lib/booking-policy';

const getBookingErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError && error.status === 409) {
    return 'This time slot is already booked. Please choose another time.';
  }

  if (error instanceof ApiError && error.status === 401) {
    return 'Please sign in again before booking.';
  }

  if (error instanceof ApiError && error.status === 400 && error.message.includes('at most 3 bookings')) {
    return `You can only create ${MAX_BOOKINGS_PER_DATE} bookings for the same appointment date, even if some were cancelled.`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const BookingPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const preselectedService = searchParams.get('service') || '';

  const [serviceList, setServiceList] = useState(services);
  const [barberList, setBarberList] = useState(barbers);
  const [form, setForm] = useState({ name: '', phone: '', service: preselectedService, barber: '' });
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const availableTimeSlots = getAvailableTimeSlots(date, timeSlots);
  const selectedDateKey = date ? format(date, 'yyyy-MM-dd') : null;
  const hasReachedBookingLimit = selectedDateKey ? hasReachedBookingLimitForDate(existingBookings, selectedDateKey) : false;

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoadingOptions(true);
        setLoadError(null);
        const [loadedServices, loadedBarbers, loadedBookings] = await Promise.allSettled([
          api.services.getAll(),
          api.barbers.getAll(),
          api.bookings.getMine(),
        ]);

        if (loadedServices.status === 'fulfilled') setServiceList(loadedServices.value);
        else setServiceList(services);

        if (loadedBarbers.status === 'fulfilled') setBarberList(loadedBarbers.value);
        else setBarberList(barbers);

        if (loadedBookings.status === 'fulfilled') setExistingBookings(loadedBookings.value);
        else setExistingBookings([]);

        if (loadedServices.status === 'rejected' || loadedBarbers.status === 'rejected') {
          setLoadError('Unable to load booking options');
        }
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Unable to load booking options');
        setServiceList(services);
        setBarberList(barbers);
        setExistingBookings([]);
      } finally {
        setIsLoadingOptions(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (time && !getAvailableTimeSlots(date, timeSlots).includes(time)) {
      setTime('');
    }
  }, [date, time]);

  useEffect(() => {
    if (hasReachedBookingLimit) {
      setTime('');
    }
  }, [hasReachedBookingLimit]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t('booking.errors.nameRequired');
    if (!form.phone.trim()) e.phone = t('booking.errors.phoneRequired');
    else if (!/^\+?[\d\s-]{7,15}$/.test(form.phone.trim())) e.phone = t('booking.errors.phoneInvalid');
    if (!form.service) e.service = t('booking.errors.serviceRequired');
    if (!form.barber) e.barber = t('booking.errors.barberRequired');
    if (!date) e.date = t('booking.errors.dateRequired');
    if (!time) e.time = t('booking.errors.timeRequired');
    if (selectedDateKey && hasReachedBookingLimit) {
      e.date = `You already created ${MAX_BOOKINGS_PER_DATE} bookings on ${selectedDateKey}. Cancelling one does not reopen that date.`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;
    if (!date || !isBookingTimeSelectable(date, time)) {
      setErrors((previous) => ({
        ...previous,
        time: t('booking.errors.timeUnavailable', { defaultValue: 'This time slot is no longer available. Please choose another one.' }),
      }));
      toast.error(t('booking.errors.sameDayLeadTime', {
        minutes: BOOKING_NOTICE_MINUTES,
        defaultValue: 'Please choose a slot at least {{minutes}} minutes from now.',
      }));
      return;
    }

    try {
      setIsSubmitting(true);
      await api.bookings.create({
        serviceId: Number(form.service),
        barberId: Number(form.barber),
        date: date ? format(date, 'yyyy-MM-dd') : '',
        time: toApiTime(time),
      });
      setExistingBookings((previous) => previous.concat({
        id: `local-${Date.now()}`,
        serviceName: '',
        barberName: '',
        date: format(date, 'yyyy-MM-dd'),
        time: toApiTime(time),
        status: 'pending',
      }));
    } catch (error) {
      toast.error(getBookingErrorMessage(error, t('booking.errors.submitFailed')));
      return;
    } finally {
      setIsSubmitting(false);
    }

    setSubmitted(true);
    toast.success(t('booking.successToast'));
  };

  if (submitted) {
    return (
      <div className="pt-24 pb-20 min-h-screen flex items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <CheckCircle className="h-20 w-20 text-primary mx-auto mb-6" />
          <h2 className="font-display text-3xl font-bold mb-3">{t('booking.confirmed')}</h2>
          <p className="text-muted-foreground mb-2">{t('booking.thankYou')} {form.name}.</p>
          <p className="text-muted-foreground mb-6">{date && format(date, 'MMMM d, yyyy')} — {time}</p>
          <Button onClick={() => { setSubmitted(false); setForm({ name: '', phone: '', service: '', barber: '' }); setDate(undefined); setTime(''); }} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
            {t('booking.bookAnother')}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold mb-3">{t('booking.title')} <span className="text-gradient-gold">{t('booking.highlight')}</span></h1>
          <p className="text-muted-foreground">{t('booking.subtitle')}</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border rounded-xl p-6 md:p-8">
          {loadError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {loadError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('booking.name')}</label>
              <Input placeholder={t('booking.namePlaceholder')} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="bg-secondary border-border" />
              {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('booking.phone')}</label>
              <Input placeholder={t('booking.phonePlaceholder')} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="bg-secondary border-border" />
              {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('booking.service')}</label>
              <Select value={form.service} onValueChange={v => setForm(p => ({ ...p, service: v }))} disabled={isLoadingOptions}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder={isLoadingOptions ? t('common.loading') : t('booking.selectService')} /></SelectTrigger>
                <SelectContent>
                  {serviceList.map(s => <SelectItem key={s.id} value={s.id}>{s.name || t(`serviceItems.${s.nameKey}`)} - ${s.price}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.service && <p className="text-destructive text-xs mt-1">{errors.service}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('booking.barber')}</label>
              <Select value={form.barber} onValueChange={v => setForm(p => ({ ...p, barber: v }))} disabled={isLoadingOptions}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder={isLoadingOptions ? t('common.loading') : t('booking.selectBarber')} /></SelectTrigger>
                <SelectContent>
                  {barberList.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.barber && <p className="text-destructive text-xs mt-1">{errors.barber}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('booking.date')}</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start bg-secondary border-border', !date && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : t('booking.pickDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} disabled={isPastBookingDate} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            {errors.date && <p className="text-destructive text-xs mt-1">{errors.date}</p>}
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('booking.time')}</label>
            {!hasReachedBookingLimit && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {availableTimeSlots.map(slot => (
                  <button
                    type="button"
                    key={slot}
                    onClick={() => setTime(slot)}
                    className={cn(
                      'py-2 px-1 rounded-md text-xs font-medium transition-all',
                      time === slot ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
            {selectedDateKey && hasReachedBookingLimit && (
              <p className="text-muted-foreground text-xs mt-2">
                {`You already created ${MAX_BOOKINGS_PER_DATE} bookings on ${selectedDateKey}. Cancelling one does not let you book another on that date.`}
              </p>
            )}
            {date && availableTimeSlots.length === 0 && (
              <p className="text-muted-foreground text-xs mt-2">
                {t('booking.noAvailableSlots', { defaultValue: 'There are no remaining bookable time slots for the selected day.' })}
              </p>
            )}
            {date && availableTimeSlots.length > 0 && availableTimeSlots.length < timeSlots.length && (
              <p className="text-muted-foreground text-xs mt-2">
                {t('booking.todayLeadTimeNotice', {
                  minutes: BOOKING_NOTICE_MINUTES,
                  defaultValue: 'Same-day bookings must be made at least {{minutes}} minutes in advance.',
                })}
              </p>
            )}
            {errors.time && <p className="text-destructive text-xs mt-1">{errors.time}</p>}
          </div>

          <Button type="submit" disabled={isSubmitting || isLoadingOptions || hasReachedBookingLimit} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-base py-6">
            {isSubmitting ? t('common.saving') : t('booking.confirm')}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default BookingPage;
