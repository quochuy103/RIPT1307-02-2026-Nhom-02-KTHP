import { products } from '@/data/mockData';
import ProductCard from '@/components/ProductCard';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const ShopPage = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">{t('shop.title')} <span className="text-gradient-gold">{t('shop.highlight')}</span></h1>
          <p className="text-muted-foreground">{t('shop.subtitle')}</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <ProductCard product={p} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
