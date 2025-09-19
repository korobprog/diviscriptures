"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Settings, 
  LogOut, 
  Crown, 
  Users,
  BookOpen
} from "lucide-react";
import Link from "next/link";

export default function Navigation() {
  const { data: session } = useSession();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return <Badge variant="destructive" className="bg-red-500 text-white text-sm px-3 py-1 font-semibold shadow-md"><Crown className="w-4 h-4 mr-1" />Супер-админ</Badge>;
      case "ADMIN":
        return <Badge variant="default" className="bg-saffron-500 text-white text-sm px-3 py-1 font-semibold shadow-md"><Users className="w-4 h-4 mr-1" />Админ</Badge>;
      default:
        return <Badge variant="secondary" className="text-sm px-3 py-1 font-medium">Участник</Badge>;
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-saffron-200 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Логотип */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-saffron-400 to-lotus-pink-400 rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-saffron-800">
              Divine Scriptures
            </span>
          </Link>

          {/* Навигационные ссылки */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="/" 
              className="text-saffron-800 hover:text-saffron-900 font-semibold transition-colors text-base"
            >
              Главная
            </Link>
            <Link 
              href="/groups" 
              className="text-saffron-800 hover:text-saffron-900 font-semibold transition-colors text-base"
            >
              Группы
            </Link>
            {session?.user?.role === "SUPER_ADMIN" && (
              <>
                <Link 
                  href="/admin" 
                  className="text-saffron-800 hover:text-saffron-900 font-semibold transition-colors text-base"
                >
                  Админ панель
                </Link>
                <Link 
                  href="/admin/parser" 
                  className="text-saffron-800 hover:text-saffron-900 font-semibold transition-colors text-base"
                >
                  Парсер
                </Link>
              </>
            )}
          </div>

          {/* Пользовательское меню */}
          <div className="flex items-center space-x-4">
            {session?.user ? (
              <div className="flex items-center space-x-3">
                {getRoleBadge(session.user.role || "PARTICIPANT")}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-12 w-12 rounded-full hover:bg-saffron-50 transition-colors">
                      <Avatar className="h-12 w-12 border-2 border-saffron-200">
                        <AvatarImage src={session.user.image || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-saffron-500 to-lotus-pink-500 text-white font-semibold text-lg">
                          {getInitials(session.user.name || "U")}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium leading-none">
                        {session.user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Профиль</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Настройки</span>
                      </Link>
                    </DropdownMenuItem>
                    {session.user.role === "SUPER_ADMIN" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Crown className="mr-2 h-4 w-4" />
                          <span>Админ панель</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer text-red-600 focus:text-red-600"
                      onSelect={() => signOut({ callbackUrl: "/" })}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Выйти</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">
                    Войти
                  </Link>
                </Button>
                <Button asChild size="sm" className="bg-gradient-to-r from-saffron-500 to-lotus-pink-500 hover:from-saffron-600 hover:to-lotus-pink-600">
                  <Link href="/register">
                    Регистрация
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
