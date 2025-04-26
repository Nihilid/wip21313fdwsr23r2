// effect-utils.js
// Modularized effect utilities for Dungeons & Degenerates

import { UUIDS } from './uuid-defs.js';
import { applyOrgasmEffect } from './effect-engine.js';
import { logDebug } from './utils.js';

/**
 * Apply an ActiveEffect to an actor from a Compendium UUID.
 * Prevents duplicate application.
 * @param {Actor} actor
 * @param {string} uuid - UUID of the effect to apply
 * @param {boolean} [log=true] - Whether to log debug output
 */
export async function applyEffect(actor, uuid, log = true) {
  if (!actor) return logDebug("warn", "[D&Degenerates] ❌ applyEffect skipped — missing actor.");
  if (!uuid) return logDebug("warn", "[D&Degenerates] ❌ applyEffect skipped — missing UUID.");
  const effect = await fromUuid(uuid);
  if (!effect) return logDebug("warn", `[D&Degenerates] ❌ applyEffect failed — no effect found for UUID: ${uuid}`);

  const alreadyApplied = getEffectsByUUID(actor, uuid).length > 0;
  if (alreadyApplied) return logDebug("info", `[D&Degenerates] ⚠️ Effect already applied from UUID: ${uuid} on ${actor.name}`);

  const effectData = effect.toObject();
  effectData.flags = foundry.utils.mergeObject(effectData.flags ?? {}, {
    core: { sourceId: uuid }
  });
  await actor.createEmbeddedDocuments("Item", [effectData]);
  if (log) logDebug("info", `[D&Degenerates] ✅ Applied effect from UUID: ${uuid} to ${actor.name}`);
}

/**
 * Remove ActiveEffects from an actor based on the effect's source UUID.
 * @param {Actor} actor
 * @param {string} uuid
 * @param {boolean} [log=true]
 */
export async function removeEffect(actor, uuid, log = true) {
  if (!actor) return logDebug("warn", "[D&Degenerates] ❌ removeEffect skipped — missing actor.");
  if (!uuid) return logDebug("warn", "[D&Degenerates] ❌ removeEffect skipped — missing UUID.");
  if (!actor || !uuid) return;
  const effectsToRemove = getEffectsByUUID(actor, uuid);
  for (const effect of effectsToRemove) {
    await effect.delete();
    if (log) logDebug("info", `[D&Degenerates] 🗑️ Removed effect from UUID: ${uuid} on ${actor.name}`);
  }
}

/**
 * Check if the actor has an ActiveEffect applied from the specified UUID.
 * @param {Actor} actor
 * @param {string} uuid
 * @returns {boolean}
 */
export function hasEffect(actor, uuid) {
  return getEffectsByUUID(actor, uuid).length > 0;
}

/**
 * Reduces Arousal based on libido after climax.
 * Applies a minimum reduction of 30.
 * @param {Actor} actor
 * @param {string} category - Gender category
 * @param {number} arousal
 * @param {number} libido
 */
export async function applyOrgasmArousalDrop(actor, category, arousal, libido) {
  let arousalDrop = 100 - libido;
  if (arousalDrop < 30) arousalDrop = 30;
  const newArousal = Math.max(arousal - arousalDrop, 0);
  await actor.getActiveTokens()[0]?.document?.setFlag("barbrawl", "resourceBars.bar2.value", newArousal);
  logDebug("info", `[D&Degenerates] Orgasm satisfaction: -${arousalDrop} Arousal (Libido=${libido}) → Arousal=${newArousal}`);
}

/**
 * Rolls to determine if a climax cascade occurs.
 * Triggers multiple orgasms on low rolls.
 * @param {Actor} actor
 */
