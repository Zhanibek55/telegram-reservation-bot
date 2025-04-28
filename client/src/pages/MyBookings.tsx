import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Reservation, Table } from "@shared/schema";
import { getTelegramUserId } from "@/lib/telegram";

interface ReservationWithTable extends Reservation {
  table?: Table;
}

const MyBookings = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const telegramId = getTelegramUserId();

  // Fetch user's reservations
  const { data: reservations, isLoading, error } = useQuery<ReservationWithTable[]>({
    queryKey: ["/api/reservations"],
    enabled: !!telegramId,
  });

  // Fetch tables for displaying table numbers
  const { data: tables } = useQuery<Table[]>({
    queryKey: ["/api/tables"],
  });

  // Join tables with reservations for display
  const reservationsWithTables = reservations?.map(reservation => {
    const table = tables?.find(t => t.id === reservation.table_id);
    return { ...reservation, table };
  });

  // Active and completed reservations
  const activeReservations = reservationsWithTables?.filter(r => r.status === "active") || [];
  const completedReservations = reservationsWithTables?.filter(r => r.status === "completed") || [];

  // Cancel reservation mutation
  const cancelMutation = useMutation({
    mutationFn: async (reservationId: number) => {
      if (!telegramId) throw new Error("User not authenticated");
      
      const response = await apiRequest(
        "PATCH",
        `/api/reservations/${reservationId}`,
        { status: "cancelled" },
        { headers: { "X-Telegram-ID": telegramId } }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to cancel reservation");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({
        title: "Бронирование отменено",
        description: "Ваше бронирование успешно отменено",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось отменить бронирование",
        variant: "destructive",
      });
    }
  });

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      // If dateStr is already in the right format, no need to parse
      if (dateStr.includes("-")) {
        const [year, month, day] = dateStr.split("-").map(Number);
        return format(new Date(year, month - 1, day), 'd MMMM yyyy', { locale: ru });
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  // Handle new booking
  const handleNewBooking = () => {
    setLocation("/");
  };

  // Handle reservation cancellation
  const handleCancelReservation = (id: number) => {
    cancelMutation.mutate(id);
  };

  // Handle repeat booking (redirect to booking flow with same table)
  const handleRepeatBooking = (reservation: ReservationWithTable) => {
    if (!reservation.table) {
      toast({
        title: "Ошибка",
        description: "Информация о столе недоступна",
        variant: "destructive",
      });
      return;
    }
    
    // Redirect to home with pre-selected table
    localStorage.setItem('preSelectedTable', JSON.stringify({
      id: reservation.table_id,
      number: reservation.table.number
    }));
    
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2AABEE] mx-auto"></div>
        <p className="mt-4 text-gray-500">Загрузка ваших бронирований...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center py-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="mt-4 text-gray-700">Не удалось загрузить данные о бронированиях</p>
        <Button className="mt-4 bg-[#2AABEE]" onClick={() => window.location.reload()}>
          Попробовать снова
        </Button>
      </div>
    );
  }

  if (!reservations || reservations.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Мои бронирования</h2>
        
        <div className="text-center py-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 mb-4">У вас пока нет бронирований</p>
          <Button 
            className="bg-[#2AABEE] hover:bg-[#2AABEE]/90"
            onClick={handleNewBooking}
          >
            Забронировать стол
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Мои бронирования</h2>
      
      <div className="space-y-4">
        {activeReservations.length > 0 && (
          <>
            <h3 className="text-lg font-medium">Активные</h3>
            {activeReservations.map((reservation) => (
              <Card key={reservation.id} className="border border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-lg">
                      Стол #{reservation.table?.number || reservation.table_id}
                    </span>
                    <span className="bg-[#2AABEE] text-white px-2 py-1 rounded text-xs">
                      Активно
                    </span>
                  </div>
                  <div className="text-gray-600 mb-3">
                    <div>
                      {formatDate(reservation.date)}, {reservation.start_time} - {reservation.end_time}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-[#2AABEE] p-0 h-auto"
                      onClick={() => setLocation(`/edit-booking/${reservation.id}`)}
                      disabled={true} // Not implemented in this version
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Изменить</span>
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 p-0 h-auto"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Отменить</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Отменить бронирование?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Вы уверены, что хотите отменить бронирование стола #{reservation.table?.number || reservation.table_id} на {formatDate(reservation.date)}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => handleCancelReservation(reservation.id)}
                          >
                            Отменить бронирование
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
        
        {completedReservations.length > 0 && (
          <>
            <h3 className="text-lg font-medium mt-6">Завершенные</h3>
            {completedReservations.map((reservation) => (
              <Card key={reservation.id} className="border border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-lg">
                      Стол #{reservation.table?.number || reservation.table_id}
                    </span>
                    <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                      Завершено
                    </span>
                  </div>
                  <div className="text-gray-600 mb-3">
                    <div>
                      {formatDate(reservation.date)}, {reservation.start_time} - {reservation.end_time}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#2AABEE] hover:text-[#2AABEE]/80 p-0 h-auto"
                      onClick={() => handleRepeatBooking(reservation)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Повторить</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
      
      <div className="mt-6">
        <Button 
          className="w-full bg-[#2AABEE] hover:bg-[#2AABEE]/90"
          onClick={handleNewBooking}
        >
          Новое бронирование
        </Button>
      </div>
    </div>
  );
};

export default MyBookings;
