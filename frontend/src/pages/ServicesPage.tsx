import { useCallback, useEffect, useState } from 'react';
import { services } from '@/data/mockData';
import ServiceCard from '@/components/ServiceCard';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

const categories = ['all', 'haircut', 'styling', 'coloring', 'grooming'] as const;

const ServicesPage = () => {
  const [category, setCategory] = useState<string>('all');
  const [serviceList, setServiceList] = useState<typeof services>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const filtered = category === 'all' ? serviceList : serviceList.filter(s => s.category === category);

  const loadServices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedServices = await api.services.getAll();
      setServiceList(loadedServices);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('services.loadError'));
      setServiceList(services);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">{t('services.title')} <span className="text-gradient-gold">{t('services.highlight')}</span></h1>
          <p className="text-muted-foreground max-w-md mx-auto">{t('services.subtitle')}</p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                category === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(`services.categories.${cat}`)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-lg border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-8 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
                <p className="text-sm text-destructive mb-3">{error}</p>
                <Button variant="outline" size="sm" onClick={loadServices}>
                  {t('common.retry')}
                </Button>
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                {t('services.empty')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((s, i) => (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <ServiceCard service={s} />
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;
