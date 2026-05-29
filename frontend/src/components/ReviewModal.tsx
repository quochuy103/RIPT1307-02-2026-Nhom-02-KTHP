import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Star, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ApiError, api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const MAX_COMMENT_LENGTH = 2000;

export type ReviewTarget = {
  type: 'product';
  orderId: number;
  productId: number;
  title: string;
};

type ReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  target: ReviewTarget | null;
};

const getReviewError = (error: unknown, fallback: string) => {
  if (error instanceof ApiError && error.status === 401) {
    return 'Vui lòng đăng nhập lại để gửi đánh giá.';
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

const ReviewModal = ({ isOpen, onClose, onSubmitSuccess, target }: ReviewModalProps) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeRating = hoverRating || rating;
  const title = useMemo(() => {
    if (!target) return '';
    return t('reviewModal.productTitle', { defaultValue: 'Đánh giá sản phẩm' });
  }, [target, t]);

  useEffect(() => {
    if (!isOpen) return;
    setRating(0);
    setHoverRating(0);
    setComment('');
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
    if (rating < 1) {
      toast.error(t('reviewModal.ratingRequired', { defaultValue: 'Vui lòng chọn số sao đánh giá.' }));
      return;
    }

    try {
      setIsSubmitting(true);
      await api.reviews.create({
        orderId: target.orderId,
        productId: target.productId,
        rating,
        comment: comment.trim(),
      });
      toast.success(t('reviewModal.submitSuccess', { defaultValue: 'Cảm ơn bạn đã gửi đánh giá.' }));
      onSubmitSuccess();
      onClose();
    } catch (error) {
      toast.error(getReviewError(error, t('reviewModal.submitError', { defaultValue: 'Không thể gửi đánh giá. Vui lòng thử lại.' })));
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
            aria-labelledby="review-modal-title"
            className="relative w-full max-w-lg overflow-hidden rounded-lg border border-primary/25 bg-card shadow-2xl shadow-black/40"
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
              aria-label={t('reviewModal.close', { defaultValue: 'Đóng' })}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-5 sm:p-6">
              <div className="pr-12">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  {t('reviewModal.eyebrow', { defaultValue: 'Cutie Cuts' })}
                </p>
                <h2 id="review-modal-title" className="font-display text-2xl font-bold text-foreground">
                  {title}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">{target.title}</p>
              </div>

              <div className="mt-6">
                <div
                  className="flex items-center justify-center gap-2 sm:gap-3"
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={t('reviewModal.ratingLabel', { defaultValue: 'Chọn số sao' })}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className="rounded-full p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      onClick={() => setRating(value)}
                      onMouseEnter={() => setHoverRating(value)}
                      disabled={isSubmitting}
                      aria-label={t('reviewModal.starLabel', { value, defaultValue: '{{value}} sao' })}
                    >
                      <Star
                        className={cn(
                          'h-9 w-9 transition-colors sm:h-11 sm:w-11',
                          value <= activeRating ? 'fill-primary text-primary' : 'text-muted-foreground/45',
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <label htmlFor="review-comment" className="text-sm font-medium text-foreground">
                  {t('reviewModal.commentLabel', { defaultValue: 'Bình luận' })}
                </label>
                <Textarea
                  id="review-comment"
                  value={comment}
                  maxLength={MAX_COMMENT_LENGTH}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder={t('reviewModal.commentPlaceholder', { defaultValue: 'Chia sẻ trải nghiệm của bạn...' })}
                  disabled={isSubmitting}
                  className="min-h-36 resize-none border-primary/20 bg-background/70 focus-visible:ring-primary"
                />
                <div className="flex justify-end text-xs text-muted-foreground">
                  {comment.length}/{MAX_COMMENT_LENGTH}
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  {t('reviewModal.cancel', { defaultValue: 'Hủy' })}
                </Button>
                <Button
                  type="button"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => void handleSubmit()}
                  disabled={isSubmitting || rating < 1}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('reviewModal.submit', { defaultValue: 'Gửi đánh giá' })}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReviewModal;
