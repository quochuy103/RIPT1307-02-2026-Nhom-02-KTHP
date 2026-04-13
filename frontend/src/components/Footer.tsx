import { Link } from 'react-router-dom';
import { Scissors, Instagram, Facebook, Twitter, MapPin, Phone, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Scissors className="h-6 w-6 text-primary" />
              <span className="font-display text-xl font-bold text-gradient-gold">BLADE & CO</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">{t('footer.description')}</p>
            <div className="flex gap-4 mt-6">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="p-2 bg-secondary rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold mb-4">{t('footer.quickLinks')}</h4>
            <div className="flex flex-col gap-2">
              {[
                { key: 'nav.services', to: '/services' },
                { key: 'nav.bookNow', to: '/booking' },
                { key: 'nav.shop', to: '/shop' },
                { key: 'nav.gallery', to: '/gallery' },
                { key: 'nav.about', to: '/about' },
                { key: 'nav.contact', to: '/contact' },
              ].map(link => (
                <Link key={link.to} to={link.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t(link.key)}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold mb-4">{t('footer.hours')}</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {t('footer.monFri')}</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {t('footer.saturday')}</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {t('footer.sunday')}</div>
            </div>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold mb-4">{t('footer.contact')}</h4>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {t('footer.address')}</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {t('footer.phone')}</div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
