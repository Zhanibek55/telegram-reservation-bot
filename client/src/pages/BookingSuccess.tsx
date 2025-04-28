import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface SuccessBookingData {
  tableId: number;
  tableNumber: number;
  date: string;
  dateDisplay: string;
  startTime: string;
  endTime: string;
  reservationId: number;
}

const BookingSuccess = () => {
  const [, setLocation] = useLocation();
  const [bookingData, setBookingData] = useState<SuccessBookingData | null>(null);

  // Load success booking data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('successBooking');
    if (savedData) {
      setBookingData(JSON.parse(savedData));
    } else {
      // No booking data, redirect back to home
      setLocation("/");
    }
  }, [setLocation]);

  const handleViewBookings = () => {
    setLocation("/bookings");
  };

  const handleGoHome = () => {
    setLocation("/");
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
    <div className="p-5 flex flex-col items-center justify-center h-full">
      <div className="text-center">
        <div className="inline-block p-4 bg-[#55B978]/20 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#55B978]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-semibold mb-2">Бронирование успешно!</h2>
        <p className="text-gray-600 mb-8">Ваше бронирование подтверждено. Ждем вас в клубе!</p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left w-full max-w-sm mx-auto">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Стол:</span>
            <span className="font-medium">Стол #{bookingData.tableNumber}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Дата:</span>
            <span className="font-medium">{bookingData.dateDisplay}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Время:</span>
            <span className="font-medium">{bookingData.startTime} - {bookingData.endTime}</span>
          </div>
        </div>
        
        <div className="space-x-3">
          <Button
            className="bg-[#2AABEE] hover:bg-[#2AABEE]/90 px-5"
            onClick={handleViewBookings}
          >
            Мои бронирования
          </Button>
          <Button
            variant="outline"
            className="border border-gray-300 px-5 hover:bg-gray-50"
            onClick={handleGoHome}
          >
            На главную
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
