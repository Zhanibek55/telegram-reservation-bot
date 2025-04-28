import { useState, useEffect } from "react";
import { format, addDays, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  daysToShow?: number;
}

const DateSelector = ({ selectedDate, onDateSelect, daysToShow = 7 }: DateSelectorProps) => {
  const [dates, setDates] = useState<Date[]>([]);
  
  // Generate dates to show
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dateArray: Date[] = [];
    for (let i = 0; i < daysToShow; i++) {
      dateArray.push(addDays(today, i));
    }
    
    setDates(dateArray);
    
    // If no date is selected, select today by default
    if (!selectedDate) {
      onDateSelect(today);
    }
  }, [daysToShow, selectedDate, onDateSelect]);
  
  const formatDayOfMonth = (date: Date) => {
    return format(date, 'd');
  };
  
  const formatDayOfWeek = (date: Date) => {
    return format(date, 'EEE', { locale: ru }).charAt(0).toUpperCase() + format(date, 'EEE', { locale: ru }).slice(1);
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return isSameDay(date, today);
  };
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-2">Выберите дату</h3>
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {dates.map((date) => (
          <Button
            key={date.toISOString()}
            variant="outline"
            className={cn(
              "flex-shrink-0 min-w-[60px] p-2 h-auto flex flex-col",
              isToday(date) && "border-blue-300",
              selectedDate && isSameDay(date, selectedDate) && "bg-[#2AABEE] text-white"
            )}
            onClick={() => onDateSelect(date)}
          >
            <div className="font-medium text-base">{formatDayOfMonth(date)}</div>
            <div className={cn(
              "text-xs",
              selectedDate && isSameDay(date, selectedDate) ? "text-gray-100" : "text-gray-500"
            )}>
              {formatDayOfWeek(date)}
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DateSelector;
