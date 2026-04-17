import { Star } from 'lucide-react';
import { Review } from '@/data/mockData';
import { useTranslation } from 'react-i18next';

interface Props {
  review: Review;
}

const ReviewCard = ({ review }: Props) => {
  const { t } = useTranslation();
  const reviewText = review.comment || t(`reviews.${review.commentKey}`);

  return (
    <div className="bg-card border border-border rounded-lg p-6 min-w-[300px]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
          {review.avatar}
        </div>
        <div>
          <p className="font-medium text-sm">{review.name}</p>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
            ))}
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground italic">"{reviewText}"</p>
    </div>
  );
};

export default ReviewCard;
