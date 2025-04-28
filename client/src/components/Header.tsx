import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Languages, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  clubName: string;
  isAdmin?: boolean;
  onLanguageChange?: (lang: string) => void;
}

const Header = ({ clubName, isAdmin = false, onLanguageChange }: HeaderProps) => {
  const [language, setLanguage] = useState<string>("ru");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLanguageToggle = () => {
    const newLang = language === "ru" ? "en" : "ru";
    setLanguage(newLang);
    if (onLanguageChange) {
      onLanguageChange(newLang);
    }
    
    toast({
      title: language === "ru" ? "Languages changed" : "Язык изменен",
      description: language === "ru" ? "English is now active" : "Русский язык активирован",
      duration: 2000,
    });
  };

  return (
    <header className="sticky top-0 z-10 bg-[#2AABEE] text-white p-4 shadow-md">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">{clubName}</h1>
        <div className="flex items-center space-x-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-8 h-8 rounded-full hover:bg-white/20"
              >
                <Languages className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="space-y-2">
                <h4 className="font-medium">Язык / Languages</h4>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <Label htmlFor="language-toggle" className="cursor-pointer">
                      {language === "ru" ? "Русский" : "English"}
                    </Label>
                  </div>
                  <Switch 
                    id="language-toggle"
                    checked={language === "en"}
                    onCheckedChange={handleLanguageToggle}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-8 h-8 rounded-full hover:bg-white/20"
              >
                <User className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="space-y-2">
                <h4 className="font-medium">Профиль</h4>
                <div className="text-sm text-gray-500">
                  {isAdmin && <span className="block text-blue-600 font-medium">Администратор</span>}
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-2 py-1 h-auto"
                    onClick={() => setLocation("/bookings")}
                  >
                    Мои бронирования
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
};

export default Header;
