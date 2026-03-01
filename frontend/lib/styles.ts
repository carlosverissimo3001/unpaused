/** Shared frosted-glass card style used across game UI components. */
export const GLASS_STYLE = {
  background: 'rgba(18, 18, 18, 0.5)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)' as const,
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow:
    '0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.3), 0 0 24px rgba(29,185,84,0.04), inset 0 1px 0 rgba(255,255,255,0.03)',
} as const;
