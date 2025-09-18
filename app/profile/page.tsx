import UserProfile from "@/app/components/UserProfile";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50 p-4">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-saffron-800 mb-2">
            Мой профиль
          </h1>
          <p className="text-saffron-600">
            Управляйте своими данными и настройками
          </p>
        </div>
        <UserProfile />
      </div>
    </div>
  );
}
