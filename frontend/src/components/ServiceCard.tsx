import { Clock, Tag } from 'lucide-react';
import { Service } from '@/data/mockData';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface Props {
  service: Service;
}

const ServiceCard = ({ service }: Props) => {
  const { t } = useTranslation();
  const serviceName = service.name || t(`serviceItems.${service.nameKey}`);
  const serviceDescription = service.description || t(`serviceItems.${service.descKey}`);
  const price = service.displayPrice ?? service.priceLabel ?? `${service.price.toLocaleString('vi-VN')}đ`;
  const category = service.categoryLabel ?? t(`services.categories.${service.category}`, { defaultValue: service.category });
  const actionLabel = service.actionLabel ?? t('services.book');

  return (
    <div className="group flex h-full flex-col rounded-lg border border-border bg-card p-5 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {category}
          </span>
          <h3 className="line-clamp-2 min-h-[3.5rem] font-display text-lg font-semibold leading-snug transition-colors group-hover:text-primary">{serviceName}</h3>
        </div>
        <span className="shrink-0 text-right text-lg font-bold text-primary">{price}</span>
      </div>
      <p className="mb-5 line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">{serviceDescription}</p>
      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> {service.duration} phút</span>
          <span className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-primary" /> {category}</span>
        </div>
        <Button asChild size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground">
          <Link to={`/booking?service=${service.id}`}>{actionLabel}</Link>
        </Button>
      </div>
    </div>
  );
};

export default ServiceCard;
