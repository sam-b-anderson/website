/**
 * Shared mutable state for the hero decay + forest growth interaction.
 *
 * Phases (managed by hero-name):
 * 1. idle              — nothing happening
 * 2. scrubbing         — cursor on hero, decayLevel rising toward MAX
 * 3. growing           — decayLevel hit MAX, forest grows on its own clock
 * 4. growing-cooldown  — cursor left during growth phase, 3s grace period
 * 5. receding          — cooldown ended, forest retreats + hero recovers
 *
 * Returning the cursor to the hero during phase 4 cancels the cooldown
 * and resumes growth.
 */
export const decayState = {
  /** Hero text decay level: 0 (clean) to 6 (Redaction 100). */
  level: 0,
  /** Forest growth progress: 0 (invisible) to 1 (fully grown). */
  forestProgress: 0,
  /** True during growth phase (including the cooldown grace period). */
  isGrowing: false,
};

export const MAX_DECAY = 6;
