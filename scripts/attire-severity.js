// attire-severity.js

/**
 * Defines the exposure severity for each body region,
 * and the Lust gain amounts tied to different exposure levels.
 * 
 * Used by attire-system.js, lust-threshold.js, and perception-engine.js.
 */

import { BODY_REGIONS } from "./attire-bodymap.js";

/**
 * Exposure severity tiers.
 * minor < moderate < severe
 */
export const EXPOSURE_SEVERITY = {
  [BODY_REGIONS.CHEST.id]: "minor",
  [BODY_REGIONS.GROIN.id]: "severe",
  [BODY_REGIONS.ASS.id]: "moderate",
  [BODY_REGIONS.BELLY.id]: "minor",
  [BODY_REGIONS.THIGHS.id]: "moderate" // ✅ New region added
};

/**
 * Lust gain values associated with each severity tier.
 */
export const EXPOSURE_VALUES = {
  minor: 5,      // +5 Lust max threshold bonus
  moderate: 10,  // +10 Lust max threshold bonus
  severe: 20     // +20 Lust max threshold bonus
};
