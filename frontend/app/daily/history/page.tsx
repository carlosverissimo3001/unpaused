"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DailyHistoryRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/history");
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green" />
    </div>
  );
}
