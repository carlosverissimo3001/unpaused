'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useGameShare } from '@/hooks/game/useGameShare';

interface ShareButtonProps {
  gameId: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'spotify';
}

export function ShareButton({
  gameId,
  className = '',
  variant = 'outline',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const shareMutation = useGameShare();

  const handleShare = async () => {
    try {
      const result = await shareMutation.mutateAsync(gameId);
      if (result?.shareText) {
        await navigator.clipboard.writeText(result.shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      toast.error('Failed to copy share text');
    }
  };

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleShare}
      disabled={shareMutation.isPending}
      className={className}
      aria-label={copied ? 'Copied!' : 'Copy share text'}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          Copied!
        </>
      ) : shareMutation.isPending ? (
        'Copying...'
      ) : (
        <>
          <Share2 className="w-4 h-4 mr-2" />
          Share Result
        </>
      )}
    </Button>
  );
}
