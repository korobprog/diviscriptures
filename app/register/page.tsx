"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Mail, Lock, User, MapPin, Globe, Flower } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    city: "",
    language: "ru",
    timezone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const countries = [
    { value: "ru", label: "Россия" },
    { value: "us", label: "США" },
    { value: "in", label: "Индия" },
    { value: "es", label: "Испания" },
    { value: "fr", label: "Франция" },
    { value: "de", label: "Германия" },
  ];

  const languages = [
    { value: "ru", label: "Русский" },
    { value: "en", label: "English" },
    { value: "hi", label: "हिन्दी" },
    { value: "es", label: "Español" },
    { value: "fr", label: "Français" },
    { value: "de", label: "Deutsch" },
  ];

  const timezones = [
    { value: "Europe/Moscow", label: "Москва (UTC+3)" },
    { value: "America/New_York", label: "Нью-Йорк (UTC-5)" },
    { value: "Asia/Kolkata", label: "Дели (UTC+5:30)" },
    { value: "Europe/Madrid", label: "Мадрид (UTC+1)" },
    { value: "Europe/Paris", label: "Париж (UTC+1)" },
    { value: "Europe/Berlin", label: "Берлин (UTC+1)" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Валидация
    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true);
        // Автоматический вход после регистрации
        setTimeout(async () => {
          await signIn("credentials", {
            email: formData.email,
            password: formData.password,
            redirect: false,
          });
          router.push("/");
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || "Ошибка при регистрации");
      }
    } catch (error) {
      setError("Произошла ошибка при регистрации");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center bg-white/80 backdrop-blur-sm border-saffron-200 shadow-xl">
          <CardContent className="pt-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-4">
              <Flower className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-saffron-800 mb-2">
              Добро пожаловать!
            </h2>
            <p className="text-saffron-600 mb-4">
              Ваш аккаунт успешно создан. Вы будете перенаправлены на главную страницу.
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saffron-500 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50 flex items-center justify-center p-4">
      {/* Декоративные элементы */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-lotus-pink/10 rounded-full animate-float"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-saffron-200/20 rounded-full animate-float-delayed"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-gold-200/15 rounded-full animate-sacred-pulse"></div>
      </div>

      <Card className="w-full max-w-lg relative z-10 bg-white/80 backdrop-blur-sm border-saffron-200 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-saffron-400 to-lotus-pink-400 rounded-full flex items-center justify-center">
            <Flower className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-saffron-800">
              Присоединяйтесь к сообществу
            </CardTitle>
            <CardDescription className="text-saffron-600">
              Создайте аккаунт для изучения священных писаний
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-saffron-700 font-medium">
                  Имя
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-saffron-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ваше имя"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="pl-10 border-saffron-200 focus:border-saffron-400 focus:ring-saffron-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-saffron-700 font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-saffron-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="ваш@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 border-saffron-200 focus:border-saffron-400 focus:ring-saffron-400"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country" className="text-saffron-700 font-medium">
                  Страна
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-saffron-400 z-10" />
                  <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
                    <SelectTrigger className="pl-10 border-saffron-200 focus:border-saffron-400 focus:ring-saffron-400">
                      <SelectValue placeholder="Выберите страну" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-saffron-700 font-medium">
                  Город
                </Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Ваш город"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="border-saffron-200 focus:border-saffron-400 focus:ring-saffron-400"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language" className="text-saffron-700 font-medium">
                  Язык
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-saffron-400 z-10" />
                  <Select value={formData.language} onValueChange={(value) => handleInputChange("language", value)}>
                    <SelectTrigger className="pl-10 border-saffron-200 focus:border-saffron-400 focus:ring-saffron-400">
                      <SelectValue placeholder="Выберите язык" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((language) => (
                        <SelectItem key={language.value} value={language.value}>
                          {language.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-saffron-700 font-medium">
                  Часовой пояс
                </Label>
                <Select value={formData.timezone} onValueChange={(value) => handleInputChange("timezone", value)}>
                  <SelectTrigger className="border-saffron-200 focus:border-saffron-400 focus:ring-saffron-400">
                    <SelectValue placeholder="Выберите часовой пояс" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((timezone) => (
                      <SelectItem key={timezone.value} value={timezone.value}>
                        {timezone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-saffron-700 font-medium">
                  Пароль
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-saffron-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 pr-10 border-saffron-200 focus:border-saffron-400 focus:ring-saffron-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-saffron-400 hover:text-saffron-600"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-saffron-700 font-medium">
                  Подтвердите пароль
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-saffron-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="pl-10 pr-10 border-saffron-200 focus:border-saffron-400 focus:ring-saffron-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-saffron-400 hover:text-saffron-600"
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-saffron-500 to-lotus-pink-500 hover:from-saffron-600 hover:to-lotus-pink-600 text-white font-medium py-2.5"
              disabled={isLoading}
            >
              {isLoading ? "Создание аккаунта..." : "Создать аккаунт"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-saffron-600">
              Уже есть аккаунт?{" "}
              <a
                href="/login"
                className="font-medium text-saffron-700 hover:text-saffron-800 underline"
              >
                Войти
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
