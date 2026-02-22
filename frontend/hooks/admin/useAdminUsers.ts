'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { AdminUserDto } from '@/sdk';

export function useAdminUsers() {
  return useQuery<AdminUserDto[]>({
    queryKey: queryKeys.admin.users,
    queryFn: () => api.adminControllerListUsers(),
  });
}
