import { useState } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import type { AdminReview } from '@/data/adminMockData';
import { Button } from '@/components/ui/button';
import { Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import FilterDatePicker from '@/components/admin/FilterDatePicker';

const AdminReviews = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [productIdFilter, setProductIdFilter] = useState('');
  const [serviceIdFilter, setServiceIdFilter] = useState('');
  const [barberIdFilter, setBarberIdFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [orderIdFilter, setOrderIdFilter] = useState('');
  const [minRatingFilter, setMinRatingFilter] = useState('');
  const [maxRatingFilter, setMaxRatingFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const { data: reviews = [], isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'reviews', {
      productIdFilter,
      serviceIdFilter,
      barberIdFilter,
      userIdFilter,
      orderIdFilter,
      minRatingFilter,
      maxRatingFilter,
      selectedDate,
    }],
    queryFn: async () => {
      const result = await api.admin.getReviewsFiltered({
        productId: productIdFilter || undefined,
        serviceId: serviceIdFilter || undefined,
        barberId: barberIdFilter || undefined,
        userId: userIdFilter || undefined,
        orderId: orderIdFilter || undefined,
        minRating: minRatingFilter ? Number(minRatingFilter) : undefined,
        maxRating: maxRatingFilter ? Number(maxRatingFilter) : undefined,
        createdFrom: selectedDate || undefined,
        createdTo: selectedDate || undefined,
      });
      return result.content;
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: api.admin.deleteReview,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      toast.success(t('admin.reviewsPage.deleted'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('admin.common.deleteFailed')),
  });

  const columns: Column<AdminReview>[] = [
    { key: 'userName', label: t('admin.fields.user'), render: (review) => <span className="font-medium">{review.userName}</span> },
    {
      key: 'rating', label: t('admin.fields.rating'), render: (review) => (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, index) => (
            <Star key={index} className={`h-4 w-4 ${index < review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
          ))}
        </div>
      )
    },
    { key: 'comment', label: t('admin.fields.comment'), render: (review) => <span className="line-clamp-2 max-w-xs">{review.comment}</span> },
    { key: 'date', label: t('admin.fields.date') },
  ];

  const resetFilters = () => {
    setProductIdFilter('');
    setServiceIdFilter('');
    setBarberIdFilter('');
    setUserIdFilter('');
    setOrderIdFilter('');
    setMinRatingFilter('');
    setMaxRatingFilter('');
    setSelectedDate('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('admin.reviewsPage.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.reviewsPage.count', { count: reviews.length })}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Input value={productIdFilter} onChange={(e) => setProductIdFilter(e.target.value)} placeholder="Product ID" />
        <Input value={serviceIdFilter} onChange={(e) => setServiceIdFilter(e.target.value)} placeholder="Service ID" />
        <Input value={barberIdFilter} onChange={(e) => setBarberIdFilter(e.target.value)} placeholder="Barber ID" />
        <Input value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} placeholder="User ID" />
        <Input value={orderIdFilter} onChange={(e) => setOrderIdFilter(e.target.value)} placeholder="Order ID" />
        <Input type="number" min="1" max="5" value={minRatingFilter} onChange={(e) => setMinRatingFilter(e.target.value)} placeholder="Min rating" />
        <Input type="number" min="1" max="5" value={maxRatingFilter} onChange={(e) => setMaxRatingFilter(e.target.value)} placeholder="Max rating" />
        <FilterDatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          placeholder={t('admin.reviewsPage.selectDate', { defaultValue: 'Chọn ngày' })}
        />
        <Button variant="outline" onClick={resetFilters}>
          {t('common.reset', { defaultValue: 'Reset' })}
        </Button>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>{t('admin.reviewsPage.loadError', { defaultValue: 'Không thể tải đánh giá' })}</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : t('admin.common.loadFallback')}</AlertDescription>
        </Alert>
      )}

      <DataTable data={isLoading ? [] : reviews} columns={columns} showSearch={false} actions={(review) => (
        <Button size="sm" variant="ghost" onClick={() => deleteReviewMutation.mutate(review.id)} className="text-destructive" disabled={deleteReviewMutation.isPending}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )} />
    </div>
  );
};

export default AdminReviews;
