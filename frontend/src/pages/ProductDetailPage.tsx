import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Loader2, ShoppingCart, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { api, type ProductReview } from '@/lib/api';
import type { Product } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/context/CartContext';
import { formatVND } from '@/lib/format';
import { cn } from '@/lib/utils';

const formatReviewDate = (value?: string | null) => {
  if (!value) return '-';
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(date);
  }
  return value.split(/[T ]/)[0] || '-';
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CC';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
};

const RatingStars = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) => (
  <div className="flex items-center gap-1" aria-label={`${rating.toFixed(1)} sao`}>
    {Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={cn(
          size === 'md' ? 'h-5 w-5' : 'h-4 w-4',
          index < Math.round(rating) ? 'fill-primary text-primary' : 'text-muted-foreground/45',
        )}
      />
    ))}
  </div>
);

const ProductDetailPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isProductLoading, setIsProductLoading] = useState(true);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    if (!productId) return;
    try {
      setIsProductLoading(true);
      setProductError(null);
      setProduct(await api.products.getById(productId));
    } catch (error) {
      setProductError(error instanceof Error ? error.message : 'Không thể tải sản phẩm.');
    } finally {
      setIsProductLoading(false);
    }
  }, [productId]);

  const loadReviews = useCallback(async () => {
    if (!productId) return;
    try {
      setIsReviewsLoading(true);
      setReviewsError(null);
      setReviews(await api.reviews.getProductReviews(productId));
    } catch (error) {
      setReviewsError(error instanceof Error ? error.message : 'Không thể tải đánh giá sản phẩm.');
    } finally {
      setIsReviewsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void loadProduct();
    void loadReviews();
  }, [loadProduct, loadReviews]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return product?.rating ?? 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [product?.rating, reviews]);

  if (isProductLoading) {
    return (
      <div className="pt-24 pb-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex min-h-[360px] items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
            Đang tải sản phẩm...
          </div>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="pt-24 pb-20">
        <div className="container mx-auto max-w-3xl px-4">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="mb-4 text-sm text-destructive">{productError ?? 'Không tìm thấy sản phẩm.'}</p>
              <Button asChild variant="outline">
                <Link to="/shop">Quay lại cửa hàng</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto max-w-6xl px-4">
        <Button asChild variant="ghost" className="mb-6 pl-0 text-muted-foreground hover:text-primary">
          <Link to="/shop">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Cửa hàng
          </Link>
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
        >
          <div className="overflow-hidden rounded-lg border border-border bg-secondary">
            <img src={product.image} alt={product.name} className="aspect-square h-full w-full object-cover" />
          </div>

          <section className="flex flex-col justify-center">
            <p className="mb-2 text-sm font-medium text-primary">{product.category}</p>
            <h1 className="font-display text-4xl font-bold md:text-5xl">{product.name}</h1>
            <p className="mt-4 text-muted-foreground">{product.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <RatingStars rating={averageRating} size="md" />
              <span className="text-sm text-muted-foreground">
                {averageRating > 0 ? averageRating.toFixed(1) : '0.0'} ({reviews.length} đánh giá)
              </span>
            </div>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <span className="text-3xl font-bold text-primary">{formatVND(product.price)}</span>
              <Button
                type="button"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => addToCart(product)}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Thêm vào giỏ
              </Button>
            </div>
          </section>
        </motion.div>

        <section className="mt-12">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold">Đánh giá sản phẩm</h2>
              <p className="text-sm text-muted-foreground">Đánh giá công khai từ khách đã mua sản phẩm này.</p>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-card px-4 py-3">
              <span className="text-2xl font-bold text-primary">{averageRating > 0 ? averageRating.toFixed(1) : '0.0'}</span>
              <div>
                <RatingStars rating={averageRating} />
                <p className="mt-1 text-xs text-muted-foreground">{reviews.length} đánh giá</p>
              </div>
            </div>
          </div>

          {isReviewsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-lg border border-border bg-card" />
              ))}
            </div>
          ) : reviewsError ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="mb-4 text-sm text-destructive">{reviewsError}</p>
                <Button variant="outline" onClick={() => void loadReviews()}>Thử lại</Button>
              </CardContent>
            </Card>
          ) : reviews.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Chưa có đánh giá nào cho sản phẩm này.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {getInitials(review.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium text-foreground">{review.name}</p>
                            <p className="text-xs text-muted-foreground">{formatReviewDate(review.date)}</p>
                          </div>
                          <RatingStars rating={review.rating} />
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{review.comment}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProductDetailPage;
