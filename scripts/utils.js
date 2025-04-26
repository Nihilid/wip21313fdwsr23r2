// utils.js

/**
 * Module identifier for settings and registration.
 * @constant {string}
 */
export const MODULE_ID = "dungeons-and-degenerates-pf2e";

/**
 * Retrieve a game setting value for the module.
 * @param {string} key - The setting key
 * @returns {*}
 */
export function getSetting(key) {
  return game.settings.get(MODULE_ID, key);
}

/**
 * Extracts lowercase traits from an actor.
 * @param {Actor} actor
 * @returns {string[]} List of lowercase trait strings
 */
export function parseTraits(actor) {
  return (actor.system?.traits?.value || []).map(t => t.toLowerCase());
}

/**
 * Determine gender category (feminine, masculine, other) based on actor traits.
 * @param {Actor} actor
 * @returns {string} Gender category string
 */
export function getGenderCategory(actor) {
  const traitSet = new Set(parseTraits(actor));
  const feminineTraits = getSetting("feminineTraits").split(",").map(t => t.trim().toLowerCase());
  const masculineTraits = getSetting("masculineTraits").split(",").map(t => t.trim().toLowerCase());

  if (feminineTraits.some(t => traitSet.has(t))) return "feminine";
  if (masculineTraits.some(t => traitSet.has(t))) return "masculine";
  return "other";
}

/**
 * Clamp a value between two bounds.
 * @param {number} value
 * @param {number} [min=0]
 * @param {number} [max=100]
 * @returns {number}
 */
export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Round a number to 2 decimal places.
 * @param {number} n
 * @returns {number}
 */
export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Validate if bar2, bar3, and bar4 exist in a bar object.
 * @param {object} bars
 * @returns {boolean}
 */
export function validateBars(bars) {
  return bars?.bar2 !== undefined && bars?.bar3 !== undefined && bars?.bar4 !== undefined;
}

/**
 * Set a custom resource bar value (bar2–bar5).
 * @param {Token} token
 * @param {number} barIndex - Index from 2 to 5
 * @param {number} value
 */
export async function setBarValue(token, barIndex, value) {
  if (!token?.document) return;
  const bars = foundry.utils.deepClone(token.document?.flags?.barbrawl?.resourceBars || {});
  const barKey = `bar${barIndex}`;
  if (!bars[barKey]) bars[barKey] = {};
  bars[barKey].value = round2(clamp(value));
  await token.document.setFlag("barbrawl", "resourceBars", bars);
}

/**
 * Get a clamped + rounded value from a resource bar.
 * @param {Token} token
 * @param {number} barIndex
 * @returns {number}
 */
export function getBarValue(token, barIndex) {
  if (!token?.document) return 0;
  const bars = token.document?.flags?.barbrawl?.resourceBars || {};
  const barKey = `bar${barIndex}`;
  return round2(clamp(bars[barKey]?.value ?? 0));
}

/**
 * Maps stat names to custom bar indexes.
 * @constant
 */
export const BAR_MAP = {
  arousal: 2,
  lust: 3,
  libido: 4,
  stimulation: 5,
};

/**
 * Unified logging function based on debug setting.
 * Supports levels: log, warn, info.
 * @param {"log"|"warn"|"info"} level
 * @param {...*} args
 */
export function logDebug(level = "log", ...args) {
  if (!getSetting("debugMode")) return;
  const prefix = "[D&Degenerates]";
  if (level === "warn") console.warn(prefix, ...args);
  else if (level === "info") console.info(prefix, ...args);
  else console.log(prefix, ...args);
}

/**
 * Bar utilities namespace
 */
export const Bars = {
  set: setBarValue,
  get: getBarValue,
  clamp,
  round2,
};

/**
 * Gender utilities namespace
 */
export const Gender = {
  getCategory: getGenderCategory,
  parseTraits,
};
