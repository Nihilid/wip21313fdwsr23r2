// Exposure Configuration for Dungeons & Degenerates

// Exposure Tiers: Categorizing coverage values
export const EXPOSURE_TIERS = {
  EXPOSED: "exposed",  // Fully visible, no coverage
  PARTIAL: "partial",  // Partially covered, some exposure
  CONCEALED: "concealed",  // Mostly covered, minimal exposure
  COVERED: "covered",  // Fully covered, no exposure
};

// Exposure Thresholds: Values for each body part indicating when it's exposed
export const EXPOSURE_THRESHOLDS = {
  nipples: 0.3,  // Nipples exposed when over X% visible
  genitals: 0.1,  // Genitals exposed when over X% visible
  groin: 0.1,  // Groin exposed when over X% visible
  thighs: 0.1,  // Thighs exposed when over X% visible
  arms: 0.3,  // Arms exposed when over X% visible
  abdomen: 0.1  // Abdomen exposed when over X% visible
};

/**
 * Converts a numeric coverage value to a descriptive exposure tier.
 * 
 * @param {number} value - A float between 0 and 1 representing coverage.
 * @returns {string} One of: "exposed", "partial", "concealed", "covered"
 */
function getExposureTier(value) {
  if (value <= 0.1) return EXPOSURE_TIERS.EXPOSED;
  if (value <= 0.5) return EXPOSURE_TIERS.PARTIAL;
  if (value < 1.0) return EXPOSURE_TIERS.CONCEALED;
  return EXPOSURE_TIERS.COVERED;
}

/**
 * Checks if a body part has exceeded the exposure threshold.
 * 
 * @param {string} bodyPart - The body part to check (e.g., "genitals").
 * @param {number} exposureValue - The calculated exposure value for the body part.
 * @returns {boolean} True if the body part exceeds the exposure threshold, otherwise false.
 */
function exceedsExposureThreshold(bodyPart, exposureValue) {
  const threshold = EXPOSURE_THRESHOLDS[bodyPart];
  return threshold ? exposureValue > threshold : false;
}

export { getExposureTier, exceedsExposureThreshold };
