/** Shared frosted-glass card style used across game UI components. */
export const GLASS_STYLE = {
  background: 'rgb(var(--surface) / 0.5)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)' as const,
  border: '1px solid rgb(var(--fg) / 0.1)',
} as const;

/**
 * The same card over a flat background. Blurring a uniform colour gives that
 * colour back, so the filter there costs a compositing pass on every paint and
 * changes nothing on screen — use this wherever nothing sits behind the card.
 */
export const SOLID_SURFACE_STYLE = {
  background: GLASS_STYLE.background,
  border: GLASS_STYLE.border,
} as const;
