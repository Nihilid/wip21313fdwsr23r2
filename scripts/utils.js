// ==========================
// Dungeons & Degenerates - utils.js
// General utility functions
// ==========================

/**
 * Clamp a value between a minimum and maximum.
 * @param {number} value 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function clampValue(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Validate an actor for operations.
 * @param {Actor} actor 
 * @returns {boolean}
 */
export function validateActor(actor) {
  if (!actor) {
    console.warn("[D&Degenerates] ⚠️ validateActor: No actor provided.");
    return false;
  }
  if (!actor.isOwner) {
    console.warn(`[D&Degenerates] ⚠️ validateActor: Actor ${actor.name} is not owned by user.`);
    return false;
  }
  return true;
}

/**
 * Update a Bar Brawl stat bar on an actor's active token.
 * @param {Actor} actor 
 * @param {number} barId 
 * @param {number} value 
 */
export async function updateBar(actor, barId, value) {
  if (!validateActor(actor)) return;

  const token = actor.getActiveTokens(true, true)[0];
  if (!token) return;

  await token.update({ [`flags.barbrawl.resourceBars.bar${barId}.value`]: value });
}

/**
 * Fetch the current value of a Bar Brawl stat bar.
 * @param {Actor} actor 
 * @param {number} barId 
 * @returns {number|null}
 */
export function getBarValue(actor, barId) {
  const token = actor.getActiveTokens(true, true)[0];
  if (!token) return null;
  return getProperty(token, `flags.barbrawl.resourceBars.bar${barId}.value`) ?? null;
}

/**
 * Detect actor gender for orgasm handling.
 * Returns "male", "female", or "neutral".
 * @param {Actor} actor
 * @returns {string}
 */
export function detectGender(actor) {
  if (!actor) return "neutral";

  // PC (Character) gender lookup
  const pcGender = actor.system?.details?.gender?.value?.toLowerCase();
  if (pcGender) {
    if (pcGender.includes("female")) return "female";
    if (pcGender.includes("male")) return "male";
  }

  // NPC fallback: look at traits
  const traits = actor.system?.traits?.value || [];
  if (Array.isArray(traits)) {
    if (traits.includes("female")) return "female";
    if (traits.includes("male")) return "male";
  }

  // Default fallback for ambiguous NPCs
  return "male";
}

/**
 * Controlled debug logging based on module debugMode setting.
 * @param {string} message 
 * @param  {...any} args 
 */
export function logDebug(message, ...args) {
  try {
    if (game.settings.get("dungeons-and-degenerates-pf2e", "debugMode")) {
      console.log(`[D&Degenerates] ${message}`, ...args);
    }
  } catch (error) {
    console.warn("[D&Degenerates] ⚠️ logDebug setting unavailable:", error);
  }
}

/**
 * Roll a dice formula asynchronously.
 * @param {string} formula 
 * @returns {Promise<number>}
 */
export async function rollDice(formula) {
  try {
    const roll = await new Roll(formula).roll({ async: true });
    return roll.total;
  } catch (error) {
    logDebug(`❌ Error rolling dice formula '${formula}':`, error);
    return 0;
  }
}

/**
 * Safely get a module setting, falling back if not found.
 * @param {string} moduleName 
 * @param {string} settingName 
 * @param {any} fallback 
 * @returns {any}
 */
export function getSafeSetting(moduleName, settingName, fallback = null) {
  try {
    return game.settings.get(moduleName, settingName);
  } catch (error) {
    logDebug(`⚠️ Safe setting fetch failed [${moduleName}.${settingName}], using fallback:`, fallback);
    return fallback;
  }
}

/**
 * Randomly select an element from an array.
 * @param {Array} array 
 * @returns {any|null}
 */
export function randomElement(array) {
  if (!Array.isArray(array) || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Smooth interpolation between two values.
 * @param {number} edge0 
 * @param {number} edge1 
 * @param {number} x 
 * @returns {number}
 */
export function smoothStep(edge0, edge1, x) {
  const t = clampValue((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
