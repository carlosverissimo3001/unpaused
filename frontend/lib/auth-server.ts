import { cookies } from 'next/headers';
import type { AuthMeResponseDto } from '@/sdk';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function getServerUser(): Promise<AuthMeResponseDto | null> {
  try {
    const cookieStore = await cookies();
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Cookie: cookieStore.toString() },
      cache: 'no-store',
    });
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as AuthMeResponseDto;
  } catch {
    return null;
  }
}
