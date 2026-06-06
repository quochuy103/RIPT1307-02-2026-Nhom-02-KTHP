import { useCallback, useEffect, useState } from 'react';
import { Package, CalendarDays, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { ApiError, api, type Order, type ReviewableProduct } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import type { OrderStatus } from '@/types/order';
import { formatVND } from '@/lib/format';
import { cn } from '@/lib/utils';
import ReviewModal, { type ReviewTarget } from '@/components/ReviewModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [searchParams] = useSearchParams();
  const focusOrderId = searchParams.get('focus');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');

  const [activeTab, setActiveTab] = useState<'orders' | 'reviewable'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') === 'reviewable' ? 'reviewable' : 'orders';
  });
  const [reviewableProducts, setReviewableProducts] = useState<ReviewableProduct[]>([]);
  const [isReviewableLoading, setIsReviewableLoading] = useState(false);
  const [reviewableError, setReviewableError] = useState<string | null>(null);
  const [selectedProductForReview, setSelectedProductForReview] = useState<ReviewTarget | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async (page: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await api.orders.getMyOrdersPaged(
        page,
        PAGE_SIZE,
        statusFilter === 'all' ? undefined : statusFilter,
      );
      setOrders(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
      setCurrentPage(result.number);
    } catch (err) {
      setError(getOrderError(err, t('myOrders.loadError')));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, t]);

  const loadReviewableProducts = useCallback(async () => {
    try {
      setIsReviewableLoading(true);
      setReviewableError(null);
      const result = await api.reviews.getReviewableProducts();
      setReviewableProducts(result);
    } catch (err) {
      setReviewableError(err instanceof Error ? err.message : 'Không thể tải danh sách chờ đánh giá.');
    } finally {
      setIsReviewableLoading(false);
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    void loadOrders(0);
  }, [loadOrders]);

  useEffect(() => {
    if (activeTab === 'reviewable') {
      void loadReviewableProducts();
    }
  }, [activeTab, loadReviewableProducts]);

  useEffect(() => {
    if (focusOrderId) {
      setActiveTab('orders');
    }
  }, [focusOrderId]);

  useEffect(() => {
    if (activeTab !== 'orders' || isLoading || !focusOrderId || orders.length === 0) return;
    const target = orders.find((order) => order.id === focusOrderId);
    if (!target) return;

    setHighlightedOrderId(focusOrderId);
    const frameId = window.requestAnimationFrame(() => {
      document.getElementById(`order-${focusOrderId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
    const timeoutId = window.setTimeout(() => {
      setHighlightedOrderId((current) => (current === focusOrderId ? null : current));
    }, 3000);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [activeTab, focusOrderId, isLoading, orders]);

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
          <h1 className="mb-3 font-display text-3xl font-bold md:text-5xl">
            {t('myOrders.title')} <span className="text-gradient-gold">{t('myOrders.highlight')}</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">{t('myOrders.subtitle')}</p>
          {activeTab === 'orders' && !isLoading && !error && totalElements > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('myOrders.page')} {currentPage + 1} {t('myOrders.of')} {totalPages}
              {' · '}{totalElements} {totalElements === 1 ? t('myOrders.orderId') : t('myOrders.orderId')}
            </p>
          )}
        </motion.div>

        {/* Tab Selection */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:flex sm:justify-center sm:gap-4">
          <Button
            variant={activeTab === 'orders' ? 'default' : 'outline'}
            onClick={() => setActiveTab('orders')}
            className={cn(
              "w-full font-medium transition-all duration-200 sm:min-w-[150px] sm:w-auto",
              activeTab === 'orders' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "border-primary/20 hover:border-primary/50"
            )}
          >
            Đơn hàng của tôi
          </Button>
          <Button
            variant={activeTab === 'reviewable' ? 'default' : 'outline'}
            onClick={() => setActiveTab('reviewable')}
            className={cn(
              "w-full font-medium transition-all duration-200 sm:min-w-[150px] sm:w-auto",
              activeTab === 'reviewable' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "border-primary/20 hover:border-primary/50"
            )}
          >
            Chờ đánh giá
          </Button>
        </div>

        {activeTab === 'orders' && (
          <div className="mb-6 flex justify-stretch sm:justify-end">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as 'all' | OrderStatus);
              }}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.common.allStatus')}</SelectItem>
                <SelectItem value="pending">{t('myOrders.status.pending', { defaultValue: 'Pending' })}</SelectItem>
                <SelectItem value="paid">{t('myOrders.status.paid', { defaultValue: 'Paid' })}</SelectItem>
                <SelectItem value="shipping">{t('myOrders.status.shipping', { defaultValue: 'Shipping' })}</SelectItem>
                <SelectItem value="shipped">{t('myOrders.status.shipped', { defaultValue: 'Shipped' })}</SelectItem>
                <SelectItem value="delivered">{t('myOrders.status.delivered', { defaultValue: 'Delivered' })}</SelectItem>
                <SelectItem value="cancelled">{t('myOrders.status.cancelled', { defaultValue: 'Cancelled' })}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {activeTab === 'orders' ? (
          isLoading ? (
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
                      <Card
                        id={`order-${order.id}`}
                        className={`overflow-hidden transition-all ${
                          highlightedOrderId === order.id ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''
                        }`}
                      >
                        <CardContent className="p-5">
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0 flex-1 space-y-3">
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
                                  <div key={i} className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                                    <span className="flex min-w-0 items-center gap-2">
                                      <Package className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                      <span className="break-words">{p.name}</span>
                                      <span className="text-muted-foreground">× {p.qty}</span>
                                    </span>
                                    <span className="text-muted-foreground sm:text-right">{formatVND(p.price * p.qty)}</span>
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
                                  <span className="break-words">{order.address}</span>
                                </span>
                              </div>
                            </div>

                            {/* Total */}
                            <div className="flex min-w-[100px] flex-col gap-1 md:items-end">
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
                  className="mt-8 flex flex-wrap items-center justify-center gap-2"
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
                  <div className="flex flex-wrap items-center justify-center gap-1">
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
          )
        ) : (
          isReviewableLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-32 rounded-lg border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : reviewableError ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-destructive mb-4">{reviewableError}</p>
                <Button variant="outline" onClick={() => void loadReviewableProducts()}>{t('common.retry')}</Button>
              </CardContent>
            </Card>
          ) : reviewableProducts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Bạn không có sản phẩm nào đang chờ đánh giá.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviewableProducts.map((item, index) => (
                <motion.div
                  key={`${item.orderId}-${item.productId}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Card className="overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        {/* Image */}
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-secondary border border-border">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-primary/10">
                              <Package className="h-6 w-6 text-primary" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="break-words font-display text-base font-semibold">{item.productName}</h3>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>Mã đơn hàng: #{item.orderId}</span>
                            <span>Ngày đặt: {formatOrderDate(item.orderedAt)}</span>
                            <span>Số lượng: {item.quantity}</span>
                            <span>Đơn giá: {formatVND(item.price)}</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex-shrink-0 pt-2 sm:pt-0">
                          <Button
                            type="button"
                            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                            onClick={() => {
                              setSelectedProductForReview({
                                type: 'product',
                                orderId: Number(item.orderId),
                                productId: Number(item.productId),
                                title: item.productName,
                              });
                              setIsReviewModalOpen(true);
                            }}
                          >
                            Viết đánh giá
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )
        )}

        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedProductForReview(null);
          }}
          onSubmitSuccess={() => {
            void loadReviewableProducts();
          }}
          target={selectedProductForReview}
        />
      </div>
    </div>
  );
};

export default MyOrdersPage;
