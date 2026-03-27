'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useMe } from '@/hooks/auth/useMe';
import { useUploadAvatar } from '@/hooks/user-avatar/useUploadAvatar';
import { useUpdateAvatarSource } from '@/hooks/user-avatar/useUpdateAvatarSource';
import { AuthMeResponseDtoAvatarSourceEnum as AvatarSource } from '../../sdk';

export function AvatarSection() {
  const { data: user } = useMe();
  const { mutate: uploadAvatar, isPending: isUploading } = useUploadAvatar();
  const { mutate: updateSource, isPending: isSwitching } =
    useUpdateAvatarSource();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const avatarSource = user?.avatarSource ?? AvatarSource.Spotify;
  const initials = user?.displayName?.[0]?.toUpperCase();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    uploadAvatar(file, { onError: (err) => setUploadError(err.message) });
    e.target.value = '';
  }

  function handleSelectSource(source: AvatarSource) {
    if (source === avatarSource || isUploading || isSwitching) return;
    updateSource(source);
  }

  const spotifyActive = avatarSource === AvatarSource.Spotify;
  const customActive = avatarSource === AvatarSource.Custom;

  return (
    <div className="py-5">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fg/30 pb-4">
        Profile photo
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* ── Spotify card ── */}
        <button
          onClick={() => handleSelectSource(AvatarSource.Spotify)}
          disabled={isUploading || isSwitching}
          className={`group relative flex flex-col items-center gap-3 py-5 px-3 rounded-2xl border transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none ${
            spotifyActive
              ? 'border-[#1DB954]/40 bg-[#1DB954]/[0.07]'
              : 'border-fg/[0.08] bg-fg/[0.03] hover:border-fg/20'
          }`}
        >
          <div
            className={`relative w-[72px] h-[72px] rounded-full overflow-hidden transition-all duration-200 ${
              spotifyActive
                ? 'ring-2 ring-[#1DB954] ring-offset-2 ring-offset-bg'
                : 'ring-1 ring-fg/10'
            }`}
          >
            {user?.spotifyAvatarUrl ? (
              <Image
                src={user.spotifyAvatarUrl}
                alt="Spotify avatar"
                fill
                className="object-cover"
                sizes="72px"
              />
            ) : (
              <div className="w-full h-full bg-fg/10 flex items-center justify-center text-xl font-black text-fg/40">
                {initials}
              </div>
            )}
            {isSwitching && !spotifyActive && (
              <div className="absolute inset-0 bg-bg/70 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-[#1DB954] animate-spin" />
              </div>
            )}
          </div>

          <span
            className={`text-[11px] font-black uppercase tracking-[0.15em] transition-colors ${
              spotifyActive ? 'text-[#1DB954]' : 'text-fg/35'
            }`}
          >
            Spotify
          </span>

          {spotifyActive && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#1DB954]" />
          )}
        </button>

        {/* ── Custom card ── */}
        <div
          className={`relative flex flex-col items-center gap-3 py-5 px-3 rounded-2xl border transition-all duration-200 ${
            customActive
              ? 'border-[#1DB954]/40 bg-[#1DB954]/[0.07]'
              : 'border-fg/[0.08] bg-fg/[0.03]'
          }`}
        >
          {/* Avatar + camera badge */}
          <div className="relative">
            <button
              onClick={() => {
                if (user?.customAvatarUrl)
                  handleSelectSource(AvatarSource.Custom);
                else fileInputRef.current?.click();
              }}
              disabled={isUploading || isSwitching}
              className={`relative w-[72px] h-[72px] rounded-full overflow-hidden transition-all duration-200 active:scale-95 disabled:pointer-events-none ${
                customActive
                  ? 'ring-2 ring-[#1DB954] ring-offset-2 ring-offset-bg'
                  : 'ring-1 ring-fg/10'
              }`}
            >
              {user?.customAvatarUrl ? (
                <Image
                  src={user.customAvatarUrl}
                  alt="Custom avatar"
                  fill
                  className="object-cover"
                  sizes="72px"
                />
              ) : (
                <div className="w-full h-full bg-fg/10 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-fg/25" />
                </div>
              )}
              {(isUploading || (isSwitching && !customActive)) && (
                <div className="absolute inset-0 bg-bg/70 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-[#1DB954] animate-spin" />
                </div>
              )}
            </button>

            {/* Camera badge — only shown when a photo already exists */}
            {user?.customAvatarUrl && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isSwitching}
                title="Change photo"
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#1DB954] hover:bg-[#1ed760] flex items-center justify-center shadow-lg transition-colors active:scale-90 disabled:opacity-50"
              >
                <Camera className="w-4 h-4 text-black" />
              </button>
            )}
          </div>

          <span
            className={`text-[11px] font-black uppercase tracking-[0.15em] transition-colors ${
              customActive ? 'text-[#1DB954]' : 'text-fg/35'
            }`}
          >
            {user?.customAvatarUrl ? 'Custom' : 'Upload'}
          </span>

          {customActive && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#1DB954]" />
          )}
        </div>
      </div>

      {uploadError && (
        <p className="mt-3 text-xs text-red-400 font-medium">{uploadError}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
