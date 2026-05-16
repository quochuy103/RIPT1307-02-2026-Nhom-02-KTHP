import { useCallback, useEffect, useState } from 'react';
import { Package, CalendarDays, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ApiError, api, type Order } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  delivered: 'default',
  shipping: 'secondary',
  pending: 'outline',
};

const getOrderError = (error: unknown, fallback: string) => {
  if (error instanceof ApiError && error.status === 401) {
    return 'Please sign in again to view your orders.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

const MyOrdersPage = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setOrders(await api.orders.getMyOrders());
    } catch (err) {
      setError(getOrderError(err, t('myOrders.loadError')));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
            {t('myOrders.title')} <span className="text-gradient-gold">{t('myOrders.highlight')}</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">{t('myOrders.subtitle')}</p>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-40 rounded-lg border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-sm text-destructive mb-4">{error}</p>
              <Button variant="outline" onClick={() => void loadOrders()}>{t('common.retry')}</Button>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {t('myOrders.empty')}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-3 flex-1">
                        {/* Order header */}
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-display text-sm font-semibold text-muted-foreground">
                            {t('myOrders.orderId')} #{order.id}
                          </span>
                          <Badge variant={statusColors[order.status] ?? 'outline'}>
                            {t(`myOrders.status.${order.status}`, { defaultValue: order.status })}
                          </Badge>
                        </div>

                        {/* Products list */}
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            {t('myOrders.products')}
                          </p>
                          {order.products.map((p, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2">
                                <Package className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                <span>{p.name}</span>
                                <span className="text-muted-foreground">× {p.qty}</span>
                              </span>
                              <span className="text-muted-foreground">${(p.price * p.qty).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Meta info */}
                        <div className="grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                          <span className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            {order.createdAt ? order.createdAt.slice(0, 10) : '—'}
                          </span>
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="truncate">{order.address}</span>
                          </span>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="flex flex-col items-end gap-1 min-w-[100px]">
                        <p className="text-xs text-muted-foreground">{t('myOrders.total')}</p>
                        <p className="font-bold text-lg text-primary">${order.totalPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;
