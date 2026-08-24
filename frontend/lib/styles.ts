/** Shared frosted-glass card style used across game UI components. */
export const GLASS_STYLE = {
  background: 'rgb(var(--surface) / 0.5)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)' as const,
  border: '1px solid rgb(var(--fg) / 0.1)',
} as const;