export async function runClimaxCascade(actor) {
  const baseDie = actor.system.abilities?.con?.mod <= 0 ? 4 : 6;
  const cascadeTrigger = await new Roll(`1d${baseDie}`).roll({ async: true });
  logDebug("info", `[D&Degenerates] Climax Cascade roll (1d${baseDie}): ${cascadeTrigger.total}`);

  if (cascadeTrigger.total === 1) {
    const extraOrgasms = await new Roll("1d4").roll({ async: true });
    logDebug("info", `[D&Degenerates] Climax Cascade! Extra Orgasms: ${extraOrgasms.total}`);

    for (let i = 0; i < extraOrgasms.total; i++) {
      await applyOrgasmEffect(actor);
      const token = actor.getActiveTokens()[0];
      if (token) game.dndPF2e?.ai?.onOrgasm?.(token);
    }
  }
}

/**
 * Return all effects on an actor that match a given UUID.
 * @param {Actor} actor
 * @param {string} uuid
 * @returns {Item[]}
 */
export function getEffectsByUUID(actor, uuid) {
  return actor.items.filter(i => i.getFlag("core", "sourceId") === uuid);
}

/**
 * Increments a numeric flag on the actor.
 * Creates the flag if it doesn't exist.
 * @param {Actor} actor
 * @param {string} namespace
 * @param {string} key
 * @param {number} [by=1]
 */
/**
 * Apply a body scrawl marking to the actor with timed fading.
 * @param {Actor} actor
 * @param {string} text - What is written on them
 * @param {string} [appliedBy] - Name of the perpetrator
 */
export async function applyBodyScrawl(actor, text, appliedBy = "Unknown", location = "belly") {
  const now = game.time.worldTime;
  const entry = {
    text,
    location,
    appliedBy,
    time: now,
    duration: 172800 + Math.floor(Math.random() * 86400) // 48–72 hours in seconds
  };
  const scrawl = foundry.utils.deepClone(actor.flags?.dndPF2e?.bodyScrawl ?? {});
  scrawl.entries = scrawl.entries ?? [];
  scrawl.entries.push(entry);
  scrawl.lastApplied = now;
  await actor.setFlag("dndPF2e", "bodyScrawl", scrawl);
  const token = actor.getActiveTokens()[0];
  if (token) game.dndPF2e?.ai?.onScrawled?.(token);
  logDebug("info", `[D&Degenerates] ✍️ ${actor.name} was marked: "${text}" on ${location} by ${appliedBy}`);
}

/**
 * Fades scrawl markings naturally or when bathing is detected.
 * @param {Actor} actor
 * @param {boolean} bathing - If true, reduces durations aggressively
 */
/**
 * Return only visible scrawls based on attire and location.
 * @param {Actor} actor
 * @returns {Array} Visible scrawl entries
 */
export function getVisibleBodyScrawls(actor) {
  const scrawls = actor.flags?.dndPF2e?.bodyScrawl?.entries ?? [];
  const attire = game.dndPF2e?.attireSystem;
  const coverage = attire?.getCoverageMap(actor) ?? {};

  return scrawls.filter(e => {
    const tier = coverage[e.location]?.tier;
    return !tier || tier === "exposed" || tier === "revealing";
  });
}

export async function fadeBodyScrawls(actor, bathing = false) {
  const data = foundry.utils.deepClone(actor.flags?.dndPF2e?.bodyScrawl ?? {});
  if (!Array.isArray(data.entries)) return;
  const now = game.time.worldTime;

  data.entries = data.entries.map(e => {
    const remaining = e.duration - (now - e.time);
    const fadeFactor = bathing ? 0.6 + Math.random() * 0.2 : 1;
    return {
      ...e,
      duration: Math.max(0, remaining * fadeFactor),
      time: now
    };
  }).filter(e => e.duration > 0);

  await actor.setFlag("dndPF2e", "bodyScrawl", data);
  if (bathing) logDebug("info", `[D&Degenerates] 🛁 Bathing faded scrawls on ${actor.name}`);
}
  const flags = foundry.utils.deepClone(actor.flags[namespace] ?? {});
  flags[key] = (flags[key] ?? 0) + by;
  await actor.update({ [`flags.${namespace}`]: flags });
}
