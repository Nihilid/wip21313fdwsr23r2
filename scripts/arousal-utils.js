// Attire utility functions for Dungeons & Degenerates PF2e

export function calculateArousalChange(currentArousal, rate) {
  return currentArousal + rate;
}

export function getEquippedItems(actor) {
  return actor.items.filter(i => {
    if (["equipment", "armor"].includes(i.type)) {
      console.log(`[D&Degenerates] 🧪 Checking carryType for: ${i.name}`, i.system?.equipped?.carryType);
    }
    if (i.type !== "equipment" && i.type !== "armor") return false;
    return i.system?.equipped?.carryType?.toLowerCase() === "worn";
  });
}

export function getExposureMap(actor) {
  const debugMode = game.settings.get("dungeons-and-degenerates-pf2e", "debugMode");
  const exposure = {};
  const wornItems = getEquippedItems(actor);

  for (const [slotKey, slot] of Object.entries(actor.attireSystem?.bodyMap ?? {})) {
    if (debugMode) console.log(`[D&Degenerates] 🧠 Evaluating slot: ${slotKey}`);
    for (const part of slot.covers) {
      let highest = 0;
      let source = null;

      for (const item of wornItems) {
        if (debugMode) console.log(`[D&Degenerates] 👕 Checking item: ${item.name}`);
        const traits = extractTraits(item);
        for (const layer of slot.layers || []) {
          const normalize = str => str.toLowerCase().replace(/[-_]/g, " ");
          const tag = normalize(layer.tag);
          if (traits.includes(tag) && layer.coverage > highest) {
            highest = layer.coverage;
            source = item.name;
          }
        }
      }

      if (debugMode) console.log(`[D&Degenerates] 🧪 ${part} → coverage: ${highest} from ${source}`);
      exposure[part] = {
        coverage: highest,
        tier:
          highest <= 0.1 ? "exposed" :
          highest <= 0.5 ? "partial" :
          highest < 1.0  ? "concealed" :
          "covered",
        exposed: highest < (actor.attireSystem?.exposureThresholds?.[part] ?? 1.0),
        from: source
      };
    }
  }

  return exposure;
}

export function getRevealedParts(actor) {
  const debugMode = game.settings.get("dungeons-and-degenerates-pf2e", "debugMode");
  const revealed = [];
  const wornItems = getEquippedItems(actor);

  for (const item of wornItems) {
    const traits = extractTraits(item);
    if (traits.includes("loincloth") || traits.includes("mini skirt") || traits.includes("micro skirt")) {
      const roll = Math.random();
      const chance = traits.includes("micro skirt") ? 0.5 : traits.includes("mini skirt") ? 0.3 : 0.2;
      if (roll < chance) {
        if (debugMode) console.log(`[D&Degenerates] 🎲 RevealChance triggered by ${item.name} (${(chance * 100).toFixed(0)}% chance)`);
        revealed.push("genitals");
      }
    }
  }

  return revealed;
}

export function extractTraits(item) {
  const t = item.system?.traits;
  if (!t) return [];

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
