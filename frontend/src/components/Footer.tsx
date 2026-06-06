import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Facebook, MapPin, Phone, Clock, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  const [selectedContact, setSelectedContact] = useState<'facebook' | 'gmail' | 'phone'>('gmail');

  const contactOptions = {
    facebook: {
      label: 'Facebook',
      value: 'https://www.facebook.com/share/17R3upwr9J/?mibextid=wwXIfr',
      href: 'https://www.facebook.com/share/17R3upwr9J/?mibextid=wwXIfr',
      icon: Facebook,
    },
    gmail: {
      label: 'Gmail',
      value: 'Lihebarbershop@gmail.com',
      href: 'mailto:Lihebarbershop@gmail.com',
      icon: Mail,
    },
    phone: {
      label: 'Phone',
      value: '0986.835.128',
      href: 'tel:0986835128',
      icon: Phone,
    },
  } as const;

  const activeContact = contactOptions[selectedContact];
  const contactButtons: Array<'facebook' | 'gmail' | 'phone'> = ['facebook', 'gmail', 'phone'];

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="mb-4 flex items-center gap-2">
              <Scissors className="h-6 w-6 text-primary" />
              <span className="font-display text-xl font-bold text-gradient-gold">Li He Men's Hair Designer</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">{t('footer.description')}</p>
            <div className="mt-6 flex gap-4">
              {contactButtons.map((contactKey) => {
                const option = contactOptions[contactKey];
                const Icon = option.icon;

                return (
                  <button
                    key={contactKey}
                    type="button"
                    onClick={() => setSelectedContact(contactKey)}
                    className={`rounded-lg p-2 transition-all ${
                      selectedContact === contactKey
                        ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                        : 'bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary'
                    }`}
                    aria-label={option.label}
                    title={option.label}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
            <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {activeContact.label}
              </p>
              <a
                href={activeContact.href}
                target={selectedContact === 'facebook' ? '_blank' : undefined}
                rel={selectedContact === 'facebook' ? 'noreferrer' : undefined}
                className="mt-2 block break-all text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                {activeContact.value}
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-display text-lg font-semibold">{t('footer.quickLinks')}</h4>
            <div className="flex flex-col gap-2">
              {[
                { key: 'nav.services', to: '/services' },
                { key: 'nav.bookNow', to: '/booking' },
                { key: 'nav.shop', to: '/shop' },
                { key: 'nav.gallery', to: '/gallery' },
                { key: 'nav.about', to: '/about' },
                { key: 'nav.contact', to: '/contact' },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  {t(link.key)}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-display text-lg font-semibold">{t('footer.hours')}</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                {t('footer.monFri')}
              </div>
              <a href="tel:0986835128" className="flex items-center gap-2 transition-colors hover:text-primary">
                <Phone className="h-4 w-4 text-primary" />
                0986.835.128
              </a>
              <a href="mailto:Lihebarbershop@gmail.com" className="flex items-center gap-2 break-all transition-colors hover:text-primary">
                <Mail className="h-4 w-4 text-primary" />
                Lihebarbershop@gmail.com
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-display text-lg font-semibold">{t('footer.contact')}</h4>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {t('footer.address')}
              </div>
              <a href="tel:0986835128" className="flex items-center gap-2 transition-colors hover:text-primary">
                <Phone className="h-4 w-4 text-primary" />
                0986.835.128
              </a>
              <a
                href="https://www.facebook.com/share/17R3upwr9J/?mibextid=wwXIfr"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 break-all transition-colors hover:text-primary"
              >
                <Facebook className="h-4 w-4 text-primary" />
                facebook.com/share/17R3upwr9J
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
