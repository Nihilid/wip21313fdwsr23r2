// pregnancy-utils.js
// Shared helper functions for pregnancy and fertility management

const IMPLANT_VOLUME_CAP = 10000;
const DEFAULT_FETUS_VOLUME = 2500;
const EFFECTS_STUFFED = [
  "Compendium.pf2e.conditionitems.Item.rq5QgY1mUuC2aDxz", // Enfeebled 1
  "Compendium.pf2e.conditionitems.Item.qZrDJZrWtPYxQMHs"  // Slowed 1
];

/**
 * Applies multiple effects by UUID to an actor.
 */
async function applyEffectsFromUUIDs(actor, uuids = []) {
  for (const uuid of uuids) {
    const effect = await fromUuid(uuid);
    if (effect) await actor.createEmbeddedDocuments("Item", [effect.toObject()]);
  }
}

/**
 * Apply stuffed-related penalties or effects based on fullness.
 * @param {Actor} actor
 * @param {number} volume
 */
export async function applyStuffedEffects(actor, volume) {
  if (volume >= 8000) {
    await applyEffectsFromUUIDs(actor, EFFECTS_STUFFED);
  }
}

/**
 * Calculates maximum available implantation space in the womb.
 */
/**
 * Calculates how many fertilized ova can be implanted based on available womb capacity.
 * @param {Actor} actor
 * @param {number} fetusVolumePerOvum
 * @returns {number}
 */
export function calculateAvailableImplants(actor, fetusVolumePerOvum) {
  const currentFetusVol = Number(getProperty(actor, "flags.dndPF2e.belly.fetusVolume")) || 0;
  const spermVolume = Number(getProperty(actor, "flags.dndPF2e.belly.spermVolume")) || 0;
  const available = Math.max(0, IMPLANT_VOLUME_CAP - (currentFetusVol + spermVolume));
  return Math.floor(available / fetusVolumePerOvum);
}

/**
 * Attempts to convert fertilized (queued) effects into tracked pregnancies.
 */
/**
 * Check and convert queued fertilized ova into active pregnancies.
 * @param {Actor} actor
 */
export function calculateFullness(sperm, fetus, capacity = 7500) {
  const fullness = round2(clamp(sperm + fetus, 0, capacity));
  const capacityRatio = Math.min(1, fullness / capacity);
  return { fullness, capacityRatio };
}

export async function checkQueuedImplantation(actor) {
  const queued = actor.itemTypes.effect.filter(e => e.slug === "fertilized" && e.flags?.dndPF2e?.pregnancy?.queued);
  if (!queued.length) return;

  const fetusVolumePerOvum = Number(getProperty(actor, "flags.dndPF2e.pregnancy.fetusVolumePerOvum")) || DEFAULT_FETUS_VOLUME;
  const maxNew = calculateAvailableImplants(actor, fetusVolumePerOvum);
  const toImplant = queued.slice(0, maxNew);

  if (!toImplant.length) {
    if (game.settings.get("dndPF2e", "debugMode")) {
      logDebug("info", `[D&Degenerates] 🐣 No space available for implantation on ${actor.name}`);
    }
    return;
  }

  const newFetusVol = toImplant.length * fetusVolumePerOvum;
  const prevFetusVol = Number(getProperty(actor, "flags.dndPF2e.belly.fetusVolume")) || 0;
  const prevImplantCount = Number(getProperty(actor, "flags.dndPF2e.pregnancy.count")) || 0;

  await actor.setFlag("dndPF2e", "belly.fetusVolume", prevFetusVol + newFetusVol);
  await actor.setFlag("dndPF2e", "pregnancy.count", prevImplantCount + toImplant.length);

  for (const fx of toImplant) {
    await fx.delete();
  }

  if (game.settings.get("dndPF2e", "debugMode")) {
    logDebug("info", `[D&Degenerates] 🐣 ${actor.name} implanted ${toImplant.length} queued ovum/ova.`);
  }
}
