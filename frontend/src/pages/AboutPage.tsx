import BarberCard from '@/components/BarberCard';
import BarberReviewsModal from '@/components/BarberReviewsModal';
import { Scissors, Award, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Barber, Review } from '@/data/mockData';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const AboutPage = () => {
  const { t } = useTranslation();
  const [barberList, setBarberList] = useState<Barber[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [isBarberModalOpen, setIsBarberModalOpen] = useState(false);

  const sections = [
    { icon: Scissors, titleKey: 'about.storyTitle', textKey: 'about.storyText' },
    { icon: Award, titleKey: 'about.missionTitle', textKey: 'about.missionText' },
    { icon: Heart, titleKey: 'about.valuesTitle', textKey: 'about.valuesText' },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedBarbers, loadedReviews] = await Promise.all([
          api.barbers.getAll(),
          api.reviews.getAll(),
        ]);
        setBarberList(loadedBarbers);
        setReviews(loadedReviews);
      } catch {
        // Keep the page stable when related APIs are unavailable.
      }
    };

    void loadData();
  }, []);

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16 text-center">
          <h1 className="mb-3 font-display text-4xl font-bold leading-tight md:text-5xl">
            <span className="block">{t('about.title')}</span>
            <span className="block text-gradient-gold">{t('about.highlight')}</span>
          </h1>
          <p className="mx-auto max-w-lg text-muted-foreground">{t('about.subtitle')}</p>
        </motion.div>

        <div className="mb-20 grid grid-cols-1 gap-8 md:grid-cols-3">
          {sections.map((item, i) => (
            <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.1 }} className="rounded-xl border border-border bg-card p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 font-display text-xl font-semibold">{t(item.titleKey)}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t(item.textKey)}</p>
            </motion.div>
          ))}
        </div>

        <motion.div {...fadeUp} className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold mb-3">{t('about.teamTitle')} <span className="text-gradient-gold">{t('about.teamHighlight')}</span></h2>
        </motion.div>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {barberList.map((b, i) => (
            <motion.div key={b.id} {...fadeUp} transition={{ delay: i * 0.1 }}>
              <BarberCard
                barber={b}
                onClick={() => {
                  setSelectedBarber(b);
                  setIsBarberModalOpen(true);
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>

      <BarberReviewsModal
        isOpen={isBarberModalOpen}
        onClose={() => setIsBarberModalOpen(false)}
        barber={selectedBarber}
        reviews={reviews}
      />
    </div>
  );
};

export default AboutPage;
