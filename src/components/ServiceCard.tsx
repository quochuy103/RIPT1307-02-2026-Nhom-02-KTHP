import { Clock, DollarSign } from 'lucide-react';
import { Service } from '@/data/mockData';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface Props {
  service: Service;
}

const ServiceCard = ({ service }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="group bg-card border border-border rounded-lg p-6 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-display text-lg font-semibold group-hover:text-primary transition-colors">{t(`serviceItems.${service.nameKey}`)}</h3>
        <span className="text-primary font-bold text-lg">${service.price}</span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{t(`serviceItems.${service.descKey}`)}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {service.duration} {t('services.min')}</span>
          <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {t(`services.categories.${service.category}`)}</span>
        </div>
        <Button asChild size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground">
          <Link to={`/booking?service=${service.id}`}>{t('services.book')}</Link>
        </Button>
      </div>
    </div>
  );
};

export default ServiceCard;
