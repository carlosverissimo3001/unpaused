import { GameStatsDtoModeEnum as GameMode } from '@/sdk';

export type HistoryTab = 'all' | 'daily' | 'gauntlet';

export interface ModeDescriptor {
  readonly tab: HistoryTab;
  readonly label: string;
  /** The stats row this tab reads, or null where the mode keeps its own. */
  readonly statsMode: GameMode | null;
  /** Narrows the history query; undefined means every mode. */
  readonly historyMode: GameMode | undefined;
  readonly trustedOnly?: boolean;
  /** The accent this tab carries through its tab pill and its hero number. */
  readonly accent: {
    readonly text: string;
    readonly pill: string;
    readonly bar: string;
  };
  /** Shown in the stats panel before there is anything to count. */
  readonly emptyStats: string;
  readonly empty: {
    readonly message: string;
    readonly href: string;
    readonly cta: string;
  };
}

/**
 * One entry per tab, and the only place a mode is described.
 *
 * The page used to decide everything through a chain of `isGauntlet ? … : …`
 * ternaries, which meant a new mode touched six unrelated lines and the
 * layout changed shape depending on which tab you were on. Adding a mode is
 * adding a row here.
 */
export const MODES: Record<HistoryTab, ModeDescriptor> = {
  all: {
    tab: 'all',
    label: 'All',
    statsMode: GameMode.All,
    historyMode: undefined,
    accent: {
      text: 'text-fg',
      pill: 'bg-fg/15 text-fg shadow-sm',
      bar: 'bg-fg/60',
    },
    emptyStats:
      'Play a round and your win run, totals and guess spread land here.',
    empty: {
      message: 'No games yet.',
      href: '/',
      cta: 'Play a round',
    },
  },
  daily: {
    tab: 'daily',
    label: 'Daily',
    statsMode: GameMode.Daily,
    historyMode: GameMode.Daily,
    accent: {
      text: 'text-spotify-green',
      pill: 'bg-spotify-green/30 text-spotify-green shadow-sm',
      bar: 'bg-spotify-green',
    },
    emptyStats: 'Win a daily and your streak starts here.',
    empty: {
      message: 'No dailies yet.',
      href: '/daily',
      cta: "Play today's daily",
    },
  },
  gauntlet: {
    tab: 'gauntlet',
    label: 'Speed Run',
    // Speed runs are scored per run in their own table, not tallied per game.
    statsMode: null,
    historyMode: undefined,
    trustedOnly: true,
    accent: {
      text: 'text-amber-400',
      pill: 'bg-amber-500/20 text-amber-400 shadow-sm',
      bar: 'bg-amber-400',
    },
    emptyStats: 'Finish a speed run and your best score lands here.',
    empty: {
      message: 'No speed runs yet.',
      href: '/speed-run',
      cta: 'Start a speed run',
    },
  },
};

export const isHistoryTab = (value: string | null): value is HistoryTab =>
  value === 'all' || value === 'daily' || value === 'gauntlet';

export function visibleModes(isTrusted: boolean): ModeDescriptor[] {
  return Object.values(MODES).filter((mode) => !mode.trustedOnly || isTrusted);
}
