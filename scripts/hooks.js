// hooks.js
import { ArousalManager } from "./arousal-manager.js";

const MODULE_NAME = "dungeons-and-degenerates-pf2e";

/**
 * Registers minor passive hooks for D&Degenerates systems.
 */
export function registerHooks() {
  console.log(`[D&Degenerates] ✅ Registering passive hooks`);

  // Monitor stimulation bar (Bar 5) for overflow
  Hooks.on("updateToken", (token, updates) => {
    if (updates?.flags?.barbrawl?.resourceBars?.bar5?.value !== undefined) {
      const actor = token.actor;
      if (actor) {
        ArousalManager.monitorStimulation(actor);
      }
    }
  });

  // (Future) Add additional minor passive hooks here
}
