import { ArousalManager } from "./arousal-manager.js";

/**
 * Local version of getBarValue to avoid import order issues.
 * @param {Actor} actor 
 * @param {number} barId 
 * @returns {number|null}
 */
function getBarValueLocal(actor, barId) {
  const token = actor.getActiveTokens(true, true)[0];
  if (!token) return null;
  return getProperty(token, `flags.barbrawl.resourceBars.bar${barId}.value`) ?? null;
}

export function registerHooks() {
  console.log(`[D&Degenerates] ✅ Registering passive hooks`);

  Hooks.on("updateToken", (token, updates) => {
    if (updates?.flags?.barbrawl?.resourceBars?.bar5?.value !== undefined) {
      const actor = token.actor;
      if (actor) {
        const stim = getBarValueLocal(actor, 5); // manually read bar5

        if (stim >= 100) {
          ArousalManager.handleOrgasmResistance(actor); 
          // NOTE: no monitorStimulation here to avoid relying on unready statics.
        }
      }
    }
  });
}
