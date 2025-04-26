// pregnancy-utils.js
// Shared helper functions for pregnancy management

/**
 * Apply pregnancy-related effects if belly is overfilled.
 * @param {Actor} actor - The affected actor
 * @param {number} volume - Current total fetus volume
 */
export async function applyStuffedEffects(actor, volume) {
  const effects = [];
  if (volume >= 8000) {
    effects.push("Compendium.pf2e.conditionitems.Item.rq5QgY1mUuC2aDxz"); // Enfeebled 1
    effects.push("Compendium.pf2e.conditionitems.Item.qZrDJZrWtPYxQMHs"); // Slowed 1
  }
  for (const uuid of effects) {
    const effect = await fromUuid(uuid);
    if (effect) await actor.createEmbeddedDocuments("Item", [effect.toObject()]);
  }
}

/**
 * Check and implant queued fertilized ova based on available volume.
 * Updates fetus volume and pregnancy count.
 * @param {Actor} actor
 */
export async function checkQueuedImplantation(actor) {
  const queued = actor.itemTypes.effect.filter(e => e.slug === "fertilized" && e.flags?.dndPF2e?.pregnancy?.queued);
  if (!queued.length) return;

  const fetusVolumePerOvum = Number(getProperty(actor, "flags.dndPF2e.pregnancy.fetusVolumePerOvum")) || 2500;
  const currentFetusVol = Number(getProperty(actor, "flags.dndPF2e.belly.fetusVolume")) || 0;
  const spermVolume = Number(getProperty(actor, "flags.dndPF2e.belly.spermVolume")) || 0;
  const available = Math.max(0, 10000 - (currentFetusVol + spermVolume));
  const maxNew = Math.floor(available / fetusVolumePerOvum);
  const toImplant = queued.slice(0, maxNew);

  if (!toImplant.length) return;

  const newFetusVol = toImplant.length * fetusVolumePerOvum;
  await actor.setFlag("dndPF2e", "belly.fetusVolume", currentFetusVol + newFetusVol);
  await actor.setFlag("dndPF2e", "pregnancy.count", (getProperty(actor, "flags.dndPF2e.pregnancy.count") ?? 0) + toImplant.length);

  for (const fx of toImplant) {
    await fx.delete();
  }

  if (game.settings.get("dndPF2e", "debugMode")) console.log(`[D&Degenerates] 🐣 ${actor.name} implanted ${toImplant.length} queued ovum/ova.`);
}
