import { BODY_MAP } from './bodymap.js';
import { EXPOSURE_THRESHOLDS, exceedsExposureThreshold, getExposureTier } from './exposure-config.js';

// Light and Vision Types Definitions
const LIGHT_LEVELS = {
  FULL_LIGHT: 1.0,  // Full light, no change to exposure
  DIM_LIGHT: 0.5,   // Dim light, reduce exposure if no low-light vision
  DARKNESS: 0.2     // Darkness, no exposure unless darkvision
};

const VISION_TYPES = {
  NONE: "none",
  LOW_LIGHT: "low_light",
  DARKVISION: "darkvision"
};

/**
 * Returns all tags associated with an item.
 * Filters out invalid tags that do not exist in the TAG_REGISTRY.
 * 
 * @param {Item} item - The item to get tags for.
 * @returns {string[]} An array of valid tags associated with the item.
 */
function getItemTags(item) {
  if (!item?.system?.traits?.value || item.system?.traits?.value.length === 0) {
    console.warn(`[D&Degenerates] Item ${item?.name || "unknown"} has no tags assigned. Assigning default tag.`);
    return ["miscellaneous"];
  }
  return item.system?.traits?.value?.filter(tag => TAG_REGISTRY[tag]);
}

/**
 * Checks if an item has a specific tag.
 * 
 * @param {Item} item - The item to check.
 * @param {string} tag - The tag to look for.
 * @returns {boolean} True if the item contains the tag, otherwise false.
 */
function hasTag(item, tag) {
  const tagSet = new Set(item?.system?.traits?.value || []);
  return tagSet.has(tag) && TAG_REGISTRY[tag];
}

/**
 * Returns a map of body parts and their exposure data.
 * Uses a categorized item list to determine body part coverage.
 * 
 * @param {Actor} actor - The actor to get the exposure data for.
 * @returns {Object} A map of body parts and their corresponding exposure details.
 */
function getExposureMap(actor) {
  if (!actor || !actor.attireSystem?.bodyMap) return {};

  const lightLevel = getLightLevel(actor); // Assume this function determines light level for the actor
  const categorizedItems = categorizeItemsByTag(actor.items);

  // Check actor's vision type and adjust exposure accordingly
  const actorVision = actor.system?.traits?.value.includes(VISION_TYPES.DARKVISION) ? VISION_TYPES.DARKVISION : 
                      actor.system?.traits?.value.includes(VISION_TYPES.LOW_LIGHT) ? VISION_TYPES.LOW_LIGHT : 
                      VISION_TYPES.NONE;

  const exposureMap = {};

  Object.entries(categorizedItems).forEach(([category, items]) => {
    let totalExposure = 0;
    let itemCount = 0;

    items.forEach(item => {
      const traits = extractTraits(item);
      const exposureFactor = getExposureFactor(traits); // Function that calculates the base exposure

      totalExposure += exposureFactor;
      itemCount++;
    });

    if (itemCount > 0) {
      let adjustedExposure = totalExposure / itemCount;

      // Adjust exposure based on light level and vision type
      if (lightLevel === LIGHT_LEVELS.DIM_LIGHT && actorVision !== VISION_TYPES.LOW_LIGHT) {
        adjustedExposure *= 0.5; // Reduce exposure for non-low-light vision
      } else if (lightLevel === LIGHT_LEVELS.DARKNESS && actorVision !== VISION_TYPES.DARKVISION) {
        adjustedExposure = 0; // No exposure in darkness without darkvision
      }

      exposureMap[category] = {
        covered: 1 - adjustedExposure,
        exposed: adjustedExposure
      };
    }
  });

  return exposureMap;
}

/**
 * Determines light level for the actor based on the environment.
 * 
 * @param {Actor} actor - The actor whose environment is considered.
 * @returns {number} The light level for the actor.
 */
function getLightLevel(actor) {
  // Here, you'd check the actor’s environment, location, or nearby light sources
  // For now, we assume this is based on the environment
  if (actor.environment?.lightLevel === "dark") return LIGHT_LEVELS.DARKNESS;
  if (actor.environment?.lightLevel === "dim") return LIGHT_LEVELS.DIM_LIGHT;
  return LIGHT_LEVELS.FULL_LIGHT;
}

/**
 * Returns an array of exposed body parts based on the outfit's traits.
 * Checks for traits like 'loincloth', 'mini skirt', and others to determine exposed parts.
 * 
 * @param {Actor} actor - The actor to check the exposure for.
 * @returns {string[]} A list of exposed parts.
 */
let revealedPartsCache = null;

function getRevealedParts(actor) {
  // Recompute if cache is cleared or new traits are added
  if (!actor || !actor.attireSystem?.bodyMap) return [];

  if (revealedPartsCache) return revealedPartsCache;

  const revealed = [];
  const wornItems = getEquippedItems(actor);

  wornItems.forEach(item => {
    const traits = extractTraits(item);
    if (traits.includes(TAG_REGISTRY.CLOTHING)) {
      revealed.push("genitals");
    }
  });

  revealedPartsCache = revealed;
  return revealedPartsCache;
}

