import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import DataTable, { Column } from '@/components/admin/DataTable';
import FilterDatePicker from '@/components/admin/FilterDatePicker';
import FormModal from '@/components/admin/FormModal';
import type { AdminReview } from '@/data/adminMockData';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';

const AdminReviews = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [userIdFilter, setUserIdFilter] = useState('all');
  const [reviewTypeFilter, setReviewTypeFilter] = useState<'all' | 'product' | 'booking'>('all');
  const [productIdFilter, setProductIdFilter] = useState('all');
  const [serviceIdFilter, setServiceIdFilter] = useState('all');
  const [barberIdFilter, setBarberIdFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [viewReview, setViewReview] = useState<AdminReview | null>(null);

  const { data: users = [] } = useQuery({
    queryKey: ['admin', 'reviews', 'user-options'],
    queryFn: api.admin.getUsers,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['admin', 'reviews', 'product-options'],
    queryFn: api.admin.getProducts,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['admin', 'reviews', 'service-options'],
    queryFn: api.admin.getServices,
  });

  const { data: barbers = [] } = useQuery({
    queryKey: ['admin', 'reviews', 'barber-options'],
    queryFn: api.admin.getBarbers,
  });

  const { data: rawReviews = [], isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'reviews', {
      userIdFilter,
      productIdFilter,
      serviceIdFilter,
      barberIdFilter,
      ratingFilter,
      selectedDate,
    }],
    queryFn: async () => {
      const exactRating = ratingFilter === 'all' ? undefined : Number(ratingFilter);
      const result = await api.admin.getReviewsFiltered({
        userId: userIdFilter === 'all' ? undefined : userIdFilter,
        productId: productIdFilter === 'all' ? undefined : productIdFilter,
        serviceId: serviceIdFilter === 'all' ? undefined : serviceIdFilter,
        barberId: barberIdFilter === 'all' ? undefined : barberIdFilter,
        minRating: exactRating,
        maxRating: exactRating,
        createdFrom: selectedDate || undefined,
        createdTo: selectedDate || undefined,
      });
      return result.content;
    },
  });

  const reviews = useMemo(
    () => rawReviews.filter((review) => reviewTypeFilter === 'all' || review.reviewType === reviewTypeFilter),
    [rawReviews, reviewTypeFilter],
  );

  const deleteReviewMutation = useMutation({
    mutationFn: api.admin.deleteReview,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      toast.success(t('admin.reviewsPage.deleted'));
    },
    onError: (mutationError) => toast.error(mutationError instanceof Error ? mutationError.message : t('admin.common.deleteFailed')),
  });

  const canDeleteReview = (review: AdminReview) =>
    currentUser?.id !== undefined && review.userId !== undefined && String(currentUser.id) === review.userId;

  const formatReviewType = (review: AdminReview) => (
    review.reviewType === 'product'
      ? t('admin.reviewsPage.productReview')
      : t('admin.reviewsPage.bookingReview')
  );

  const getTargetSummary = (review: AdminReview) => {
    if (review.reviewType === 'product') {
      return review.productName ?? t('admin.reviewsPage.unknownProduct');
    }

    if (review.serviceName && review.barberName) {
      return `${review.serviceName} / ${review.barberName}`;
    }

    return review.serviceName ?? review.barberName ?? t('admin.reviewsPage.unknownBookingTarget');
  };

  const columns: Column<AdminReview>[] = [
    { key: 'userName', label: t('admin.fields.user'), render: (review) => <span className="font-medium">{review.userName}</span> },
    {
      key: 'reviewType',
      label: t('admin.reviewsPage.reviewType'),
      render: (review) => <Badge variant={review.reviewType === 'product' ? 'outline' : 'secondary'}>{formatReviewType(review)}</Badge>,
      searchable: false,
    },
    {
      key: 'target',
      label: t('admin.reviewsPage.target'),
      render: (review) => <span className="text-sm text-foreground">{getTargetSummary(review)}</span>,
      searchable: false,
    },
    {
      key: 'rating',
      label: t('admin.fields.rating'),
      render: (review) => (
        <div className="flex items-center gap-1">
          <span className="font-medium">{review.overallRating ?? review.rating}</span>
          <Star className="h-4 w-4 fill-primary text-primary" />
        </div>
      ),
      searchable: false,
    },
    {
      key: 'comment',
      label: t('admin.fields.comment'),
      render: (review) => (
        <span className="line-clamp-2 max-w-xs">
          {review.overallComment ?? review.comment}
        </span>
      ),
    },
    { key: 'date', label: t('admin.fields.date') },
  ];

  const resetFilters = () => {
    setUserIdFilter('all');
    setReviewTypeFilter('all');
    setProductIdFilter('all');
    setServiceIdFilter('all');
    setBarberIdFilter('all');
    setRatingFilter('all');
    setSelectedDate('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('admin.reviewsPage.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.reviewsPage.count', { count: reviews.length })}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Select value={userIdFilter} onValueChange={setUserIdFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.reviewsPage.allUsers')}</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={reviewTypeFilter} onValueChange={(value) => setReviewTypeFilter(value as 'all' | 'product' | 'booking')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.reviewsPage.allTypes')}</SelectItem>
            <SelectItem value="product">{t('admin.reviewsPage.productReview')}</SelectItem>
            <SelectItem value="booking">{t('admin.reviewsPage.bookingReview')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={productIdFilter} onValueChange={setProductIdFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.reviewsPage.allProducts')}</SelectItem>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={serviceIdFilter} onValueChange={setServiceIdFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.reviewsPage.allServices')}</SelectItem>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={barberIdFilter} onValueChange={setBarberIdFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.reviewsPage.allBarbers')}</SelectItem>
            {barbers.map((barber) => (
              <SelectItem key={barber.id} value={barber.id}>{barber.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.reviewsPage.allRatings')}</SelectItem>
            {[5, 4, 3, 2, 1].map((rating) => (
              <SelectItem key={rating} value={String(rating)}>{rating} {t('admin.reviewsPage.starsSuffix')}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <FilterDatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          placeholder={t('admin.reviewsPage.selectDate')}
        />

        <Button variant="outline" onClick={resetFilters}>
          {t('common.reset')}
        </Button>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>{t('admin.reviewsPage.loadError')}</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : t('admin.common.loadFallback')}</AlertDescription>
        </Alert>
      )}

      <DataTable
        data={isLoading ? [] : reviews}
        columns={columns}
        showSearch={false}
        actions={(review) => (
          <div className="flex items-center justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={() => setViewReview(review)}>
              <Eye className="h-4 w-4" />
            </Button>
            {canDeleteReview(review) && (
              <Button size="sm" variant="ghost" onClick={() => deleteReviewMutation.mutate(review.id)} className="text-destructive" disabled={deleteReviewMutation.isPending}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      />

      <FormModal
        open={!!viewReview}
        onClose={() => setViewReview(null)}
        title={t('admin.reviewsPage.details')}
        onSubmit={() => setViewReview(null)}
        submitLabel={t('admin.modal.close')}
      >
        {viewReview && (
          <div className="space-y-3 text-sm">
            <p><span className="text-muted-foreground">{t('admin.fields.user')}:</span> {viewReview.userName}</p>
            <p><span className="text-muted-foreground">{t('admin.reviewsPage.reviewType')}:</span> {formatReviewType(viewReview)}</p>
            <p><span className="text-muted-foreground">{t('admin.reviewsPage.target')}:</span> {getTargetSummary(viewReview)}</p>
            <p><span className="text-muted-foreground">{t('admin.fields.date')}:</span> {viewReview.date}</p>

            {viewReview.reviewType === 'product' ? (
              <>
                <p><span className="text-muted-foreground">{t('admin.fields.rating')}:</span> {viewReview.rating}/5</p>
                <p><span className="text-muted-foreground">{t('admin.fields.comment')}:</span> {viewReview.comment}</p>
                <p><span className="text-muted-foreground">{t('admin.reviewsPage.order')}:</span> {viewReview.orderId ?? '-'}</p>
                <p><span className="text-muted-foreground">{t('admin.reviewsPage.product')}:</span> {viewReview.productName ?? '-'}</p>
              </>
            ) : (
              <>
                <p><span className="text-muted-foreground">{t('admin.reviewsPage.booking')}:</span> {viewReview.bookingId ?? '-'}</p>
                <p><span className="text-muted-foreground">{t('admin.fields.service')}:</span> {viewReview.serviceName ?? '-'}</p>
                <p><span className="text-muted-foreground">{t('admin.fields.barber')}:</span> {viewReview.barberName ?? '-'}</p>
                <p><span className="text-muted-foreground">{t('admin.reviewsPage.overallRating')}:</span> {viewReview.overallRating ?? viewReview.rating}/5</p>
                <p><span className="text-muted-foreground">{t('admin.reviewsPage.overallComment')}:</span> {viewReview.overallComment ?? viewReview.comment}</p>
                <p><span className="text-muted-foreground">{t('admin.reviewsPage.barberRating')}:</span> {viewReview.barberRating ?? '-'}</p>
                <p><span className="text-muted-foreground">{t('admin.reviewsPage.barberComment')}:</span> {viewReview.barberComment ?? '-'}</p>
                <p><span className="text-muted-foreground">{t('admin.reviewsPage.serviceRating')}:</span> {viewReview.serviceRating ?? '-'}</p>
                <p><span className="text-muted-foreground">{t('admin.reviewsPage.serviceComment')}:</span> {viewReview.serviceComment ?? '-'}</p>
              </>
            )}
          </div>
        )}
      </FormModal>
    </div>
  );
};

export default AdminReviews;
