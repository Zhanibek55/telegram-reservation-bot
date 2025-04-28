import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import TableLayoutSVG from "@/components/TableLayoutSVG";
import DateSelector from "@/components/DateSelector";
import TimeSlotSelector from "@/components/TimeSlotSelector";
import { Table } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { showAlert, hapticFeedback } from "@/lib/telegram";

const TableLayout = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch tables data
  const { data: tables, isLoading, error } = useQuery({
    queryKey: ["/api/tables"],
  });

  // Format date for display and API calls
  const formattedDateDisplay = selectedDate 
    ? format(selectedDate, 'd MMMM', { locale: ru }) 
    : '';
  
  const formattedDateApi = selectedDate
    ? format(selectedDate, 'yyyy-MM-dd')
    : '';

  // Handle table selection
  const handleTableSelect = (table: Table) => {
    if (table.status === "available") {
      setSelectedTable(table);
      // Reset time selection when table changes
      setSelectedStartTime(null);
      setSelectedEndTime(null);
    } else if (table.status === "busy") {
      hapticFeedback("error");
      showAlert("Этот стол уже забронирован");
    } else {
      hapticFeedback("error");
      showAlert("Этот стол недоступен");
    }
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Reset time selection when date changes
    setSelectedStartTime(null);
    setSelectedEndTime(null);
  };

  // Handle time slot selection
  const handleTimeSelect = (startTime: string, endTime: string) => {
    setSelectedStartTime(startTime);
    setSelectedEndTime(endTime);
    hapticFeedback("success");
  };

  // Proceed to booking confirmation
  const handleProceedToConfirmation = () => {
    if (!selectedTable || !selectedDate || !selectedStartTime || !selectedEndTime) {
      toast({
        title: "Не все данные выбраны",
        description: "Пожалуйста, выберите стол, дату и время",
        variant: "destructive",
      });
      return;
    }
    
    // Save booking data to localStorage for the confirmation page
    localStorage.setItem('bookingData', JSON.stringify({
      tableId: selectedTable.id,
      tableNumber: selectedTable.number,
      date: formattedDateApi,
      dateDisplay: formattedDateDisplay,
      startTime: selectedStartTime,
      endTime: selectedEndTime
    }));
    
    setLocation("/booking-confirmation");
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Выберите стол</h2>
        <p className="text-gray-600 text-sm">
          Доступность столов на <span>{formattedDateDisplay || 'сегодня'}</span>
        </p>
      </div>
      
      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2AABEE] mx-auto"></div>
          <p className="mt-4 text-gray-500">Загрузка данных...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="mt-4 text-gray-700">Не удалось загрузить данные о столах</p>
        </div>
      ) : (
        <>
          <TableLayoutSVG 
            tables={tables || []} 
            onTableClick={handleTableSelect} 
          />
          
          <DateSelector 
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
          
          {selectedTable && selectedDate && (
            <TimeSlotSelector 
              date={formattedDateApi}
              tableId={selectedTable.id}
              onTimeSelect={handleTimeSelect}
              selectedStartTime={selectedStartTime || undefined}
              selectedEndTime={selectedEndTime || undefined}
            />
          )}
          
          {selectedTable && selectedDate && selectedStartTime && selectedEndTime && (
            <div className="mt-6">
              <button
                className="w-full bg-[#2AABEE] text-white py-3 rounded-lg font-medium hover:bg-[#2AABEE]/90 transition"
                onClick={handleProceedToConfirmation}
              >
                Продолжить
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TableLayout;
