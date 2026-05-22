import { useEffect, useState } from 'react';
import { galleryImages } from '@/data/mockData';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';

const categories = ['all', 'fade', 'classic', 'modern', 'color'] as const;

const GalleryPage = () => {
  const [category, setCategory] = useState<string>('all');
  const [images, setImages] = useState(galleryImages);
  const { t } = useTranslation();
  const filtered = category === 'all' ? images : images.filter(i => i.category === category);

  useEffect(() => {
    const load = async () => {
      try {
        setImages(await api.gallery.getAll());
      } catch {
        // keep fallback
      }
    };
    void load();
  }, []);

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">{t('gallery.title')} <span className="text-gradient-gold">{t('gallery.highlight')}</span></h1>
          <p className="text-muted-foreground">{t('gallery.subtitle')}</p>
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
              {t(`gallery.categories.${cat}`)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((img, i) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group aspect-square overflow-hidden rounded-lg relative cursor-pointer"
            >
              <img src={img.src} alt={img.alt} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-primary font-display font-semibold">{t(`gallery.categories.${img.category}`)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GalleryPage;
