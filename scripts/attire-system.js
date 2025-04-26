import { BODY_MAP, EXPOSURE_THRESHOLDS } from "./attire-tags.js";
import { getSetting } from "./settings-manager.js";

export class AttireSystem {
  async applyExposureEffect(condition, actor, uuid) {
    const debugMode = getSetting("debugMode");
    const debugStimuli = getSetting("debugStimuli");
    const engine = globalThis.dndPF2e?.effectEngine;
    if (!engine) return;
    const { applyEffect, removeEffect } = engine;
    const action = condition ? applyEffect : removeEffect;
    try {
      await action(actor, uuid);
      if (debugMode) console.log(`[D&Degenerates] 🧬 Exposure ${condition ? "applied" : "removed"} for ${uuid}`);
    } catch (err) {
      console.warn(`[D&Degenerates] ❌ Failed to ${condition ? "apply" : "remove"} exposure effect (${uuid}):`, err);
    }
  }
  /**
   * Evaluates exposure levels based on worn equipment and updates actor flags.
   */
  static async refreshExposure(actor) {
    const debugMode = getSetting("debugMode");
    const attire = new AttireSystem(actor);
    const wornItems = attire.getEquippedItems();
    if (!wornItems.length) {
      if (debugMode) console.log(`[D&Degenerates] 🚨 No items equipped. Exposure defaults to full.`);
      return;
    }
    if (debugMode) console.log(`[D&Degenerates] 🧤 Equipped items for ${actor.name}:`, wornItems.map(i => i.name));

    let previous = {};
    try {
      previous = (await actor.getFlag("dungeons-and-degenerates-pf2e", "attire.exposure")) ?? {};
    } catch (e) {
      console.warn("[D&Degenerates] ⚠️ Failed to get attire.exposure flag:", e);
    }
    const updated = attire.getExposureMap();
    if (debugMode) console.log(`[D&Degenerates] 🧪 Raw exposure tiers before filtering:`);
    if (debugMode) Object.entries(updated).forEach(([k, v]) => console.log(`• ${k}: tier=${v.tier}, exposed=${v.exposed}`));
    if (debugMode) console.log(`[D&Degenerates] 🧩 Full exposure map for ${actor.name}:`, updated);
    await actor.update({ [`flags.dungeons-and-degenerates-pf2e.attire.exposure`]: updated });
    if (debugMode) console.log(`[D&Degenerates] ✅ Flag set via update. New exposure map:`, updated);

    // Check exposed parts and auto-apply effects
    const exposedParts = Object.entries(updated)
      .filter(([_, val]) => val.tier === "exposed")
      .map(([key]) => key);

    if (debugMode) console.log(`[D&Degenerates] 🔥 Exposed parts for ${actor.name}:`, exposedParts);

    // Trigger exposure transition hook
    for (const part of exposedParts) {
      const label = this.getLocalizedBodyLabel(part);
      game.dndPF2e?.lustEngine?.onExposure?.(actor, part, label);
    }
    if (debugMode) {
      
      exposedParts.forEach(p => console.log(`  • ${p}`));
    }
   
    const effectEngine = globalThis.dndPF2e?.effectEngine;
    if (!effectEngine) return;
    const compendium = game.packs.get("dungeons-and-degenerates-pf2e.degenerate-effects");
    if (!compendium) return console.warn("[D&Degenerates] ❌ Compendium not found for exposure effects.");
    await compendium.getDocuments();
    const { applyEffect, removeEffect } = effectEngine;
    const UUIDS = globalThis.dndPF2e?.UUIDS;
    const EXPOSURE_EFFECTS = {
      nipples: UUIDS.EXPOSED_BREASTS,
      genitals: UUIDS.EXPOSED_GENITALS,
      naked: UUIDS.NAKED
    };

    for (const [key, uuid] of Object.entries(EXPOSURE_EFFECTS)) {
      const isExposed = key === "naked"
        ? updated.nipples?.tier === "exposed" && updated.genitals?.tier === "exposed"
        : updated[key]?.tier === "exposed";

      await this.applyExposureEffect(isExposed, actor, uuid);
    }
    if (debugMode) console.log(`[D&Degenerates] 👗 Refreshed exposure map for ${actor.name}:`, updated);
  }

  constructor(actor) {
    this.actor = actor;
    this.bodyMap = BODY_MAP;
  }

  getEquippedItems() {
    const debugMode = getSetting("debugMode");
    try {
          return this.actor.items.filter(i => {
        if (["equipment", "armor"].includes(i.type)) {
        if (debugMode) console.log(`[D&Degenerates] 🧪 Checking carryType for: ${i.name}`, i.system?.equipped?.carryType);
        }
                return i.system?.equipped?.carryType?.toLowerCase() === "worn";
      });
    } catch (err) {
      console.warn("[D&Degenerates] ⚠️ Failed to get equipped items:", err);
      return [];
    }
  }

