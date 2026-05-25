import { useCallback, useEffect, useState } from 'react';
import { Package, CalendarDays, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ApiError, api, type Order } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import type { OrderStatus } from '@/types/order';
import { formatVND } from '@/lib/format';

const PAGE_SIZE = 10;

const statusColors: Record<OrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  paid: 'secondary',
  shipping: 'secondary',
  shipped: 'default',
  delivered: 'default',
  cancelled: 'destructive',
};

const formatOrderDate = (value: string) => {
  if (!value) return '-';

  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);

  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(date);
  }

  return value.split(/[T ]/)[0] || '-';
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
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const loadOrders = useCallback(async (page: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await api.orders.getMyOrdersPaged(page, PAGE_SIZE);
      setOrders(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
      setCurrentPage(result.number);
    } catch (err) {
      setError(getOrderError(err, t('myOrders.loadError')));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadOrders(0);
  }, [loadOrders]);

  const handlePrev = () => {
    if (currentPage > 0) void loadOrders(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) void loadOrders(currentPage + 1);
  };

  const handlePageClick = (page: number) => {
    if (page !== currentPage) void loadOrders(page);
  };

  // Build page number buttons: always show first, last, current ±1, with ellipsis
  const buildPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    const pages: (number | 'ellipsis')[] = [];
    const addPage = (p: number) => {
      if (!pages.includes(p)) pages.push(p);
    };
    addPage(0);
    if (currentPage > 2) pages.push('ellipsis');
    for (let p = Math.max(1, currentPage - 1); p <= Math.min(totalPages - 2, currentPage + 1); p++) {
      addPage(p);
    }
    if (currentPage < totalPages - 3) pages.push('ellipsis');
    addPage(totalPages - 1);
    return pages;
  };

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
          {!isLoading && !error && totalElements > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('myOrders.page')} {currentPage + 1} {t('myOrders.of')} {totalPages}
              {' · '}{totalElements} {totalElements === 1 ? t('myOrders.orderId') : t('myOrders.orderId')}
            </p>
          )}
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
              <Button variant="outline" onClick={() => void loadOrders(currentPage)}>{t('common.retry')}</Button>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {t('myOrders.empty')}
            </CardContent>
          </Card>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {orders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
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
                              <Badge variant={statusColors[order.status]}>
                                {t(`myOrders.status.${order.status}`)}
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
                                  <span className="text-muted-foreground">{formatVND(p.price * p.qty)}</span>
                                </div>
                              ))}
                            </div>

                            {/* Meta info */}
                            <div className="grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                              <span className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-primary" />
                                {formatOrderDate(order.createdAt)}
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
                            <p className="font-bold text-lg text-primary">{formatVND(order.totalPrice)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mt-8 flex items-center justify-center gap-2"
              >
                {/* Prev */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentPage === 0}
                  className="flex items-center gap-1 px-3"
                  id="orders-prev-page"
                  aria-label={t('myOrders.prevPage')}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('myOrders.prevPage')}</span>
                </Button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {buildPageNumbers().map((p, idx) =>
                    p === 'ellipsis' ? (
                      <span key={`ellipsis-${idx}`} className="w-8 text-center text-muted-foreground select-none">
                        …
                      </span>
                    ) : (
                      <Button
                        key={p}
                        variant={p === currentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageClick(p as number)}
                        className="w-9 h-9 p-0 font-medium"
                        id={`orders-page-${p + 1}`}
                        aria-label={`${t('myOrders.page')} ${(p as number) + 1}`}
                        aria-current={p === currentPage ? 'page' : undefined}
                      >
                        {(p as number) + 1}
                      </Button>
                    )
                  )}
                </div>

                {/* Next */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentPage >= totalPages - 1}
                  className="flex items-center gap-1 px-3"
                  id="orders-next-page"
                  aria-label={t('myOrders.nextPage')}
                >
                  <span className="hidden sm:inline">{t('myOrders.nextPage')}</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;
