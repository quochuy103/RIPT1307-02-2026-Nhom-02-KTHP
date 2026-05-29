import { barbers } from '@/data/mockData';
import BarberCard from '@/components/BarberCard';
import BarberReviewsModal from '@/components/BarberReviewsModal';
import { Scissors, Award, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const AboutPage = () => {
  const { t } = useTranslation();
  const [barberList, setBarberList] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  
  // Barber Modal State
  const [selectedBarber, setSelectedBarber] = useState<any | null>(null);
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
          api.reviews.getAll()
        ]);
        setBarberList(loadedBarbers);
        setReviews(loadedReviews);
      } catch {
        // Fallback or keep empty
      }
    };

    void loadData();
  }, []);


  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="mb-3 font-display text-4xl font-bold leading-tight md:text-5xl">
            <span className="block">{t('about.title')}</span>
            <span className="block text-gradient-gold">{t('about.highlight')}</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">{t('about.subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {sections.map((item, i) => (
            <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.1 }} className="bg-card border border-border rounded-xl p-8 text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">{t(item.titleKey)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(item.textKey)}</p>
            </motion.div>
          ))}
        </div>

        <motion.div {...fadeUp} className="text-center mb-12">
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

      {/* Barber Reviews Modal */}
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

