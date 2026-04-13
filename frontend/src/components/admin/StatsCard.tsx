import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  growth?: number;
  prefix?: string;
}

const StatsCard = ({ title, value, icon: Icon, growth, prefix }: Props) => (
  <Card className="border-border bg-card">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{prefix}{value}</p>
          {growth !== undefined && (
            <div className={cn('mt-1 flex items-center gap-1 text-xs font-medium', growth >= 0 ? 'text-green-400' : 'text-destructive')}>
              {growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(growth)}%
            </div>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default StatsCard;
