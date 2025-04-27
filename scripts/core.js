// core.js

console.log(`[D&Degenerates] 🧠 Reached very top of core.js file.`);

// Utility and Base Constants First
import { Settings, isPerceptionEnabled } from "./settings.js";

// Core Systems (engines)
import { ArousalManager } from "./arousal-manager.js";
import { LustEngine } from "./lust-engine.js";
import { EffectEngine } from "./effect-engine.js";

// Specialized Systems
import { PerceptionEngine } from "./perception-engine.js";
import { FlavorEngine } from "./flavor-engine.js";
// import { CombatControl } from "./combat-control.js";

// Hooks
import { registerHooks } from "./hooks.js";

const MODULE_NAME = "dungeons-and-degenerates-pf2e";

Hooks.once("setup", async function () {
  console.log(`[D&Degenerates] ⚙️ Setting up D&Degenerates systems...`);
});

Hooks.once("ready", async function () {
  console.log(`[D&Degenerates] ✅ Initializing D&Degenerates core systems.`);

  // Register all D&Degenerates settings
  Settings.registerSettings();

  // Initialize system modules
  LustEngine.initialize();
  ArousalManager.initialize();
  PerceptionEngine.initialize();

  // Register passive hooks (token updates, bar5 stimulation overflow, etc.)
  registerHooks();

  console.log(`[D&Degenerates] ✅ Core systems initialization complete.`);
});


