import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { setupBackButton, getTelegramUserId } from "@/lib/telegram";

interface BookingData {
  tableId: number;
  tableNumber: number;
  date: string;
  dateDisplay: string;
  startTime: string;
  endTime: string;
}

const BookingConfirmation = () => {
  const [location, setLocation] = useLocation();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const telegramId = getTelegramUserId();

  // Load booking data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('bookingData');
    if (savedData) {
      setBookingData(JSON.parse(savedData));
    } else {
      // No booking data, redirect back to table selection
      setLocation("/");
    }
  }, [setLocation]);

  // Setup Telegram back button
  useEffect(() => {
    const cleanup = setupBackButton(() => setLocation("/"));
    return cleanup;
  }, [setLocation]);

  const handleBackClick = () => {
    setLocation("/");
  };

  const handleConfirmBooking = async () => {
    if (!bookingData || !telegramId) {
      toast({
        title: "Ошибка",
        description: "Данные для бронирования отсутствуют",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get user details from telegram ID
      const userResponse = await apiRequest(
        "GET", 
        "/api/users/me", 
        undefined, 
        { headers: { "X-Telegram-ID": telegramId } }
      );
      
      if (!userResponse.ok) {
        throw new Error("Пользователь не найден");
      }
      
      const userData = await userResponse.json();

      // Create reservation
      const response = await apiRequest("POST", "/api/reservations", {
        user_id: userData.id,
        table_id: bookingData.tableId,
        date: bookingData.date,
        start_time: bookingData.startTime,
        end_time: bookingData.endTime,
        status: "active",
        comment: comment || undefined
      });

      if (response.ok) {
        // Store reservation data for the success page
        const reservation = await response.json();
        localStorage.setItem('successBooking', JSON.stringify({
          ...bookingData,
          reservationId: reservation.id
        }));
        
        // Navigate to success page
        setLocation("/booking-success");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Не удалось создать бронирование");
      }
    } catch (error) {
      toast({
        title: "Ошибка бронирования",
        description: error instanceof Error ? error.message : "Произошла ошибка при создании бронирования",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!bookingData) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2AABEE] mx-auto"></div>
        <p className="mt-4 text-gray-500">Загрузка данных бронирования...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="text-center mb-6">
        <div className="inline-block p-3 bg-[#2AABEE]/10 rounded-full mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#2AABEE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">Подтверждение бронирования</h2>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between mb-3">
          <span className="text-gray-600">Стол:</span>
          <span className="font-medium">Стол #{bookingData.tableNumber}</span>
        </div>
        <div className="flex justify-between mb-3">
          <span className="text-gray-600">Дата:</span>
          <span className="font-medium">{bookingData.dateDisplay}</span>
        </div>
        <div className="flex justify-between mb-3">
          <span className="text-gray-600">Время:</span>
          <span className="font-medium">{bookingData.startTime} - {bookingData.endTime}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Продолжительность:</span>
          <span className="font-medium">2 часа</span>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Комментарий (необязательно)</h3>
        <Textarea
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#2AABEE]"
          rows={3}
          placeholder="Дополнительные пожелания..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      
      <div className="flex space-x-3">
        <Button
          variant="outline"
          className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
          onClick={handleBackClick}
          disabled={isSubmitting}
        >
          Назад
        </Button>
        <Button
          className="flex-1 bg-[#2AABEE] text-white py-3 rounded-lg font-medium hover:bg-[#2AABEE]/90 transition"
          onClick={handleConfirmBooking}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Подождите...
            </span>
          ) : "Забронировать"}
        </Button>
      </div>
    </div>
  );
};

export default BookingConfirmation;
