/** Cards fade in on a stagger and never move. */
export const cardVariants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { delay: i * 0.04, duration: 0.3, ease: 'easeOut' as const },
  }),
};
