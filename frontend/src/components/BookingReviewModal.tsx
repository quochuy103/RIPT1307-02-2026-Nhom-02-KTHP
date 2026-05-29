import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Star, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ApiError, api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const MAX_COMMENT_LENGTH = 2000;

export type BookingReviewTarget = {
  bookingId: number;
  serviceName: string;
  barberName: string;
  date: string;
  time: string;
};

type BookingReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  target: BookingReviewTarget | null;
};

const getReviewError = (error: unknown, fallback: string) => {
  if (error instanceof ApiError && error.status === 401) {
    return 'Vui lòng đăng nhập lại để gửi đánh giá.';
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

const StarRatingInput = ({
  label,
  value,
  hoverValue,
  onChange,
  onHoverChange,
  disabled,
}: {
  label: string;
  value: number;
  hoverValue: number;
  onChange: (value: number) => void;
  onHoverChange: (value: number) => void;
  disabled: boolean;
}) => {
  const activeValue = hoverValue || value;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div
        className="flex items-center gap-2"
        onMouseLeave={() => onHoverChange(0)}
        aria-label={label}
      >
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            className="rounded-full p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => onChange(rating)}
            onMouseEnter={() => onHoverChange(rating)}
            disabled={disabled}
            aria-label={`${label} ${rating} sao`}
          >
            <Star
              className={cn(
                'h-7 w-7 transition-colors sm:h-8 sm:w-8',
                rating <= activeValue ? 'fill-primary text-primary' : 'text-muted-foreground/45',
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

const BookingReviewModal = ({ isOpen, onClose, onSubmitSuccess, target }: BookingReviewModalProps) => {
  const { t } = useTranslation();
  const [overallRating, setOverallRating] = useState(0);
  const [barberRating, setBarberRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [overallHover, setOverallHover] = useState(0);
  const [barberHover, setBarberHover] = useState(0);
  const [serviceHover, setServiceHover] = useState(0);
  const [overallComment, setOverallComment] = useState('');
  const [barberComment, setBarberComment] = useState('');
  const [serviceComment, setServiceComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setOverallRating(0);
    setBarberRating(0);
    setServiceRating(0);
    setOverallHover(0);
    setBarberHover(0);
    setServiceHover(0);
    setOverallComment('');
    setBarberComment('');
    setServiceComment('');
    setIsSubmitting(false);
  }, [isOpen, target]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  const handleSubmit = async () => {
    if (!target || isSubmitting) return;
    if (overallRating < 1 || barberRating < 1 || serviceRating < 1) {
      toast.error(t('bookingReviewModal.ratingRequired', { defaultValue: 'Vui lòng chọn đầy đủ số sao đánh giá.' }));
      return;
    }
    if (!overallComment.trim()) {
      toast.error(t('bookingReviewModal.commentRequired', { defaultValue: 'Vui lòng nhập đánh giá tổng quát.' }));
      return;
    }

    try {
      setIsSubmitting(true);
      await api.reviews.create({
        bookingId: target.bookingId,
        overall: { rating: overallRating, comment: overallComment.trim() },
        barber: { rating: barberRating, comment: barberComment.trim() || undefined },
        service: { rating: serviceRating, comment: serviceComment.trim() || undefined },
      });
      toast.success(t('bookingReviewModal.submitSuccess', { defaultValue: 'Cảm ơn bạn đã gửi đánh giá.' }));
      onSubmitSuccess();
      onClose();
    } catch (error) {
      toast.error(getReviewError(error, t('bookingReviewModal.submitError', { defaultValue: 'Không thể gửi đánh giá. Vui lòng thử lại.' })));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && target && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 px-4 py-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSubmitting) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-review-modal-title"
            className="relative w-full max-w-2xl overflow-hidden rounded-lg border border-primary/25 bg-card shadow-2xl shadow-black/40"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
            <button
              type="button"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label={t('bookingReviewModal.close', { defaultValue: 'Đóng' })}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="max-h-[90vh] overflow-y-auto p-5 sm:p-6">
              <div className="pr-12">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  {t('bookingReviewModal.eyebrow', { defaultValue: 'Cutie Cuts' })}
                </p>
                <h2 id="booking-review-modal-title" className="font-display text-2xl font-bold text-foreground">
                  {t('bookingReviewModal.title', { defaultValue: 'Đánh giá lịch hẹn' })}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {target.serviceName} - {target.barberName} - {target.date} {target.time}
                </p>
              </div>

              <div className="mt-6 space-y-6">
                <div className="rounded-lg border border-border/60 bg-background/50 p-4">
                  <StarRatingInput
                    label={t('bookingReviewModal.overallLabel', { defaultValue: 'Đánh giá tổng quát' })}
                    value={overallRating}
                    hoverValue={overallHover}
                    onChange={setOverallRating}
                    onHoverChange={setOverallHover}
                    disabled={isSubmitting}
                  />
                  <div className="mt-4 space-y-2">
                    <label htmlFor="booking-review-overall" className="text-sm font-medium text-foreground">
                      {t('bookingReviewModal.overallComment', { defaultValue: 'Chia sẻ trải nghiệm tổng quát' })}
                    </label>
                    <Textarea
                      id="booking-review-overall"
                      value={overallComment}
                      maxLength={MAX_COMMENT_LENGTH}
                      onChange={(event) => setOverallComment(event.target.value)}
                      placeholder={t('bookingReviewModal.overallPlaceholder', { defaultValue: 'Điều gì làm bạn hài lòng hoặc chưa hài lòng?' })}
                      disabled={isSubmitting}
                      className="min-h-28 resize-none border-primary/20 bg-background/70 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-border/60 bg-background/50 p-4">
                    <StarRatingInput
                      label={t('bookingReviewModal.barberLabel', { defaultValue: 'Đánh giá barber' })}
                      value={barberRating}
                      hoverValue={barberHover}
                      onChange={setBarberRating}
                      onHoverChange={setBarberHover}
                      disabled={isSubmitting}
                    />
                    <div className="mt-4 space-y-2">
                      <label htmlFor="booking-review-barber" className="text-sm font-medium text-foreground">
                        {t('bookingReviewModal.barberComment', { defaultValue: 'Nhận xét về barber' })}
                      </label>
                      <Textarea
                        id="booking-review-barber"
                        value={barberComment}
                        maxLength={MAX_COMMENT_LENGTH}
                        onChange={(event) => setBarberComment(event.target.value)}
                        placeholder={t('bookingReviewModal.barberPlaceholder', { defaultValue: 'Tay nghề, thái độ, tư vấn...' })}
                        disabled={isSubmitting}
                        className="min-h-24 resize-none border-primary/20 bg-background/70 focus-visible:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-background/50 p-4">
                    <StarRatingInput
                      label={t('bookingReviewModal.serviceLabel', { defaultValue: 'Đánh giá dịch vụ' })}
                      value={serviceRating}
                      hoverValue={serviceHover}
                      onChange={setServiceRating}
                      onHoverChange={setServiceHover}
                      disabled={isSubmitting}
                    />
                    <div className="mt-4 space-y-2">
                      <label htmlFor="booking-review-service" className="text-sm font-medium text-foreground">
                        {t('bookingReviewModal.serviceComment', { defaultValue: 'Nhận xét về dịch vụ cắt tóc' })}
                      </label>
                      <Textarea
                        id="booking-review-service"
                        value={serviceComment}
                        maxLength={MAX_COMMENT_LENGTH}
                        onChange={(event) => setServiceComment(event.target.value)}
                        placeholder={t('bookingReviewModal.servicePlaceholder', { defaultValue: 'Chất lượng dịch vụ, kết quả, giá trị...' })}
                        disabled={isSubmitting}
                        className="min-h-24 resize-none border-primary/20 bg-background/70 focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end text-xs text-muted-foreground">
                  {overallComment.length + barberComment.length + serviceComment.length}/{MAX_COMMENT_LENGTH * 3}
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  {t('bookingReviewModal.cancel', { defaultValue: 'Hủy' })}
                </Button>
                <Button
                  type="button"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => void handleSubmit()}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('bookingReviewModal.submit', { defaultValue: 'Gửi đánh giá' })}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookingReviewModal;