  getExposureMap() {
    
    this.exposureThresholds = EXPOSURE_THRESHOLDS;
    const exposure = {};
    const wornItems = this.getEquippedItems();

    for (const [slotKey, slot] of Object.entries(this.bodyMap)) {
      const debugMode = getSetting("debugMode");
    if (debugMode) console.log(`[D&Degenerates] 🧠 Evaluating slot: ${slotKey}`);
      for (const part of slot.covers) {
        let highest = 0;
        let source = null;

        for (const item of wornItems) {
          if (debugMode) console.log(`[D&Degenerates] 👕 Checking item: ${item.name}`);
          if (debugMode) console.log(`[D&Degenerates] 🧠 Raw item data:`, item);
          if (debugMode) console.log(`[D&Degenerates] 🔍 Traits (extracted):`, this.getItemTraits(item));
          const traits = this.getItemTraits(item);
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
          tier: this.calculateExposureTier(highest),
          exposed: highest < (this.exposureThresholds[part] ?? 1.0),
          from: source
        };
      }
    }

        return exposure;
  }

  getLocalizedBodyLabel(part) {
    const map = {
      nipples: "Nipples",
      genitals: "Genitals",
      buttocks: "Buttocks",
      belly: "Belly",
      chest: "Chest"
    };
    return map[part] || part;
  }

  getRevealChanceForTraits(traits) {
    const chances = {
      "micro skirt": 0.5,
      "mini skirt": 0.3,
      "loincloth": 0.2
    };
    for (const trait of traits) {
      if (trait in chances) return chances[trait];
    }
    return 0;
  }

  getRevealedParts() {
    const debugMode = getSetting("debugMode");
    
    const revealed = [];
    const wornItems = this.getEquippedItems();

    for (const item of wornItems) {
      const traits = this.getItemTraits(item);
      const chance = this.getRevealChanceForTraits(traits);
      const roll = Math.random();
        if (roll < chance) {
        if (debugMode) console.log(`[D&Degenerates] 🎲 RevealChance triggered by item (Chance: ${Math.round(chance * 100)}%)`);
          revealed.push("genitals");
        }
      }
    }

    return revealed;
  }

  /**
   * Calculates the visibility tier of a body part based on coverage.
   */
  calculateExposureTier(value) {
    if (value <= 0.1) return "exposed";
    if (value <= 0.5) return "partial";
    if (value < 1.0) return "concealed";
    return "covered";
  }

  getItemTraits(item) {
    try {
      if (!item || !item.system?.traits) return [];
    const t = item.system.traits;
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
    } catch (err) {
      console.warn("[D&Degenerates] ⚠️ Failed to extract item traits:", err);
      return [];
    }
  }

    /**
   * Handles random wardrobe reveal chance each round.
   * Triggers:
   * - Nudity stimulus flavor
   * - Passive LustEngine response
   * - AI response via onExposure()
   *
   * @param {Token} token
   */
  static handleRoundReveal(token) {
    const debugMode = getSetting("debugMode");
        const actor = token.actor;
    if (!actor) return;
    const attire = new AttireSystem(actor);
    const revealed = attire.getRevealedParts();
        const debugStimuli = getSetting("debugStimuli");
    if (revealed.length) {
      if (debugStimuli) logDebug("info", `[D&Degenerates] ✨ Triggering stimuli for: ${revealed.join(", ")}`);
      for (const part of revealed) {
        game.dndPF2e?.flavorEngine?.tryStimulusLine?.("nudity", token, actor);
      }
            if (debugMode) console.log(`[D&Degenerates] 🤭 Wardrobe reveal on ${actor.name}:`, revealed);
      if (debugStimuli) logDebug("info", `[D&Degenerates] ✨ Triggering stimuli for: ${revealed.join(", ")}`);
      for (const part of revealed) {
        game.dndPF2e?.flavorEngine?.tryStimulusLine?.("nudity", token, actor);
      }
      game.dndPF2e?.lustEngine?.triggerPassiveStimuli(token);
      game.dndPF2e?.ai?.onExposure?.(token, revealed);
      const debugStimuli = getSetting("debugStimuli");
      if (debugStimuli) logDebug("info", `[D&Degenerates] ✨ Triggering stimuli for: ${revealed.join(", ")}`);
      for (const part of revealed) {
        game.dndPF2e?.flavorEngine?.tryStimulusLine?.("nudity", token, actor);
      }
      for (const part of revealed) {
        game.dndPF2e?.flavorEngine?.tryStimulusLine?.("nudity", token, actor);
      }
      game.dndPF2e?.lustEngine?.triggerPassiveStimuli(token);
      }
  }
}
