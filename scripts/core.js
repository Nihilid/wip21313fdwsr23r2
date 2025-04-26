logDebug("✅ Reached top of core.js file");

import { getSetting } from "./settings-manager.js";
import { logDebug } from "./utils.js";

Hooks.once("init", async () => {
  CONFIG.dndPF2e = true;

  game.settings.register("dndPF2e", "enableFlags", {
    name: "Enable Degenerate Flags",
    scope: "world",
    config: false,
    type: Boolean,
    default: true
  });
  await import("./settings.js").then(({ registerDungeonsAndDegeneratesSettings }) => {
    registerDungeonsAndDegeneratesSettings();
  });
});

Hooks.once("ready", async () => {
  const effectsPack = game.packs.get("dungeons-and-degenerates-pf2e.degenerate-effects");
  logDebug("📦 Preloaded degenerate-effects compendium");

  if (effectsPack) {
    const effects = await effectsPack.getDocuments();
    logDebug("🧪 Degenerate Effects list:");
    effects.forEach(e => logDebug(`• ${e.name} → ${e.uuid} | _id: ${e._id}`));
  }

  
  Hooks.on("combatRound", () => {
    for (const token of canvas.tokens.placeables) {
      if (!token.actor || token.actor.system?.attributes?.hp?.value <= 0) continue;
      const AttireSystem = globalThis.dndPF2e.attireSystem;
      if (AttireSystem?.handleRoundReveal) AttireSystem.handleRoundReveal(token);
    }
  });
  
  try {
    // removed duplicate getSetting import
    let debugMode = false;
    try {
      debugMode = getSetting("debugMode");
    } catch (e) {
      console.warn("[D&Degenerates] DEBUG_MODE setting not registered yet.");
    }

    if (debugMode) logDebug("Ready hook triggered.");

    // Initialize ArousalManager
    const { ArousalManager } = await import("./arousal-manager.js");
    const arousalManager = new ArousalManager();
    logDebug("ArousalManager initialized.");

    // Initialize LustEngine
    const { LustEngine } = await import("./lust-engine.js");
    const lustEngine = new LustEngine();
    lustEngine.setup();
    if (debugMode) logDebug("LustEngine initialized.");

    // Register globally for macro access
    if (!globalThis.dndPF2e) globalThis.dndPF2e = {};

        const { UUIDS } = await import("./uuid-defs.js");
    globalThis.dndPF2e.UUIDS = UUIDS;

    Hooks.once("dndPF2e:ready", () => {

  Hooks.on("updateItem", async (item, changes) => {
    const actor = item.actor;
    if (!actor) return;

    const isEquippedChange = getProperty(changes, "system.equipped.carryType") !== undefined;
    if (isEquippedChange && ["equipment", "armor"].includes(item.type)) {
      const AttireSystem = globalThis.dndPF2e.attireSystem;
      if (AttireSystem?.refreshExposure) {
        logDebug(`[D&Degenerates] 👗 updateItem detected → refreshing exposure for ${actor.name}`);
        await AttireSystem.refreshExposure(actor);
      }
    }
  });
    Hooks.on("preUpdateItem", (item, changes) => {
      const carryTypePath = "system.equipped.carryType";
      const updatedCarryType = getProperty(changes, carryTypePath);
      if (updatedCarryType !== undefined) {
        logDebug(`[D&Degenerates] 👕 (preUpdate) ${item.name} carry type changing to: ${updatedCarryType}`);
        const AttireSystem = globalThis.dndPF2e.attireSystem;
        if (AttireSystem?.refreshExposure) {
          const actor = item.parent;
          const waitForUUIDS = async () => {
            for (let i = 0; i < 10; i++) {
              if (globalThis.dndPF2e?.UUIDS) return true;
              await new Promise(r => setTimeout(r, 10));
            }
            return false;
          };

          setTimeout(async () => {
            const ready = await waitForUUIDS();
            if (!ready) return console.warn("[D&Degenerates] ❌ UUIDS never loaded in time.");
            logDebug(`[D&Degenerates] 🧪 Calling refreshExposure for: ${actor?.name}`);
            try {
              logDebug(`[D&Degenerates] 🧪 Checking AttireSystem UUIDS:`, AttireSystem?.UUIDS);
              logDebug(`[D&Degenerates] 🧪 typeof applyEffect:`, typeof globalThis.dndPF2e.effectEngine?.applyEffect);
              logDebug(`[D&Degenerates] 🔧 typeof AttireSystem.refreshExposure:`, typeof AttireSystem.refreshExposure);
              AttireSystem.refreshExposure(actor);
            } catch (err) {
              console.warn(`[D&Degenerates] ❌ Failed to call refreshExposure:`, err);
            }
          }, 10);
        }
      }
    });
  });

    const { AttireSystem } = await import("./attire-system.js");
    globalThis.dndPF2e.attireSystem = AttireSystem;

    // Initialize CombatControl
    const { GrappleEngine } = await import("./combat-control.js");
    const combatControl = new GrappleEngine();
    globalThis.dndPF2e.combatControl = combatControl;
    if (debugMode) logDebug("CombatControl initialized.");

    // Initialize RapeEngine
    const { RapeEngine } = await import("./rape-engine.js");
    const rapeEngine = new RapeEngine();
    globalThis.dndPF2e.rapeEngine = rapeEngine;
    if (debugMode) logDebug("RapeEngine initialized.");

    // Initialize FertilityEngine
    const { FertilityEngine } = await import("./fertility-engine.js");
    const fertilityEngine = new FertilityEngine();
    globalThis.dndPF2e.fertilityEngine = fertilityEngine;
    if (debugMode) logDebug("FertilityEngine initialized.");

    // Initialize EffectEngine
    const effectEngine = await import("./effect-engine.js");
    globalThis.dndPF2e.effectEngine = effectEngine;
    if (debugMode) logDebug("EffectEngine initialized.");

    // Initialize PregnancyEngine
    const { PregnancyEngine } = await import("./pregnancy-engine.js");
    const pregnancyEngine = new PregnancyEngine();
    globalThis.dndPF2e.pregnancyEngine = pregnancyEngine;
    if (debugMode) logDebug("PregnancyEngine initialized.");
    globalThis.dndPF2e.lustEngine = lustEngine;

    // 🔧 Register to module object for internal use
    const mod = game.modules.get("dungeons-and-degenerates-pf2e");

    const { FlavorEngine } = await import("./flavor-engine.js");
    if (mod) {
      mod.lustEngine = lustEngine;
      mod.flavorEngine = FlavorEngine;
    }
    globalThis.dndPF2e.flavorEngine = FlavorEngine;

    // 🔥 Fire after all UUIDs, systems, and globals are in place
    Hooks.callAll("dndPF2e:ready");

    // Time-based arousal updates from Simple Calendar
    function initializeManager() {

      Hooks.on("simple-calendar-date-time-change", ({ diff }) => {
        const minutes = diff / 60;
        const secondsPerRound = game.modules.get("simple-calendar")?.api?.configuration?.secondsInCombatRound || 6;
        const rounds = diff / secondsPerRound;

        if (debugMode) {
          logDebug("simple-calendar-date-time-change fired with diff:", diff);
          logDebug("Converted diff to minutes:", minutes, "| rounds:", rounds);
        }

        if (minutes >= 0.1 || rounds >= 1) {
          arousalManager.updateAllTokens(diff);
        }
      });
    }

    if (!canvas.ready) {
      if (debugMode) console.warn("[D&Degenerates] Canvas not ready. Deferring manager initialization.");
      Hooks.once("canvasReady", initializeManager);
    } else {
      initializeManager();
    }

  } catch (error) {
    console.error("[D&Degenerates] ❌ Error in ready hook:", error);
  }
});
