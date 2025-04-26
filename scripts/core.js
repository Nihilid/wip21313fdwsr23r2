console.log("[D&Degenerates] 🧠 Reached very top of core.js file.");

import { registerHooks } from "./hooks.js";
import { ArousalManager } from "./arousal-manager.js";
import { SettingsManager } from "./settings-manager.js";
import { PerceptionEngine } from "./perception-engine.js";

const MODULE_NAME = "dungeons-and-degenerates-pf2e";

Hooks.once("init", () => {
  console.log(`[D&Degenerates] ✅ Initializing module`);
  
  SettingsManager.registerSettings();
});

Hooks.once("ready", () => {
  console.log(`[D&Degenerates] ✅ Ready hook fired`);
  
  ArousalManager.initialize();

  // Simple Calendar Hook
  Hooks.on("simple-calendar-date-time-change", async (data) => {
    if (!data || typeof data.diff !== "number") return;

    // Only act if at least 1 in-game minute has passed
    if (Math.abs(data.diff) >= 60) {
      console.log(`[D&Degenerates] 🕑 In-game minute passed, applying stimulation decay`);
      await ArousalManager.handleTimeProgression();
    }
  });
  
  PerceptionEngine.initialize();

  registerHooks();

  console.log(`[D&Degenerates] ✅ Stimulation decay hook registered`);
});
