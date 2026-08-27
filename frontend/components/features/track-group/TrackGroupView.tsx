'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { TrackGroupCard } from '@/components/track-group/TrackGroupCard';
import { PlaylistSkeleton } from '@/components/playlist/PlaylistSkeleton';
import { useTrackGroups } from '@/hooks/track-groups/useTrackGroups';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';

const TITLE = 'Curated playlists';

/**
 * Everyone sees this, library or not. A linked player gets it under their own
 * playlists; an unlinked one gets it instead of an empty page.
 *
 * There is one axis today, so no tabs: a control with nothing to switch
 * between is worse than no control. `type` is already in the API, so the strip
 * goes above this grid when genres land.
 */
function TrackGroupViewComponent({ defaultOpen }: { defaultOpen: boolean }) {
  const { data: groups, isPending, isError } = useTrackGroups();

  // Nothing is rendered from a guess while this loads: a grid that fills with
  // defaults and then rearranges is worse than one that arrives late.
  if (isPending) {
    return (
      <CollapsibleSection
        title={TITLE}
        titleLabel={TITLE}
        defaultOpen={defaultOpen}
      >
        <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <PlaylistSkeleton key={`group-skeleton-${i}`} />
          ))}
        </div>
      </CollapsibleSection>
    );
  }

  // Empty groups are filtered out server side, so nothing at all means the
  // pool is unseeded rather than that this player has none.
  if (isError || !groups || groups.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection
      title={TITLE}
      titleLabel={TITLE}
      defaultOpen={defaultOpen}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 sm:gap-6 justify-center"
        style={{ maxWidth: '1200px', margin: '0 auto' }}
      >
        {groups.map((group) => (
          <TrackGroupCard key={group.id} group={group} />
        ))}
      </motion.div>
    </CollapsibleSection>
  );
}

export const TrackGroupView = memo(TrackGroupViewComponent);
