import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface TimeSlotSelectorProps {
  date: string;
  tableId: number;
  onTimeSelect: (startTime: string, endTime: string) => void;
  selectedStartTime?: string;
  selectedEndTime?: string;
}

const TimeSlotSelector = ({ 
  date, 
  tableId, 
  onTimeSelect,
  selectedStartTime,
  selectedEndTime 
}: TimeSlotSelectorProps) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!date || !tableId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const res = await apiRequest("GET", `/api/time-slots/${date}/${tableId}`, undefined);
        const slots = await res.json();
        setTimeSlots(slots);
      } catch (err) {
        setError("Не удалось загрузить доступные слоты");
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить доступные слоты времени",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimeSlots();
  }, [date, tableId, toast]);

  const isSelected = (start: string, end: string) => {
    return selectedStartTime === start && selectedEndTime === end;
  };

  const formatTime = (time: string) => {
    return time;
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Выберите время</h3>
      
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2AABEE] mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Загрузка доступных слотов...</p>
        </div>
      )}
      
      {error && (
        <div className="text-center py-4">
          <p className="text-sm text-red-500">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Попробовать снова
          </Button>
        </div>
      )}
      
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-2">
          {timeSlots.map((slot, index) => (
            <Button
              key={index}
              variant={isSelected(slot.start_time, slot.end_time) ? "default" : "outline"}
              className={cn(
                "p-2 h-auto text-sm font-normal",
                !slot.is_available && "bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100"
              )}
              disabled={!slot.is_available}
              onClick={() => slot.is_available && onTimeSelect(slot.start_time, slot.end_time)}
            >
              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
            </Button>
          ))}
          
          {timeSlots.length === 0 && !loading && (
            <div className="col-span-3 text-center py-6">
              <p className="text-gray-500">Нет доступных слотов на выбранную дату</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimeSlotSelector;
