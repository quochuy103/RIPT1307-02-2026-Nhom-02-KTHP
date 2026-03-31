import { useState } from 'react';
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

const BookingPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const preselectedService = searchParams.get('service') || '';

  const [form, setForm] = useState({ name: '', phone: '', service: preselectedService, barber: '' });
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t('booking.errors.nameRequired');
    if (!form.phone.trim()) e.phone = t('booking.errors.phoneRequired');
    else if (!/^\+?[\d\s-]{7,15}$/.test(form.phone.trim())) e.phone = t('booking.errors.phoneInvalid');
    if (!form.service) e.service = t('booking.errors.serviceRequired');
    if (!form.barber) e.barber = t('booking.errors.barberRequired');
    if (!date) e.date = t('booking.errors.dateRequired');
    if (!time) e.time = t('booking.errors.timeRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
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
              <Select value={form.service} onValueChange={v => setForm(p => ({ ...p, service: v }))}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder={t('booking.selectService')} /></SelectTrigger>
                <SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{t(`serviceItems.${s.nameKey}`)} - ${s.price}</SelectItem>)}</SelectContent>
              </Select>
              {errors.service && <p className="text-destructive text-xs mt-1">{errors.service}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('booking.barber')}</label>
              <Select value={form.barber} onValueChange={v => setForm(p => ({ ...p, barber: v }))}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder={t('booking.selectBarber')} /></SelectTrigger>
                <SelectContent>{barbers.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
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
                <Calendar mode="single" selected={date} onSelect={setDate} disabled={d => d < new Date()} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            {errors.date && <p className="text-destructive text-xs mt-1">{errors.date}</p>}
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('booking.time')}</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {timeSlots.map(slot => (
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
            {errors.time && <p className="text-destructive text-xs mt-1">{errors.time}</p>}
          </div>

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-base py-6">
            {t('booking.confirm')}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default BookingPage;
