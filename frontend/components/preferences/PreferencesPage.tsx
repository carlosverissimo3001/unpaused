'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useMe } from '@/hooks/auth/useMe';
import { useUserPreferences } from '@/hooks/user-preferences/useUserPreferences';
import { useUpdateUserPreferences } from '@/hooks/user-preferences/useUpdateUserPreferences';
import { GLASS_STYLE } from '@/lib/styles';
import type { UserPreferenceDto } from '@/sdk';
import { AvatarSection } from './AvatarSection';
import { DailyPlaylistSection } from './DailyPlaylistSection';

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-fg">{label}</p>
        <p className="text-xs text-fg/50 mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
          checked ? 'bg-[#1DB954]' : 'bg-fg/20'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export function PreferencesPage() {
  const { data: user } = useMe();
  const { data: preferences } = useUserPreferences();
  const { mutate: updatePreferences } = useUpdateUserPreferences();
  const { theme, setTheme } = useTheme();

  const prefs: UserPreferenceDto = preferences ?? {
    showAlbumHint: true,
    showTextHints: true,
    reducedMotion: false,
    showGuessHistory: true,
    dailyChallengePlaylists: [],
    timezone: 'UTC',
  };

  function handleToggle(key: keyof UserPreferenceDto, value: boolean) {
    updatePreferences({ [key]: value });
  }

  function handlePlaylistToggle(playlistId: string) {
    const current = prefs.dailyChallengePlaylists;
    const isSelected = current.includes(playlistId);

    // Enforce at least one selection once the user has configured something
    if (isSelected && current.length <= 1) return;

    const next = isSelected
      ? current.filter((id) => id !== playlistId)
      : [...current, playlistId];

    updatePreferences({ dailyChallengePlaylists: next });
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] p-4 sm:p-8 max-w-lg mx-auto"
      style={{ background: 'rgb(var(--bg))' }}
    >
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(29,185,84,0.08) 0%, transparent 60%)',
        }}
        aria-hidden
      />

      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-fg/40 hover:text-fg transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div className="rounded-2xl overflow-hidden" style={GLASS_STYLE}>
        {/* User header */}
        <div className="p-6 border-b border-fg/10 flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-fg/5 border border-fg/10 shrink-0">
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.displayName ?? ''}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg font-black text-fg">
                {user?.displayName?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-base font-black text-fg leading-tight">
              {user?.displayName ?? '—'}
            </p>
            <p className="text-xs font-bold text-[#1DB954] uppercase tracking-wider opacity-80 mt-0.5">
              {user?.isTrusted ? 'Pro Member' : 'Player'}
            </p>
          </div>
        </div>

        {/* Avatar */}
        <div className="px-6 border-b border-fg/10">
          <AvatarSection />
        </div>

        {/* Preferences */}
        <div className="px-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fg/30 pt-4 pb-1">
            Gameplay
          </p>

          <DailyPlaylistSection
            selected={prefs.dailyChallengePlaylists}
            onToggle={handlePlaylistToggle}
            onReconcile={(validIds) =>
              updatePreferences({ dailyChallengePlaylists: validIds })
            }
          />
          <ToggleRow
            label="Show guess history"
            description="Display your previous guesses during a game"
            checked={prefs.showGuessHistory}
            onChange={(value) => handleToggle('showGuessHistory', value)}
          />

          <div className="-mx-6 border-t border-fg/10" />

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fg/30 pt-4 pb-1">
            Hints
          </p>

          <ToggleRow
            label="Album art hint"
            description="Show a progressively revealed album cover during gameplay"
            checked={prefs.showAlbumHint}
            onChange={(value) => handleToggle('showAlbumHint', value)}
          />

          <ToggleRow
            label="Text hints"
            description="Show genre, decade, and other clues as rounds progress"
            checked={prefs.showTextHints}
            onChange={(value) => handleToggle('showTextHints', value)}
          />

          <div className="-mx-6 border-t border-fg/10" />

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fg/30 pt-4 pb-1">
            Accessibility
          </p>

          <ToggleRow
            label="Reduced motion"
            description="Disable background pulse and shake animations"
            checked={prefs.reducedMotion}
            onChange={(value) => handleToggle('reducedMotion', value)}
          />

          <div className="-mx-6 border-t border-fg/10" />

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fg/30 pt-4 pb-1">
            Appearance
          </p>

          <ToggleRow
            label="Light mode"
            description="Switch to a light colour scheme"
            checked={theme === 'light'}
            onChange={(value) => setTheme(value ? 'light' : 'dark')}
          />

          <div className="pb-2" />
        </div>
      </div>
    </div>
  );
}
