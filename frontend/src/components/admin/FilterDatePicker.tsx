import { format, parseISO } from 'date-fns';
import { CalendarDays } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface FilterDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const FilterDatePicker = ({
  value,
  onChange,
  placeholder = 'Chọn ngày',
}: FilterDatePickerProps) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        type="button"
        variant="outline"
        className={cn(
          'w-full justify-between border-input bg-background px-3 text-left font-normal hover:bg-background',
          !value && 'text-muted-foreground',
        )}
      >
        <span>{value ? format(parseISO(value), 'dd/MM/yyyy') : placeholder}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-yellow-400" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar
        mode="single"
        selected={value ? parseISO(value) : undefined}
        onSelect={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : '')}
        initialFocus
      />
    </PopoverContent>
  </Popover>
);

export default FilterDatePicker;
