import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminDashboard } from "./AdminDashboard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
    cache: "no-store",
  });

  if (!res.ok) {
    redirect("/");
  }

  const user = await res.json();
  if (!user?.isAdmin) {
    redirect("/");
  }

  return (
    <main className="min-h-screen p-4 md:p-6">
      <AdminDashboard />
    </main>
  );
}
