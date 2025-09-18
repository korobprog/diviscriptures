import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ParserMonitor from '@/components/admin/ParserMonitor';

export default async function ParserAdminPage() {
  const session = await getServerSession(authOptions);

  // Check authentication and admin role
  if (!session?.user) {
    redirect('/auth/signin');
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-6">
      <ParserMonitor />
    </div>
  );
}
