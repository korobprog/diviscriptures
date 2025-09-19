"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

interface CreateGroupData {
  name: string;
  city: string;
  country: string;
  language: string;
  description: string;
  readingTime: string;
  maxParticipants: number;
}

const languages = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "it", label: "Italiano" },
  { value: "pt", label: "Português" },
  { value: "hi", label: "हिन्दी" },
  { value: "sa", label: "संस्कृतम्" },
];

const countries = [
  { value: "Россия", label: "Россия" },
  { value: "USA", label: "США" },
  { value: "UK", label: "Великобритания" },
  { value: "Germany", label: "Германия" },
  { value: "France", label: "Франция" },
  { value: "Spain", label: "Испания" },
  { value: "Italy", label: "Италия" },
  { value: "India", label: "Индия" },
  { value: "Brazil", label: "Бразилия" },
  { value: "Canada", label: "Канада" },
];

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }: CreateGroupModalProps) {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState<CreateGroupData>({
    name: "",
    city: "",
    country: "",
    language: "ru",
    description: "",
    readingTime: "",
    maxParticipants: 10,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateGroupData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateGroupData, string>> = {};

    console.log("Валидация формы с данными:", formData);

    if (!formData.name.trim()) {
      newErrors.name = "Название группы обязательно";
    }

    if (!formData.city.trim()) {
      newErrors.city = "Город обязателен";
    }

    if (!formData.country.trim()) {
      newErrors.country = "Страна обязательна";
    }

    if (!formData.language.trim()) {
      newErrors.language = "Язык обязателен";
    }

    if (!formData.readingTime.trim()) {
      newErrors.readingTime = "Время для чтения обязательно";
    }

    const numParticipants = typeof formData.maxParticipants === 'string' 
      ? parseInt(formData.maxParticipants) 
      : formData.maxParticipants;
    
    if (isNaN(numParticipants) || numParticipants < 1 || numParticipants > 50) {
      newErrors.maxParticipants = "Максимальное количество участников должно быть от 1 до 50";
    }

    console.log("Ошибки валидации:", newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Проверяем статус загрузки
    if (status === 'loading') {
      setErrors({ name: "Загрузка данных пользователя..." });
      return;
    }

    // Проверяем аутентификацию
    if (!session) {
      setErrors({ name: "Необходимо войти в систему для создания группы" });
      return;
    }

    // Проверяем роль пользователя
    if (session.user.role === 'LISTENER') {
      setErrors({ name: "Слушатели не могут создавать группы" });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const requestData = {
        ...formData,
        maxParticipants: formData.maxParticipants,
      };
      
      console.log("Отправляемые данные:", requestData);
      
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        if (errorData.details) {
          console.error("Validation details:", errorData.details);
        }
        throw new Error(errorData.error || "Ошибка при создании группы");
      }

      const result = await response.json();
      console.log("Запрос на создание группы отправлен:", result);
      
      // Сброс формы
      setFormData({
        name: "",
        city: "",
        country: "",
        language: "ru",
        description: "",
        readingTime: "",
        maxParticipants: 10,
      });
      
      // Показываем сообщение об успехе
      alert(result.message || "Запрос на создание группы отправлен на рассмотрение супер-администратору.");
      
      onGroupCreated();
      onClose();
    } catch (error) {
      console.error("Ошибка создания группы:", error);
      setErrors({ name: error instanceof Error ? error.message : "Неизвестная ошибка" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateGroupData, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: field === 'maxParticipants' ? parseInt(value) || 10 : value 
    }));
    // Очищаем ошибку для этого поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        name: "",
        city: "",
        country: "",
        language: "ru",
        description: "",
        readingTime: "",
        maxParticipants: 10,
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-sm border-saffron-200">
        <DialogHeader>
          <DialogTitle className="text-saffron-800 text-xl">
            Создать новую группу
          </DialogTitle>
          <DialogDescription className="text-saffron-600">
            Заполните информацию о вашей духовной группе для совместного изучения священных писаний
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-saffron-700 font-medium">
              Название группы *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Например: Московские преданные"
              className="border-saffron-200 focus:border-saffron-400"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-saffron-700 font-medium">
                Город *
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="Москва"
                className="border-saffron-200 focus:border-saffron-400"
                disabled={isLoading}
              />
              {errors.city && (
                <p className="text-red-500 text-sm">{errors.city}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-saffron-700 font-medium">
                Страна *
              </Label>
              <Select
                value={formData.country}
                onValueChange={(value) => handleInputChange("country", value)}
                disabled={isLoading}
              >
                <SelectTrigger className="border-saffron-200 focus:border-saffron-400">
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
              {errors.country && (
                <p className="text-red-500 text-sm">{errors.country}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language" className="text-saffron-700 font-medium">
              Язык группы *
            </Label>
            <Select
              value={formData.language}
              onValueChange={(value) => handleInputChange("language", value)}
              disabled={isLoading}
            >
              <SelectTrigger className="border-saffron-200 focus:border-saffron-400">
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
            {errors.language && (
              <p className="text-red-500 text-sm">{errors.language}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-saffron-700 font-medium">
              Описание группы
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Опишите цели и особенности вашей группы..."
              className="border-saffron-200 focus:border-saffron-400 min-h-[80px]"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="readingTime" className="text-saffron-700 font-medium">
                Время для чтения *
              </Label>
              <Input
                id="readingTime"
                type="time"
                value={formData.readingTime}
                onChange={(e) => handleInputChange("readingTime", e.target.value)}
                className="border-saffron-200 focus:border-saffron-400"
                disabled={isLoading}
              />
              {errors.readingTime && (
                <p className="text-red-500 text-sm">{errors.readingTime}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxParticipants" className="text-saffron-700 font-medium">
                Макс. участников *
              </Label>
              <Input
                id="maxParticipants"
                type="number"
                min="1"
                max="50"
                value={formData.maxParticipants}
                onChange={(e) => handleInputChange("maxParticipants", e.target.value)}
                className="border-saffron-200 focus:border-saffron-400"
                disabled={isLoading}
              />
              {errors.maxParticipants && (
                <p className="text-red-500 text-sm">{errors.maxParticipants}</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-saffron-200 text-saffron-700"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-saffron-500 to-lotus-pink-500 hover:from-saffron-600 hover:to-lotus-pink-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Создание...
                </>
              ) : (
                "Создать группу"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
