import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Home, CalendarDays, Languages, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  adminOnly?: boolean;
}

interface BottomNavigationProps {
  isAdmin?: boolean;
}

const BottomNavigation = ({ isAdmin = false }: BottomNavigationProps) => {
  const [location, setLocation] = useLocation();
  const [activeItem, setActiveItem] = useState<string>("home");

  // Navigation items
  const navItems: NavItem[] = [
    {
      id: "home",
      label: "Главная", 
      icon: <Home className="h-5 w-5" />, 
      path: "/"
    },
    {
      id: "bookings",
      label: "Бронирования", 
      icon: <CalendarDays className="h-5 w-5" />, 
      path: "/bookings"
    },
    {
      id: "language",
      label: "Язык", 
      icon: <Languages className="h-5 w-5" />, 
      path: "#"
    },
    {
      id: "admin",
      label: "Админ", 
      icon: <Settings className="h-5 w-5" />, 
      path: "/admin",
      adminOnly: true
    }
  ];

  // Update active item based on location
  useEffect(() => {
    if (location === "/") {
      setActiveItem("home");
    } else if (location === "/bookings") {
      setActiveItem("bookings");
    } else if (location === "/admin") {
      setActiveItem("admin");
    }
  }, [location]);

  const handleNavClick = (item: NavItem) => {
    // If admin-only item and user is not admin, show alert
    if (item.adminOnly && !isAdmin) {
      alert("У вас нет прав администратора");
      return;
    }

    // Handle language toggle separately
    if (item.id === "language") {
      // This could be replaced with a proper language toggle
      alert("Функция смены языка будет доступна в следующем обновлении");
      return;
    }

    setActiveItem(item.id);
    setLocation(item.path);
  };

  return (
    <nav className="border-t border-gray-200 bg-white flex justify-around py-2 px-4 sticky bottom-0">
      {navItems
        .filter(item => !item.adminOnly || isAdmin)
        .map(item => (
          <button
            key={item.id}
            className={cn(
              "flex flex-col items-center pt-2 pb-1",
              activeItem === item.id ? "text-[#2AABEE]" : "text-gray-500"
            )}
            onClick={() => handleNavClick(item)}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
    </nav>
  );
};

export default BottomNavigation;
