// hooks.js

import { ArousalManager } from "./arousal-manager.js";
import { PerceptionEngine } from "./perception-engine.js";
import { LustEngine } from "./lust-engine.js";
import { AttireSystem } from "./attire-system.js"; // ✅ New!
import { isPerceptionEnabled } from "./settings.js";

const MODULE_NAME = "dungeons-and-degenerates-pf2e";

export function registerHooks() {
  console.log(`[D&Degenerates] ✅ Registering passive hooks`);

  // Passive time advancement (Simple Calendar)
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

  // Lust clamping on token update
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

  // ✅ NEW: Combat Round End → Wardrobe Malfunction Check
  Hooks.on("combatRoundEnd", async () => {
    console.log(`[D&Degenerates] 🔥 Combat Round End: Checking wardrobe malfunctions...`);
    await AttireSystem.checkRoundMalfunctions();
  });
}
