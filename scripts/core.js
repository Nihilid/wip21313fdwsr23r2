// core.js
import { ArousalManager } from "./arousal-manager.js";
import { SettingsManager } from "./settings-manager.js";

const MODULE_NAME = "dungeons-and-degenerates-pf2e";

Hooks.once("init", () => {
  console.log(`[D&Degenerates] ✅ Initializing module`);
  
  SettingsManager.registerSettings();
});

Hooks.once("ready", () => {
  console.log(`[D&Degenerates] ✅ Ready hook fired`);
  
  ArousalManager.initialize();

  import { registerHooks } from "./hooks.js";
  
  registerHooks();

  // Simple Calendar Hook
  Hooks.on("simple-calendar-date-time-change", async (data) => {
    if (!data || typeof data.diff !== "number") return;

    // Only act if at least 1 in-game minute has passed
    if (Math.abs(data.diff) >= 60) {
      console.log(`[D&Degenerates] 🕑 In-game minute passed, applying stimulation decay`);
      await ArousalManager.handleTimeProgression();
    }
  });

  console.log(`[D&Degenerates] ✅ Stimulation decay hook registered`);
});
