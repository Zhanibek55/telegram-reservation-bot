import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Table, Reservation, ClubSettings } from "@shared/schema";
import { getTelegramUserId } from "@/lib/telegram";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash, Plus, Check, X } from "lucide-react";

interface AdminPanelProps {
  isAdmin: boolean;
}

interface ReservationWithUserAndTable extends Reservation {
  user?: { name: string; phone: string };
  table?: { number: number };
}

const AdminPanel = ({ isAdmin }: AdminPanelProps) => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const telegramId = getTelegramUserId();
  const [activeTab, setActiveTab] = useState("tables");
  
  // New table state
  const [isAddTableDialogOpen, setIsAddTableDialogOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  
  // Club settings state
  const [openingTime, setOpeningTime] = useState("15:00");
  const [closingTime, setClosingTime] = useState("00:00");
  const [slotDuration, setSlotDuration] = useState("2");
  const [clubName, setClubName] = useState("Бильярдный клуб");

  // If not admin, redirect to home
  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: "Доступ запрещен",
        description: "У вас нет прав администратора",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [isAdmin, toast, setLocation]);

  // Fetch tables
  const { data: tables, isLoading: isTablesLoading } = useQuery<Table[]>({
    queryKey: ["/api/tables"],
    enabled: isAdmin,
  });

  // Fetch all reservations (admin only)
  const { data: reservations, isLoading: isReservationsLoading } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations", { all: true }],
    enabled: isAdmin,
    queryFn: async () => {
      if (!telegramId) throw new Error("User not authenticated");
      
      const response = await apiRequest(
        "GET",
        "/api/reservations?all=true",
        undefined,
        { headers: { "X-Telegram-ID": telegramId } }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch reservations");
      }
      
      return await response.json();
    },
  });

  // Fetch club settings
  const { data: settings } = useQuery<ClubSettings>({
    queryKey: ["/api/club-settings"],
    enabled: isAdmin,
    onSuccess: (data) => {
      setOpeningTime(data.opening_time);
      setClosingTime(data.closing_time);
      setSlotDuration(data.slot_duration.toString());
      setClubName(data.club_name);
    },
  });

  // Update table status mutation
  const updateTableMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      if (!telegramId) throw new Error("User not authenticated");
      
      const response = await apiRequest(
        "PATCH",
        `/api/tables/${id}`,
        { status },
        { headers: { "X-Telegram-ID": telegramId } }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update table");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      toast({
        title: "Статус стола обновлен",
        description: "Статус стола успешно обновлен",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обновить статус стола",
        variant: "destructive",
      });
    },
  });

  // Delete table mutation
  const deleteTableMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!telegramId) throw new Error("User not authenticated");
      
      const response = await apiRequest(
        "DELETE",
        `/api/tables/${id}`,
        undefined,
        { headers: { "X-Telegram-ID": telegramId } }
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Стол не найден");
        }
        throw new Error("Не удалось удалить стол");
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      toast({
        title: "Стол удален",
        description: "Стол успешно удален",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось удалить стол",
        variant: "destructive",
      });
    },
  });

  // Add new table mutation
  const addTableMutation = useMutation({
    mutationFn: async (tableNumber: number) => {
      if (!telegramId) throw new Error("User not authenticated");
      
      const response = await apiRequest(
        "POST",
        "/api/tables",
        { number: tableNumber, status: "available" },
        { headers: { "X-Telegram-ID": telegramId } }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add table");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      toast({
        title: "Стол добавлен",
        description: "Новый стол успешно добавлен",
      });
      setIsAddTableDialogOpen(false);
      setNewTableNumber("");
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось добавить стол",
        variant: "destructive",
      });
    },
  });

  // Update club settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<ClubSettings>) => {
      if (!telegramId) throw new Error("User not authenticated");
      
      const response = await apiRequest(
        "PATCH",
        "/api/club-settings",
        settings,
        { headers: { "X-Telegram-ID": telegramId } }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update settings");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/club-settings"] });
      toast({
        title: "Настройки обновлены",
        description: "Настройки клуба успешно обновлены",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обновить настройки",
        variant: "destructive",
      });
    },
  });

  // Handle table status change
  const handleTableStatusChange = (id: number, status: string) => {
    updateTableMutation.mutate({ id, status });
  };

  // Handle table deletion
  const handleDeleteTable = (id: number) => {
    deleteTableMutation.mutate(id);
  };

  // Handle add new table
  const handleAddTable = () => {
    const tableNum = parseInt(newTableNumber);
    if (isNaN(tableNum) || tableNum <= 0) {
      toast({
        title: "Ошибка",
        description: "Введите корректный номер стола",
        variant: "destructive",
      });
      return;
    }
    
    // Check if table with this number already exists
    if (tables?.some(table => table.number === tableNum)) {
      toast({
        title: "Ошибка",
        description: "Стол с таким номером уже существует",
        variant: "destructive",
      });
      return;
    }
    
    addTableMutation.mutate(tableNum);
  };

  // Handle club settings update
  const handleSaveSettings = () => {
    const slotDurationNum = parseInt(slotDuration);
    if (isNaN(slotDurationNum) || slotDurationNum <= 0) {
      toast({
        title: "Ошибка",
        description: "Введите корректную длительность слота",
        variant: "destructive",
      });
      return;
    }
    
    updateSettingsMutation.mutate({
      opening_time: openingTime,
      closing_time: closingTime,
      slot_duration: slotDurationNum,
      club_name: clubName
    });
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      if (dateStr.includes("-")) {
        const [year, month, day] = dateStr.split("-").map(Number);
        return format(new Date(year, month - 1, day), 'd MMMM yyyy', { locale: ru });
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div>
      {/* Admin Tabs */}
      <div className="bg-gray-100 px-4 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start border-b pb-0">
            <TabsTrigger value="tables" className="px-4 py-2 font-medium">
              Столы
            </TabsTrigger>
            <TabsTrigger value="reservations" className="px-4 py-2 font-medium">
              Бронирования
            </TabsTrigger>
            <TabsTrigger value="settings" className="px-4 py-2 font-medium">
              Настройки
            </TabsTrigger>
          </TabsList>
          
          {/* Tables Tab */}
          <TabsContent value="tables" className="p-0">
            <div className="p-4">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Управление столами</h3>
                  <Dialog open={isAddTableDialogOpen} onOpenChange={setIsAddTableDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#2AABEE] text-white flex items-center text-sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Добавить
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Добавить новый стол</DialogTitle>
                        <DialogDescription>
                          Введите номер нового стола
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label htmlFor="table-number">Номер стола</Label>
                        <Input
                          id="table-number"
                          type="number"
                          min="1"
                          value={newTableNumber}
                          onChange={(e) => setNewTableNumber(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsAddTableDialogOpen(false)}
                        >
                          Отмена
                        </Button>
                        <Button
                          className="bg-[#2AABEE]"
                          onClick={handleAddTable}
                          disabled={addTableMutation.isPending}
                        >
                          {addTableMutation.isPending ? "Добавление..." : "Добавить"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {isTablesLoading ? (
                  <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2AABEE] mx-auto"></div>
                    <p className="mt-2 text-gray-500">Загрузка списка столов...</p>
                  </div>
                ) : tables && tables.length > 0 ? (
                  <div className="space-y-3">
                    {tables.sort((a, b) => a.number - b.number).map((table) => (
                      <Card key={table.id} className="shadow-sm border border-gray-200">
                        <CardContent className="p-3 flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">Стол #{table.number}</h4>
                            <span 
                              className={`text-xs ${
                                table.status === "available" ? "text-[#55B978]" : 
                                table.status === "busy" ? "text-[#FF5252]" : 
                                "text-[#9E9E9E]"
                              }`}
                            >
                              {table.status === "available" ? "Доступен" : 
                               table.status === "busy" ? "Занят" : 
                               "Неактивен"}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <Select
                              value={table.status}
                              onValueChange={(value) => handleTableStatusChange(table.id, value)}
                            >
                              <SelectTrigger className="h-8 w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="available">Доступен</SelectItem>
                                <SelectItem value="busy">Занят</SelectItem>
                                <SelectItem value="inactive">Неактивен</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-gray-500 hover:text-red-500 h-8 w-8"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Удалить стол?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Вы уверены, что хотите удалить Стол #{table.number}? Это действие нельзя отменить.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={() => handleDeleteTable(table.id)}
                                  >
                                    Удалить
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">Нет столов. Добавьте первый стол.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Reservations Tab */}
          <TabsContent value="reservations" className="p-0">
            <div className="p-4">
              <h3 className="text-lg font-medium mb-4">Все бронирования</h3>
              
              {isReservationsLoading ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2AABEE] mx-auto"></div>
                  <p className="mt-2 text-gray-500">Загрузка бронирований...</p>
                </div>
              ) : reservations && reservations.length > 0 ? (
                <div className="space-y-3">
                  {reservations
                    .sort((a, b) => {
                      const dateA = new Date(a.date);
                      const dateB = new Date(b.date);
                      return dateB.getTime() - dateA.getTime();
                    })
                    .map((reservation) => {
                      const table = tables?.find(t => t.id === reservation.table_id);
                      
                      return (
                        <Card key={reservation.id} className="shadow-sm border border-gray-200">
                          <CardContent className="p-3">
                            <div className="flex justify-between mb-2">
                              <span className="font-medium">
                                Стол #{table?.number || reservation.table_id}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                reservation.status === "active" ? "bg-[#2AABEE] text-white" :
                                reservation.status === "completed" ? "bg-gray-200 text-gray-700" :
                                "bg-red-100 text-red-700"
                              }`}>
                                {reservation.status === "active" ? "Активно" :
                                 reservation.status === "completed" ? "Завершено" :
                                 "Отменено"}
                              </span>
                            </div>
                            <div className="text-gray-600 mb-1">
                              <div>{formatDate(reservation.date)}, {reservation.start_time} - {reservation.end_time}</div>
                            </div>
                            {reservation.comment && (
                              <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded mb-2">
                                <span className="font-medium">Комментарий:</span> {reservation.comment}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">Нет бронирований</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="p-0">
            <div className="p-4">
              <h3 className="text-lg font-medium mb-3">Настройки клуба</h3>
              <Card className="shadow-sm border border-gray-200">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label htmlFor="club-name" className="block text-gray-700 mb-1">
                      Название клуба
                    </Label>
                    <Input
                      id="club-name"
                      value={clubName}
                      onChange={(e) => setClubName(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Label className="block text-gray-700 mb-1">
                      Часы работы клуба
                    </Label>
                    <div className="flex space-x-2 items-center">
                      <Select value={openingTime} onValueChange={setOpeningTime}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }).map((_, i) => (
                            <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                              {i.toString().padStart(2, '0')}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-gray-500">—</span>
                      <Select value={closingTime} onValueChange={setClosingTime}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }).map((_, i) => (
                            <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                              {i.toString().padStart(2, '0')}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="slot-duration" className="block text-gray-700 mb-1">
                      Длительность слота (часы)
                    </Label>
                    <Select value={slotDuration} onValueChange={setSlotDuration}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              
              <Button
                className="w-full mt-4 bg-[#2AABEE]"
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? "Сохранение..." : "Сохранить настройки"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
