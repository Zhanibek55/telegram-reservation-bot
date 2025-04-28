import { useEffect, useState } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "./lib/queryClient";
import { initTelegramApp, getTelegramUserId } from "./lib/telegram";

// Pages
import NotFound from "@/pages/not-found";
import Auth from "@/pages/Auth";
import TableLayout from "@/pages/TableLayout";
import BookingConfirmation from "@/pages/BookingConfirmation";
import BookingSuccess from "@/pages/BookingSuccess";
import MyBookings from "@/pages/MyBookings";
import AdminPanel from "@/pages/AdminPanel";

// Components
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [clubName, setClubName] = useState("Бильярдный клуб");
  const telegramId = getTelegramUserId();

  const { data: clubSettings } = useQuery({
    queryKey: ["/api/club-settings"],
    onSuccess: (data) => {
      if (data?.club_name) {
        setClubName(data.club_name);
      }
    }
  });

  // Fetch current user
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/users/me"],
    enabled: !!telegramId,
    queryFn: async () => {
      try {
        const res = await apiRequest(
          "GET",
          "/api/users/me",
          undefined,
          { headers: { "X-Telegram-ID": telegramId || "" } }
        );
        return await res.json();
      } catch (error) {
        // If user doesn't exist, set isAuthenticated to false
        setIsAuthenticated(false);
        return null;
      }
    },
    onSuccess: (data) => {
      if (data) {
        setIsAuthenticated(true);
        setIsAdmin(data.is_admin || false);
      } else {
        setIsAuthenticated(false);
      }
    },
    onError: () => {
      setIsAuthenticated(false);
    }
  });

  // Initialize Telegram Mini App
  useEffect(() => {
    initTelegramApp();
  }, []);

  if (isUserLoading || isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2AABEE]"></div>
      </div>
    );
  }

  // If user is not authenticated, show auth page
  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-white">
      <Header clubName={clubName} isAdmin={isAdmin} />
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/" component={TableLayout} />
          <Route path="/booking-confirmation" component={BookingConfirmation} />
          <Route path="/booking-success" component={BookingSuccess} />
          <Route path="/bookings" component={MyBookings} />
          <Route path="/admin" component={() => <AdminPanel isAdmin={isAdmin} />} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNavigation isAdmin={isAdmin} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
