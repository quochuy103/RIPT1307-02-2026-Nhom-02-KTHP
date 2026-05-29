import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Star, X } from 'lucide-react';
import { Barber, Review } from '@/data/mockData';
import { cn } from '@/lib/utils';

type BarberReviewsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  barber: Barber | null;
  reviews: Review[];
};

const BarberReviewsModal = ({ isOpen, onClose, barber, reviews }: BarberReviewsModalProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!barber) return null;

  // Filter reviews matching this barber using real backend API fields
  const barberReviews = reviews.filter((r) => {
    if (r.barberId && String(r.barberId) === String(barber.id)) return true;
    if (r.barberName && barber.name && r.barberName.toLowerCase() === barber.name.toLowerCase()) return true;
    return false;
  });


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-2xl shadow-black/40 flex flex-col"
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
            
            {/* Close Button */}
            <button
              type="button"
              className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground transition hover:border-primary hover:text-primary"
              onClick={onClose}
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              {/* Barber Details Card */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border/60">
                <div className="relative w-28 h-28 shrink-0 rounded-full overflow-hidden border-2 border-primary">
                  <img src={barber.image} alt={barber.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-center sm:text-left space-y-2">
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full">
                    {barber.role}
                  </span>
                  <h3 className="font-display text-2xl font-bold text-foreground">{barber.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {barber.experience} năm kinh nghiệm • Chuyên môn: {barber.specialties.join(', ')}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-sm font-semibold">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span>{barber.rating} / 5</span>
                    <span className="text-muted-foreground font-normal ml-1">
                      ({barberReviews.length} đánh giá từ khách hàng)
                    </span>
                  </div>
                </div>
              </div>

              {/* Reviews Section */}
              <div className="space-y-4">
                <h4 className="font-display text-lg font-bold text-foreground">
                  Đánh Giá Từ Khách Hàng
                </h4>
                
                {barberReviews.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl bg-card/30">
                    Chưa có đánh giá chi tiết nào cho barber này.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {barberReviews.map((r) => {
                      const rating = r.barberRating || r.rating;
                      const comment = r.barberComment || r.comment || "Đánh giá tuyệt vời!";
                      
                      return (
                        <div key={r.id} className="bg-card/50 border border-border/80 rounded-xl p-5 space-y-3 transition-colors hover:border-primary/25">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                {r.avatar}
                              </div>
                              <div>
                                <p className="font-semibold text-xs text-foreground/90">{r.name}</p>
                                <span className="text-[10px] text-muted-foreground">{r.date}</span>
                              </div>
                            </div>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star key={i} className={cn("h-3 w-3", i < rating ? 'fill-primary text-primary' : 'text-muted-foreground/30')} />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground italic pl-11">
                            "{comment}"
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex justify-end">
              <button
                type="button"
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground transition-colors"
                onClick={onClose}
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BarberReviewsModal;
