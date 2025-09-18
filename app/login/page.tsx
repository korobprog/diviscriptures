"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Mail, Lock, Flower } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Неверный email или пароль");
      } else {
        // Проверяем роль пользователя и перенаправляем
        const session = await getSession();
        if (session?.user?.role === "SUPER_ADMIN") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      }
    } catch (error) {
      setError("Произошла ошибка при входе");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50 flex items-center justify-center p-4">
      {/* Декоративные элементы */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-lotus-pink/10 rounded-full animate-float"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-saffron-200/20 rounded-full animate-float-delayed"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-gold-200/15 rounded-full animate-sacred-pulse"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 bg-white/80 backdrop-blur-sm border-saffron-200 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-saffron-400 to-lotus-pink-400 rounded-full flex items-center justify-center">
            <Flower className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-saffron-800">
              Добро пожаловать
            </CardTitle>
            <CardDescription className="text-saffron-600">
              Войдите в священное пространство изучения
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  className="pl-10 border-saffron-200 focus:border-saffron-400 focus:ring-saffron-400"
                  required
                />
              </div>
            </div>

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
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
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

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-saffron-500 to-lotus-pink-500 hover:from-saffron-600 hover:to-lotus-pink-600 text-white font-medium py-2.5"
              disabled={isLoading}
            >
              {isLoading ? "Вход..." : "Войти"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-saffron-600">
              Нет аккаунта?{" "}
              <a
                href="/register"
                className="font-medium text-saffron-700 hover:text-saffron-800 underline"
              >
                Зарегистрироваться
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
