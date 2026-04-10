/**
 * Shared mutable state for the hero decay interaction.
 * Written by hero-name, read by forest-reveal.
 *
 * Using a plain object (not a React state) because this updates on every
 * RAF tick and we don't want to trigger React re-renders. The consumers
 * read it directly inside their own RAF loops.
 */
export const decayState = {
  level: 0, // 0..6 (MAX_DECAY)
};

export const MAX_DECAY = 6;
