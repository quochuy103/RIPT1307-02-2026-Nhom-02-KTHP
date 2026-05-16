import { useCallback, useEffect, useState } from 'react';
import { products as mockProducts } from '@/data/mockData';
import type { Product } from '@/data/mockData';
import ProductCard from '@/components/ProductCard';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const ShopPage = () => {
  const { t } = useTranslation();
  const [productList, setProductList] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.products.getAll();
      setProductList(data);
    } catch {
      // Fallback to mock data consistent with existing project pattern
      setProductList(mockProducts);
      setError(t('services.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">{t('shop.title')} <span className="text-gradient-gold">{t('shop.highlight')}</span></h1>
          <p className="text-muted-foreground">{t('shop.subtitle')}</p>
        </motion.div>

        {error && (
          <Card className="mb-6">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-amber-500 mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={() => void loadProducts()}>{t('common.retry')}</Button>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 rounded-lg border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : productList.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {t('shop.empty', { defaultValue: 'No products available right now.' })}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {productList.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
