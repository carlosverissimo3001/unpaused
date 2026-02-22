'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StreakQuestionsAdmin } from '@/components/admin/StreakQuestionsAdmin';
import { UsersAdmin } from '@/components/admin/UsersAdmin';

export function AdminDashboard() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 relative flex items-center justify-center">
        <Link
          href="/"
          className="text-white/70 hover:text-white flex items-center gap-2 text-sm absolute left-0"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-xl font-semibold text-white">Admin Area</h1>
      </div>

      {/* Users Management */}
      <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
        <UsersAdmin />
      </div>

      {/* Streak Quiz Questions */}
      <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
        <StreakQuestionsAdmin />
      </div>
    </div>
  );
}
