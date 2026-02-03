"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function GatePage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(false);
    setPending(true);

    const res = await fetch("/api/auth/gate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setPending(false);

    if (res.status === 401) {
      setError(true);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-spotify-black text-white p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-spotify-black via-[#0d1117] to-[#161b22]" />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-xl"
        style={{ boxShadow: "0 0 40px rgba(0,0,0,0.3)" }}
      >
        <h1 className="text-xl font-semibold text-center mb-6">Enter password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            placeholder="Password"
            className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-spotify-green"
            autoFocus
            autoComplete="current-password"
            disabled={pending}
          />
          {error && <p className="text-sm text-red-400">Incorrect Password</p>}
          <Button type="submit" variant="spotify" className="w-full" disabled={pending}>
            {pending ? "Checking…" : "Unlock"}
          </Button>
        </form>
      </div>
    </main>
  );
}
