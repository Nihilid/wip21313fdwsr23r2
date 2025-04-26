// lust-engine.js

import { clampValue } from "./utils.js";

const MODULE_NAME = "dungeons-and-degenerates-pf2e";

export class LustEngine {
  static initialize() {
    console.log(`[D&Degenerates] ✅ Lust Engine initialized`);
  }

  /**
   * Increases an actor's Lust by a specified amount, respecting Libido minimum.
   */
  static async increaseLust(actor, amount) {
    if (!actor || !actor.isOwner) {
      console.warn(`[D&Degenerates] ⚠️ increaseLust called with invalid actor.`);
      return;
    }

    const token = actor.getActiveTokens(true, true)[0];
    if (!token) {
      console.warn(`[D&Degenerates] ⚠️ increaseLust: No active token for actor ${actor.name}.`);
      return;
    }

    const current = LustEngine.getCurrentLust(actor);
    const libido = LustEngine.getLibido(actor);

    const newLust = clampValue(current + amount, libido, 100);

    await token.update({ [`flags.barbrawl.resourceBars.bar3.value`]: newLust });

    console.log(`[D&Degenerates] 🔥 Increased Lust for ${actor.name}: ${current} → ${newLust}`);
  }

  /**
   * Decreases an actor's Lust by a specified amount, respecting Libido minimum.
   */
  static async decreaseLust(actor, amount) {
    if (!actor || !actor.isOwner) {
      console.warn(`[D&Degenerates] ⚠️ decreaseLust called with invalid actor.`);
      return;
    }

    const token = actor.getActiveTokens(true, true)[0];
    if (!token) {
      console.warn(`[D&Degenerates] ⚠️ decreaseLust: No active token for actor ${actor.name}.`);
      return;
    }

    const current = LustEngine.getCurrentLust(actor);
    const libido = LustEngine.getLibido(actor);

    const newLust = clampValue(current - amount, libido, 100);

    await token.update({ [`flags.barbrawl.resourceBars.bar3.value`]: newLust });

    console.log(`[D&Degenerates] 🧊 Decreased Lust for ${actor.name}: ${current} → ${newLust}`);
  }

  /**
   * Sets an actor's Lust to a specific value, respecting Libido minimum.
   */
  static async setLust(actor, value) {
    if (!actor || !actor.isOwner) {
      console.warn(`[D&Degenerates] ⚠️ setLust called with invalid actor.`);
      return;
    }

    const token = actor.getActiveTokens(true, true)[0];
    if (!token) {
      console.warn(`[D&Degenerates] ⚠️ setLust: No active token for actor ${actor.name}.`);
      return;
    }

    const libido = LustEngine.getLibido(actor);

    const newLust = clampValue(value, libido, 100);

    await token.update({ [`flags.barbrawl.resourceBars.bar3.value`]: newLust });

    console.log(`[D&Degenerates] 🎯 Set Lust for ${actor.name} to ${newLust}`);
  }

  /**
   * Gets the current Lust value from the actor.
   */
  static getCurrentLust(actor) {
    const token = actor.getActiveTokens(true, true)[0];
    if (!token) return 0;

    return getProperty(token, `flags.barbrawl.resourceBars.bar3.value`) ?? 0;
  }

  /**
   * Gets the Libido minimum value from the actor.
   */
  static getLibido(actor) {
    const token = actor.getActiveTokens(true, true)[0];
    if (!token) return 0;

    return getProperty(token, `flags.barbrawl.resourceBars.bar4.value`) ?? 0;
  }
}
