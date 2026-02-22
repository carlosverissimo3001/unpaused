'use client';

import Image from 'next/image';
import { Loader2, Users, Shield, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminUsers } from '@/hooks/admin/useAdminUsers';
import { useAdminUpdateUserRole } from '@/hooks/admin/useAdminUpdateUserRole';
import { useMe } from '@/hooks/auth/useMe';
import { Button } from '@/components/ui/button';
import type { AdminUserDto } from '@/sdk';

export function UsersAdmin() {
  const { data: users, isLoading, error } = useAdminUsers();
  const { data: me } = useMe();
  const updateRole = useAdminUpdateUserRole();

  const handleToggle = async (
    user: AdminUserDto,
    field: 'isTrusted' | 'isAdmin',
  ) => {
    try {
      await updateRole.mutateAsync({
        id: user.id,
        dto: { [field]: !user[field] },
      });
      toast.success(
        `${user.displayName} ${!user[field] ? 'granted' : 'revoked'} ${field === 'isAdmin' ? 'admin' : 'trusted'} role`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const isSelf = (user: AdminUserDto) =>
    me?.spotifyUserId === user.spotifyUserId;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-white">Users</h2>
        {users && (
          <span className="text-xs text-white/40">({users.length})</span>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-spotify-green animate-spin" />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3">
          Failed to load users.
        </div>
      )}

      {!isLoading && !error && users && (
        <div className="space-y-2">
          {users.length === 0 ? (
            <p className="text-center text-white/50 py-8">No users found.</p>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5"
              >
                {/* Avatar */}
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.displayName}
                    width={36}
                    height={36}
                    className="rounded-full shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/60 text-sm font-medium shrink-0">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.displayName}
                    {isSelf(user) && (
                      <span className="ml-1.5 text-xs text-white/40">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-white/40 truncate">
                    {user.spotifyUserId}
                  </p>
                </div>

                {/* Joined date */}
                <span className="text-xs text-white/30 shrink-0 hidden sm:block">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>

                {/* Role toggles */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(user, 'isTrusted')}
                    disabled={updateRole.isPending}
                    className={`text-xs gap-1 ${
                      user.isTrusted
                        ? 'text-green-400 hover:text-green-300'
                        : 'text-white/40 hover:text-white/60'
                    }`}
                    title={user.isTrusted ? 'Revoke trusted' : 'Grant trusted'}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Trusted
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(user, 'isAdmin')}
                    disabled={updateRole.isPending || isSelf(user)}
                    className={`text-xs gap-1 ${
                      user.isAdmin
                        ? 'text-amber-400 hover:text-amber-300'
                        : 'text-white/40 hover:text-white/60'
                    }`}
                    title={
                      isSelf(user)
                        ? 'Cannot change your own admin status'
                        : user.isAdmin
                          ? 'Revoke admin'
                          : 'Grant admin'
                    }
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
