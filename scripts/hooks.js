// hooks.js

import { ArousalManager } from "./arousal-manager.js";
import { PerceptionEngine } from "./perception-engine.js";
import { LustEngine } from "./lust-engine.js";
import { isPerceptionEnabled } from "./settings.js";

const MODULE_NAME = "dungeons-and-degenerates-pf2e";

export function registerHooks() {
  console.log(`[D&Degenerates] ✅ Registering passive hooks`);

  // Handle stimulation decay, Lust gain, and Lust correction per in-game minute
  Hooks.on("simple-calendar-date-time-change", (payload) => {
    const secondsElapsed = payload.diff ?? 0;
    const minutesElapsed = secondsElapsed / 60;

    if (minutesElapsed >= 1) {
      console.log(`[D&Degenerates] 🕒 Simple Calendar detected ${minutesElapsed} minute(s) elapsed.`);

      ArousalManager.handleTimeProgression();

      if (isPerceptionEnabled()) {
        PerceptionEngine.handleExposureCheck();
      }
    }
  });

  // Clamp Lust to Libido immediately on token updates
  Hooks.on("updateToken", async (tokenDocument, updateData, options, userId) => {
    const actor = tokenDocument.actor;
    if (!actor || !actor.hasPlayerOwner) return;

    const currentLust = getProperty(tokenDocument, `flags.barbrawl.resourceBars.bar3.value`) ?? 0;
    const libido = getProperty(tokenDocument, `flags.barbrawl.resourceBars.bar4.value`) ?? 0;

    if (currentLust < libido) {
      console.log(`[D&Degenerates] ⚖️ Clamping Lust to Libido for ${actor.name}: ${currentLust} → ${libido}`);
      await tokenDocument.update({ [`flags.barbrawl.resourceBars.bar3.value`]: libido });
    }
  });
  
  Hooks.on("combatRoundEnd", async () => {
  await AttireSystem.checkRoundMalfunctions();
});

}