/**
 * Returns the chance of exposure based on item traits.
 * 
 * @param {string[]} traits - An array of normalized traits.
 * @returns {number} The exposure chance between 0–1.
 */
function getRevealChance(traits) {
  if (traits.includes(TAG_REGISTRY.HEADGEAR)) return 0.5;
  if (traits.includes(TAG_REGISTRY.FOOTWEAR)) return 0.3;
  if (traits.includes(TAG_REGISTRY.CLOTHING)) return 0.2;
  return 0;
}

/**
 * Extracts all normalized traits from an item (standard + custom).
 * 
 * @param {Item} item - The item to extract traits from.
 * @returns {string[]} An array of normalized traits.
 */
function extractTraits(item) {
  if (!item || !item.system?.traits) return [];

  const t = item.system.traits;
  const standard = t.value instanceof Set
    ? Array.from(t.value)
    : Array.isArray(t.value)
      ? t.value
      : [];

  const custom = typeof t.custom === "string"
    ? t.custom.split(/[,;]/).map(s => s.trim()).filter(Boolean)
    : [];

  const normalize = str => str.toLowerCase().replace(/[-_]/g, " ");
  return [...standard, ...custom].map(normalize);
}

/**
 * Returns all item traits for an item, or an empty array if not available.
 * 
 * @param {Item} item - The item to extract all traits for.
 * @returns {string[]} An array of all traits.
 */
function getAllItemTraits(item) {
  return item.system?.traits?.value || [];
}

/**
 * Adds a new tag to an item if it's not already present.
 * 
 * @param {Item} item - The item to add the tag to.
 * @param {string} tag - The tag to add.
 */
function addTagToItem(item, tag) {
  if (!item.system?.traits?.value.includes(tag)) {
    item.system.traits.value.push(tag);
  }
}

/**
 * Removes a tag from an item.
 * 
 * @param {Item} item - The item to remove the tag from.
 * @param {string} tag - The tag to remove.
 */
function removeTagFromItem(item, tag) {
  const tagIndex = item.system?.traits?.value.indexOf(tag);
  if (tagIndex !== -1) {
    item.system.traits.value.splice(tagIndex, 1);
  }
}

/**
 * Refreshes the actor's exposure based on updated traits or item changes.
 * This function is called when an item's traits are updated during play.
 * 
 * @param {Actor} actor - The actor whose exposure data needs to be refreshed.
 */
function refreshActorExposure(actor) {
  // Trigger recomputation of exposure data
  if (actor) {
    actor.attireSystem.getExposureMap(actor);
  }
}

// Hook to listen for item updates and clear the cache when traits are changed
let debounceTimer = null;

Hooks.on("updateItem", async (item, changes) => {
  // Check if any traits were changed
  if (changes?.system?.traits?.value) {
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(async () => {
      console.log(`[D&Degenerates] Item ${item.name} updated with new traits: ${changes.system.traits.value}`);
      revealedPartsCache = null;
      // Trigger recomputation of exposure
      await refreshActorExposure(item.actor);
    }, 100); // Adjust delay as needed
  }
});

// New refinements:
function applyStealthEffect(actor) {
  if (actor.system?.traits?.value.includes("stealth")) {
    console.log(`${actor.name} is in stealth, reducing exposure.`);
    // Apply reduced exposure or no exposure based on stealth status
    const exposureMap = getExposureMap(actor);
    Object.entries(exposureMap).forEach(([bodyPart, { exposed }]) => {
      if (exceedsExposureThreshold(bodyPart, exposed)) {
        applyEffect(actor, "stealthy"); // Apply stealthy effect
      }
    });
  }
}

function getLayeredCoverage(item) {
  const sortedLayers = item.layers.sort((a, b) => b.coverage - a.coverage); // Prioritize higher coverage
  return sortedLayers[0]?.coverage || 0;  // Return the layer with the highest coverage
}

function calculateExposure(item) {
  const layers = item.layers.sort((a, b) => getLayeredCoverage(a) - getLayeredCoverage(b));
  return layers.reduce((total, layer) => total + layer.coverage, 0) / layers.length;
}

function logTagProcessing(item) {
  const tags = getItemTags(item);
  debugLog(`Processing item: ${item.name} with tags: ${tags.join(", ")}`);
  return tags;
}

function monitorExposureChanges(actor) {
  Hooks.on("updateActor", (actor, changes) => {
    if (changes?.system?.traits) {
      console.log(`[D&Degenerates] Exposure update for ${actor.name}:`, changes);
    }
  });
}

function addCustomTag(tag) {
  if (!TAG_REGISTRY[tag]) {
    TAG_REGISTRY[tag] = tag; // Add new tag to registry
    console.log(`Custom tag "${tag}" added successfully.`);
  }
}
