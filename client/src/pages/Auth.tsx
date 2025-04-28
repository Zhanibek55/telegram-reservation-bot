import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getTelegramUserId } from "@/lib/telegram";

const userSchema = z.object({
  name: z.string()
    .min(2, { message: "Имя должно содержать минимум 2 символа" })
    .max(50, { message: "Имя не должно превышать 50 символов" }),
  phone: z.string()
    .min(5, { message: "Введите корректный номер телефона" })
    .max(20, { message: "Номер телефона слишком длинный" })
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/, { 
      message: "Неверный формат номера телефона" 
    }),
});

type FormValues = z.infer<typeof userSchema>;

const Auth = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const telegramId = getTelegramUserId();

  const form = useForm<FormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      phone: ""
    }
  });

  const onSubmit = async (values: FormValues) => {
    if (!telegramId) {
      toast({
        title: "Ошибка",
        description: "Не удалось получить идентификатор Telegram. Пожалуйста, обновите страницу и повторите попытку.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest("POST", "/api/users", {
        telegram_id: telegramId,
        name: values.name,
        phone: values.phone,
        is_admin: false
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Регистрация выполнена успешно!",
        });
        setLocation("/");
      }
    } catch (error) {
      toast({
        title: "Ошибка регистрации",
        description: error instanceof Error ? error.message : "Произошла ошибка при регистрации",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-5 flex flex-col items-center justify-center h-full">
      <div className="text-center mb-10">
        <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2AABEE]/10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#2AABEE]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-semibold mb-2">Добро пожаловать!</h2>
        <p className="text-gray-600">Для бронирования столов необходимо зарегистрироваться</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Ваше имя</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Введите ваше имя" 
                    {...field} 
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2AABEE]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Номер телефона</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="+7 (xxx) xxx-xx-xx" 
                    type="tel" 
                    {...field} 
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2AABEE]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#2AABEE] text-white py-3 rounded-lg font-medium hover:bg-[#2AABEE]/90 transition"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Регистрация...
              </span>
            ) : "Зарегистрироваться"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default Auth;
