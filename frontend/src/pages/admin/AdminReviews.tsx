import { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import { mockReviews, AdminReview } from '@/data/adminMockData';
import { Button } from '@/components/ui/button';
import { Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

const AdminReviews = () => {
  const [reviews, setReviews] = useState(mockReviews);

  useEffect(() => {
    const load = async () => {
      try {
        setReviews(await api.admin.getReviews());
      } catch {
        // keep fallback
      }
    };
    void load();
  }, []);

  const deleteReview = async (id: string) => {
    try {
      await api.admin.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success('Review deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const columns: Column<AdminReview>[] = [
    { key: 'userName', label: 'User', render: (r) => <span className="font-medium">{r.userName}</span> },
    {
      key: 'rating', label: 'Rating', render: (r) => (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < r.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
          ))}
        </div>
      )
    },
    { key: 'comment', label: 'Comment', render: (r) => <span className="line-clamp-2 max-w-xs">{r.comment}</span> },
    { key: 'date', label: 'Date' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Review Management</h1>
        <p className="text-sm text-muted-foreground">{reviews.length} reviews</p>
      </div>

      <DataTable data={reviews} columns={columns} searchPlaceholder="Search reviews..." actions={(r) => (
        <Button size="sm" variant="ghost" onClick={() => deleteReview(r.id)} className="text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      )} />
    </div>
  );
};

export default AdminReviews;
