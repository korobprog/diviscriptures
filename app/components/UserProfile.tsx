"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  MapPin, 
  Globe, 
  Clock, 
  Settings, 
  LogOut, 
  Edit3,
  Save,
  X,
  Crown,
  Users
} from "lucide-react";

export default function UserProfile() {
  const { data: session, update } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    city: session?.user?.city || "",
    language: session?.user?.language || "ru",
    timezone: session?.user?.timezone || "",
  });

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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await update(); // Обновляем сессию
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Ошибка обновления профиля:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: session?.user?.name || "",
      city: session?.user?.city || "",
      language: session?.user?.language || "ru",
      timezone: session?.user?.timezone || "",
    });
    setIsEditing(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return <Badge variant="destructive" className="bg-red-500"><Crown className="w-3 h-3 mr-1" />Супер-админ</Badge>;
      case "ADMIN":
        return <Badge variant="default" className="bg-saffron-500"><Users className="w-3 h-3 mr-1" />Админ</Badge>;
      default:
        return <Badge variant="secondary">Участник</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!session?.user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <p className="text-saffron-600">Войдите в систему для просмотра профиля</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Основная информация */}
      <Card className="bg-white/80 backdrop-blur-sm border-saffron-200">
        <CardHeader className="text-center">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-24 h-24 border-4 border-saffron-200">
              <AvatarImage src={session.user.image || ""} />
              <AvatarFallback className="bg-gradient-to-br from-saffron-400 to-lotus-pink-400 text-white text-xl">
                {getInitials(session.user.name || "U")}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl text-saffron-800">
                {session.user.name}
              </CardTitle>
              <CardDescription className="text-saffron-600">
                {session.user.email}
              </CardDescription>
              <div className="mt-2">
                {getRoleBadge(session.user.role || "PARTICIPANT")}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Детали профиля */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-saffron-700 font-medium flex items-center">
                <User className="w-4 h-4 mr-2" />
                Имя
              </Label>
              {isEditing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="border-saffron-200 focus:border-saffron-400"
                />
              ) : (
                <p className="text-saffron-800">{session.user.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-saffron-700 font-medium flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Label>
              <p className="text-saffron-800">{session.user.email}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-saffron-700 font-medium flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Город
              </Label>
              {isEditing ? (
                <Input
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="border-saffron-200 focus:border-saffron-400"
                />
              ) : (
                <p className="text-saffron-800">{session.user.city || "Не указан"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-saffron-700 font-medium flex items-center">
                <Globe className="w-4 h-4 mr-2" />
                Язык
              </Label>
              {isEditing ? (
                <Select value={formData.language} onValueChange={(value) => handleInputChange("language", value)}>
                  <SelectTrigger className="border-saffron-200 focus:border-saffron-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem key={language.value} value={language.value}>
                        {language.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-saffron-800">
                  {languages.find(l => l.value === session.user.language)?.label || "Русский"}
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-saffron-700 font-medium flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Часовой пояс
              </Label>
              {isEditing ? (
                <Select value={formData.timezone} onValueChange={(value) => handleInputChange("timezone", value)}>
                  <SelectTrigger className="border-saffron-200 focus:border-saffron-400">
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
              ) : (
                <p className="text-saffron-800">
                  {timezones.find(t => t.value === session.user.timezone)?.label || "Не указан"}
                </p>
              )}
            </div>
          </div>

          <Separator className="bg-saffron-200" />

          {/* Кнопки управления */}
          <div className="flex flex-col sm:flex-row gap-3">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-saffron-500 to-lotus-pink-500 hover:from-saffron-600 hover:to-lotus-pink-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Сохранение..." : "Сохранить"}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1 border-saffron-200 text-saffron-700 hover:bg-saffron-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Отмена
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="flex-1 border-saffron-200 text-saffron-700 hover:bg-saffron-50"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Редактировать
                </Button>
                <Button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  variant="outline"
                  className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Выйти
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Дополнительная информация */}
      <Card className="bg-white/80 backdrop-blur-sm border-saffron-200">
        <CardHeader>
          <CardTitle className="text-saffron-800 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Дополнительная информация
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-saffron-600">Дата регистрации:</p>
              <p className="text-saffron-800">
                {session.user.createdAt ? new Date(session.user.createdAt).toLocaleDateString('ru-RU') : "Не указана"}
              </p>
            </div>
            <div>
              <p className="text-saffron-600">Последний вход:</p>
              <p className="text-saffron-800">
                {session.user.lastLoginAt ? new Date(session.user.lastLoginAt).toLocaleDateString('ru-RU') : "Не указан"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
