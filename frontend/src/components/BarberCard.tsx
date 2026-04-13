import { Star } from 'lucide-react';
import { Barber } from '@/data/mockData';
import { useTranslation } from 'react-i18next';

interface Props {
  barber: Barber;
}

const BarberCard = ({ barber }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="group text-center">
      <div className="relative w-48 h-48 mx-auto mb-4 rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-colors duration-300">
        <img src={barber.image} alt={barber.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      </div>
      <h3 className="font-display text-lg font-semibold">{barber.name}</h3>
      <p className="text-primary text-sm mb-1">{barber.role}</p>
      <p className="text-xs text-muted-foreground mb-2">{barber.experience} {t('common.yearsExperience')}</p>
      <div className="flex items-center justify-center gap-1">
        <Star className="h-3 w-3 fill-primary text-primary" />
        <span className="text-sm font-medium">{barber.rating}</span>
      </div>
      <div className="flex flex-wrap justify-center gap-1 mt-2">
        {barber.specialties.map(s => (
          <span key={s} className="text-xs px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">{s}</span>
        ))}
      </div>
    </div>
  );
};

export default BarberCard;
