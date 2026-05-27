import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const googleMapsUrl = 'https://maps.app.goo.gl/MagSxtSMpLVifY7s8';
const googleMapsEmbedUrl = 'https://www.google.com/maps?q=L%C3%AC%20He%20Hair%20Designer%2C%20%C4%90%C6%B0%E1%BB%9Dng%20Ph%C3%B3%20%C4%90%E1%BB%A9c%20Ch%C3%ADnh%2C%20V%C4%83n%20Nhu%E1%BA%BF%2C%20M%E1%BB%B9%20H%C3%A0o%2C%20H%C6%B0ng%20Y%C3%AAn%2C%20Vietnam&output=embed';

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { toast.error(t('contact.fillAll')); return; }
    toast.success(t('contact.sent'));
    setForm({ name: '', email: '', message: '' });
  };

  const info = [
    { icon: MapPin, label: t('contact.address'), value: t('contact.addressValue') },
    { icon: Phone, label: t('contact.phone'), value: t('contact.phoneValue') },
    { icon: Mail, label: t('contact.email'), value: t('contact.emailValue') },
    { icon: Clock, label: t('contact.hours'), value: t('contact.hoursValue') },
  ];

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">{t('contact.title')} <span className="text-gradient-gold">{t('contact.highlight')}</span></h1>
          <p className="text-muted-foreground">{t('contact.subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div className="space-y-8">
            {info.map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">{item.label}</h3>
                  <p className="text-sm text-muted-foreground">{item.value}</p>
                </div>
              </div>
            ))}

            <div className="rounded-xl overflow-hidden border border-border h-64">
              <iframe
                src={googleMapsEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'grayscale(1) invert(0.9) contrast(1.2)' }}
                allowFullScreen
                loading="lazy"
                title="Lì He Men's Hair Designer location"
              />
            </div>
            <Button asChild variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/10">
              <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                Google Maps
              </a>
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 md:p-8 space-y-4 h-fit">
            <h2 className="font-display text-2xl font-semibold mb-2">{t('contact.formTitle')}</h2>
            <Input placeholder={t('contact.yourName')} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="bg-secondary border-border" />
            <Input type="email" placeholder={t('contact.yourEmail')} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="bg-secondary border-border" />
            <Textarea placeholder={t('contact.yourMessage')} rows={5} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} className="bg-secondary border-border" />
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">{t('contact.send')}</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
