'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';
import type { UpdateUserRoleDto, AdminUserDto } from '@/sdk';

export function useAdminUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation<
    AdminUserDto,
    Error,
    { id: string; dto: UpdateUserRoleDto }
  >({
    mutationFn: async ({ id, dto }) => {
      try {
        return await api.adminControllerUpdateUserRole({
          id,
          updateUserRoleDto: dto,
        });
      } catch (e) {
        const message = await getApiErrorMessage(e);
        throw new Error(message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.users,
      });
    },
  });
}
