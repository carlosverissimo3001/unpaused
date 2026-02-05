import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminDashboard } from "./AdminDashboard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default async function AdminPage() {
  let user = null;

  try {
    const cookieStore = await cookies();
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Cookie: cookieStore.toString() },
      cache: "no-store",
    });

    if (res.ok) {
      user = await res.json();
    }
  } catch (error) {
    console.error("Authentication check failed:", error);
  }

  if (!user || !user.isAdmin) {
    redirect("/");
  }

  return (
    <main className="min-h-screen p-4 md:p-6">
      <AdminDashboard />
    </main>
  );
}