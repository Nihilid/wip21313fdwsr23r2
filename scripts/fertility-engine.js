// fertility-engine.js
// Handles insemination, ovulation checks, fertilization chance, and pregnancy tracking

if (!attacker?.actor || !target?.actor) {
      logDebug("warn", "[D&Degenerates] ❌ Ejaculation skipped — missing attacker or target actor.");if (!actor || !actor.itemTypes?.effect) {
      logDebug("warn", "[D&Degenerates] ❌ scanForFertilization skipped — missing actor or effects.");|| !wombEffect) {
      logDebug("warn", "[D&Degenerates] ❌ Sperm decay skipped — missing actor or womb effect.");

import {
  $1,
  applyTimedEffectFromUuid
} from "./fertility-utils.js";
import { getSetting } from "./settings-manager.js";

/**
 * FertilityEngine tracks sperm, ovum, and pregnancy state over time.
 * Handles fertilization logic, ejaculate tracking, and gestation progression.
 */
export class FertilityEngine {
  // Decays sperm stored in the womb over time, adds leaking flavor, and recalculates belly fullness
  /**
   * Decay womb-stored sperm, update belly fullness, and apply leaking effects.
   * @param {Actor} actor
   */
  async handleSpermDecay(actor) {
    // 🔻 Decay contributor volumes as sperm decays over time
    const wombEffect = actor?.itemTypes?.effect?.find(e => e.slug === "sperm-womb");
    if (!actor || !wombEffect) {
      console.warn("[D&Degenerates] ❌ Sperm decay skipped — missing actor or womb effect.");
      return;
    }
    if (!wombEffect) return;

    const current = wombEffect.system?.badge?.value ?? 0;
    let decay = 0;

    // Only decay sperm outside of combat
    if (!game.combat?.started) {
      const pressureRatio = current / 7500;
      if (pressureRatio >= 0.75) decay = 350;
      else if (pressureRatio >= 0.5) decay = 200;
      else if (pressureRatio >= 0.25) decay = 100;
      else decay = 50;
    }

    // Recalculate fullness stats
    const newValue = Math.max(0, current - decay);
    const fetusVolume = Number(getProperty(actor, "flags.dndPF2e.belly.fetusVolume")) || 0;
    const capacity = Number(getSetting("wombCapacity")) || 7500;
    const { fullness, capacityRatio } = calculateFullness(newValue, fetusVolume, capacity);

    await actor.setFlag("dndPF2e", "belly.spermVolume", newValue);
    await actor.setFlag("dndPF2e", "belly.fetusVolume", fetusVolume);
    await actor.setFlag("dndPF2e", "belly.fullness", fullness);
    await actor.setFlag("dndPF2e", "belly.capacityRatio", capacityRatio);

    // Shrink sperm contributors proportionally
    let contributors = getSpermContributors(actor);
    const ratio = newValue / current;
    contributors = contributors.map(c => ({ ...c, volume: Math.floor(c.volume * ratio) })).filter(c => c.volume > 0);
    await actor.setFlag("dndPF2e", "fertility.spermContributors", contributors);

    // Adjust movement penalties or apply "Stuffed" effect based on fullness
    if (capacityRatio >= 1.0) {
      const stuffedUUID = "Compendium.dungeons-and-degenerates-pf2e.degenerate-effects.Item.stuffed";
      const effect = await fromUuid(stuffedUUID);
      if (effect) await actor.createEmbeddedDocuments("Item", [effect.toObject()]);
    } else if (capacityRatio >= 0.75) {
      await actor.update({ "system.attributes.speed.value": 10 });
    } else if (capacityRatio >= 0.5) {
      await actor.update({ "system.attributes.speed.value": 20 });
    } else if (capacityRatio >= 0.25) {
      await actor.update({ "system.attributes.speed.value": 25 });
    }

    // Handle full depletion
    if (newValue <= 0) {
      await wombEffect.delete();
      if (getSetting("debugMode")) console.log(`[D&Degenerates] 🧼 ${actor.name}'s womb is now empty of sperm.`);
    } else {
      // Update sperm level and simulate leaking
      await wombEffect.update({ "system.badge.value": newValue });
      await actor.setFlag("dndPF2e", "fertility.spermVolume", newValue);

      // Chance-based leak into pussy
      const leakChance = Math.min(100, Math.floor((current / 7500) * 50));
      const roll = Math.random() * 100;
      if (roll < leakChance) {
        const hasPussySperm = actor.itemTypes.effect.some(e => e.slug === "sperm-pussy");
        if (!hasPussySperm) {
          const leak = game.dndPF2e?.effectEngine?.getSpermEffect("sperm-pussy", 1);
          if (leak) await actor.createEmbeddedDocuments("Item", [leak]);
          logDebug("info", `[D&Degenerates] 💦 Leak triggered — ${actor.name}'s pussy is now messy again.`);
        }
      }

      // Auto-apply seep effect
      const hasPussySperm = actor.itemTypes.effect.some(e => e.slug === "sperm-pussy");
      if (!hasPussySperm) {
        const seep = game.dndPF2e?.effectEngine?.getSpermEffect("sperm-pussy", 1);
        if (seep) await actor.createEmbeddedDocuments("Item", [seep]);
        logDebug("info", `[D&Degenerates] 💧 Seepage detected — ${actor.name}'s pussy is now messy again.`);
      }
    }
  }

  // Fertilization logic: checks for ovulation + sperm and applies pregnancy state
  /**
   * Scan ovulating actors for fertilization eligibility, create or remove ova, apply effects.
   * @param {Actor} actor
   */
  async scanForFertilization(actor) {
    if (!actor || !actor.itemTypes?.effect) {
      console.warn("[D&Degenerates] ❌ scanForFertilization skipped — missing actor or effects.");
      return;
    }
    if (!actor) return;

    const hasOvulation = actor.itemTypes.effect.find(e => e.slug === "ovulating");
    if (!hasOvulation) return;
    const spermEffect = actor.itemTypes.effect.find(e => e.slug === "sperm-womb");
    if (!spermEffect) return;
    if (!hasOvulation || !spermEffect) return;

    // Create ova on ovulation if none exist
    let ova = getProperty(actor, "flags.dndPF2e.fertility.ova") ?? [];
    if (!Array.isArray(ova) || ova.length === 0) {
      const count = hasOvulation.system?.badge?.value ?? 1;
      const newOva = Array.from({ length: count }, () => ({
        createdAt: game.time.worldTime,
        expiresAt: game.time.worldTime + 86400
      }));
      await actor.setFlag("dndPF2e", "fertility.ova", newOva);
    }

    const spermVolume = Number(spermEffect.system?.badge?.value ?? 1);
    await actor.setFlag("dndPF2e", "fertility.spermVolume", spermVolume);

    const existingOva = getProperty(actor, "flags.dndPF2e.fertility.ova") ?? [];

    // Filter out expired ova (older than 24h)
    const now = game.time.worldTime;
    const viableOva = existingOva.filter(o => o.expiresAt > now);

    if (viableOva.length === 0) return;

    await actor.setFlag("dndPF2e", "fertility.ova", viableOva);

    const ovaCount = viableOva.length;
    let contributors = getSpermContributors(actor);
    if (!Array.isArray(contributors)) contributors = [];

    // Track each fertilized ovum by father/type
    const fertilized = [];

    for (let i = 0; i < viableOva.length; i++) {
      const fertilizationIndex = i;
      const chance = calculateFertilizationChance(actor, spermVolume);
      const roll = Math.random() * 100;
      logDebug("info", `[D&Degenerates] 🧬 Ova ${i + 1}/${ovaCount} → chance=${chance.toFixed(1)}%, roll=${roll.toFixed(1)}`);

      if (roll >= chance) continue;

      // Select father/type by volume
      const { type: selectedType, father: selectedFather } = assignFather(contributors);
          }
        }
      }

      fertilized.push({ type: selectedType, father: selectedFather });

      // Fort save vs stimulation
      const save = await actor.system.saves.fort?.roll({ skipDialog: true });
      const level = actor.system?.details?.level?.value ?? 1;
      const baseDC = 20 + Math.floor(level / 2) + (fertilizationIndex * 2);
      const resisted = save?.total >= baseDC;
      logDebug("info", `[D&Degenerates] 🧠 Fort save: ${save?.total ?? "—"} vs DC ${baseDC} → ${resisted ? "Success" : "Failure"}`);
      await applyStunnedEffect(actor, resisted);
      }
    }

    if (fertilized.length <= 0) return;

    // Remove fertilized ova from the viable list
    viableOva.splice(0, fertilized.length);
    await actor.setFlag("dndPF2e", "fertility.ova", viableOva);

    // Group fertilized ova by father/type → multiple pregnancies
    const grouped = groupFertilizedOvaByFather(fertilized);
    for (const key of Object.keys(grouped)) {
      if (!grouped[key].fertilizedOva) grouped[key].fertilizedOva = 0;
      grouped[key].fertilizedOva++;
    }
    }

    const pregnancies = getProperty(actor, "flags.dndPF2e.fertility.pregnancies") ?? [];
    for (const group of Object.values(grouped)) {
      pregnancies.push({
        ...group,
        durationRemaining: 72 + Math.floor(Math.random() * 48),
        rapid: false
      });
      logDebug("info", `[D&Degenerates] 🍼 Pregnancy added → Father: ${group.father}, Type: ${group.type}, Count: ${group.fertilizedOva}`);
    }

    await actor.setFlag("dndPF2e", "fertility.pregnancies", pregnancies);

    // Apply Fertilized effect per ovum
    await applyFertilizedEffect(actor, fertilized.length);
  
    // Apply Fertilized effects to actor
    if (effect) {
      for (let i = 0; i < $1Count; i++) {
        const fertilized = effect.toObject();
        fertilized.flags = fertilized.flags || {};
        fertilized.flags.core = fertilized.flags.core || {};
        fertilized.flags.core.expires = {
          type: "seconds",
          duration: 86400,
          startTime: game.time.worldTime
        };
        await actor.createEmbeddedDocuments("Item", [fertilized]);
      }
      console.log(`[D&Degenerates] 🥚 ${actor.name} successfully fertilized ${fertilizedCount} ova!`);
    }
      
        console.log(`[D&Degenerates] 😵 ${actor.name} is overwhelmed by pleasure and stunned (3) as fertilization hits mid-combat!`);
      }

      // Generate and store new pregnancy
      const ovaCount = hasOvulation.system?.badge?.value ?? 1;
      await actor.setFlag("dndPF2e", "fertility.ovaRemaining", ovaCount);

      const contributors = getSpermContributors(actor);

      
      }

      const pregnancy = {
        type: selectedType,
        father: selectedFather,
        fertilizedOva: ovaCount,
        durationRemaining: 72 + Math.floor(Math.random() * 48),
        rapid: false
      };
      const pregnancies = getProperty(actor, "flags.dndPF2e.fertility.pregnancies") ?? [];
      pregnancies.push(pregnancy);
      await actor.setFlag("dndPF2e", "fertility.pregnancies", pregnancies);

      // Apply Fertilized effects to actor
      await applyTimedEffectFromUuid(actor, "Compendium.dungeons-and-degenerates-pf2e.degenerate-effects.Item.fertilized", ovaCount, 86400);
  }

  // Constructor registers update hook for Simple Calendar
  constructor() {
    Hooks.on("simple-calendar-date-time-change", async ({ diff }) => {
      const hours = diff / 3600;
      if (!game.combat?.started && hours <= 0) return;
      for (const token of canvas.tokens.placeables) {
        if (!token.actor?.hasPlayerOwner) continue;
        await this.handlePregnancyTimers(token.actor, hours);
        await this.scanForFertilization(token.actor);
        await this.handleSpermDecay(token.actor);
      }
    });
  }

  // Ticks down pregnancy durations and triggers birth logic
  /**
   * Progresses pregnancy timers and resolves birth events.
   * @param {Actor} actor
   * @param {number} hoursElapsed
   */
  async handlePregnancyTimers(actor, hoursElapsed) {
    const pregnancies = getProperty(actor, "flags.dndPF2e.fertility.pregnancies") ?? [];
    const updated = [];

    for (const preg of pregnancies) {
      preg.durationRemaining -= hoursElapsed;
      if (preg.durationRemaining <= 0) {
        // Birth occurs when timer hits 0
preg.bornAt = game.time.worldTime;
preg.contributors = getProperty(actor, "flags.dndPF2e.fertility.spermContributors") ?? [];
$2
await actor.unsetFlag("dndPF2e", "fertility.spermContributors");
    }

    // Store updated pregnancy list
    await actor.setFlag("dndPF2e", "fertility.pregnancies", updated);

    // Recalculate fetus volume and belly fullness
    const fetusVolume = updated.length * 1000;
    await actor.setFlag("dndPF2e", "belly.fetusVolume", fetusVolume);
    const spermVolume = getProperty(actor, "flags.dndPF2e.belly.spermVolume") ?? 0;
    const { fullness } = calculateFullness(spermVolume, fetusVolume);
    await actor.setFlag("dndPF2e", "belly.fullness", fullness);
  }

  // Entry point for triggering insemination logic
  /**
   * Handle ejaculation and apply sperm effects to the target.
   * @param {object} params
   * @param {Token} params.attacker
   * @param {Token} params.target
   * @param {string} [params.tool="cock"]
   * @param {string} [params.orifice="pussy"]
   * @param {boolean} [params.womb=false]
   * @param {number} [params.volume=1]
   */
  async handleEjaculation({ attacker, target, tool = "cock", orifice = "pussy", womb = false, volume = 1 }) {
    if (!attacker?.actor || !target?.actor) {
      console.warn("[D&Degenerates] ❌ Ejaculation skipped — missing attacker or target actor.");
      return;
    }
    // 📝 Record ejaculation event with contributor metadata
    const actor = target?.actor;
    if (!actor) return;

    logDebug("info", `[D&Degenerates] 🍆 Handling ejaculation from ${attacker.name} into ${target.name}'s ${womb ? "womb" : orifice}`);

    const isOvulating = actor.itemTypes?.effect?.some(e => e.slug === "ovulating");

    // Fertilize immediately if ovulating and womb-targeted
    if (womb && isOvulating && orifice === "womb") {
      const ovulating = actor.itemTypes.effect.find(e => e.slug === "ovulating");
      const ovaCount = ovulating?.system?.badge?.value ?? 1;
      const fertilizedUUID = "Compendium.dungeons-and-degenerates-pf2e.degenerate-effects.Item.fertilized";
      await applyTimedEffectFromUuid(actor, fertilizedUUID, ovaCount, 86400);
      logDebug("info", `[D&Degenerates] 🥚 Fertilization successful — ${target.name} is now Fertilized!`);
    } else {
      // Otherwise apply sperm effects to target location
      const spermSlug = `sperm-${womb ? "womb" : orifice}`;
      const spermEffect = game.dndPF2e?.effectEngine?.getSpermEffect(spermSlug, Number(volume) || 1);
      if (spermEffect) await actor.createEmbeddedDocuments("Item", [spermEffect]);

      // ➕ Track sperm contributor
      const existing = getProperty(actor, "flags.dndPF2e.fertility.spermContributors") ?? [];
      existing.push({
      name: attacker.name,
        uuid: attacker.actor?.uuid ?? attacker.uuid,
        type: attacker.actor?.system?.details?.race?.value ?? "unknown",
        volume: volume,
        timestamp: game.time.worldTime
      });
      await actor.setFlag("dndPF2e", "fertility.spermContributors", existing.filter(c => c && typeof c.volume === "number" && c.volume > 0));
      logDebug("info", `[D&Degenerates] 💦 Sperm delivered to ${orifice} — volume: ${volume}`);
    }
  }
}
