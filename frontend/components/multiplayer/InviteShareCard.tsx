'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface InviteShareCardProps {
  inviteCode: string;
}

export function InviteShareCard({ inviteCode }: InviteShareCardProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/multiplayer/join/${inviteCode}`
      : '';

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-white/60 uppercase tracking-wider">
        Invite Code
      </p>
      <p className="text-3xl font-mono font-bold text-spotify-green tracking-[0.3em]">
        {inviteCode}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
        >
          {copied ? (
            <Check className="h-4 w-4 text-spotify-green" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  );
}
