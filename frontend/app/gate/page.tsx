"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react"; 

export default function GatePage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
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

    
    if (res.status === 401) {
      setPending(false);
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
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Password"
              className="w-full rounded-lg border border-white/20 bg-white/10 pl-4 pr-12 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-spotify-green"
              autoFocus
              autoComplete="current-password"
              disabled={pending}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          
          {error && <p className="text-sm text-red-400">Incorrect Password</p>}
          <Button type="submit" variant="spotify" className="w-full" disabled={pending}>
            {pending ? "Checking…" : "Unlock"}
          </Button>
        </form>
      </div>
    </main>
  );
}