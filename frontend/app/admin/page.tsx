import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth-server';
import { AdminDashboard } from './AdminDashboard';

export default async function AdminPage() {
  const user = await getServerUser();

  if (!user?.isAdmin) {
    redirect('/');
  }

  return (
    <main className="min-h-screen p-4 md:p-6">
      <AdminDashboard />
    </main>
  );
}
