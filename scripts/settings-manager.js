// settings-manager.js
const MODULE_NAME = "dungeons-and-degenerates-pf2e";

export class SettingsManager {
  static registerSettings() {
    console.log("[D&Degenerates] ✅ Registering module settings");

    game.settings.register(MODULE_NAME, "arousalThreshold", {
      name: "Arousal Threshold",
      hint: "The Arousal % required to trigger 'Aroused' effects.",
      scope: "world",
      config: true,
      type: Number,
      default: 75
    });

    game.settings.register(MODULE_NAME, "stimDecayRate", {
      name: "Stimulation Decay Rate",
      hint: "Amount Stimulation decreases per in-game minute.",
      scope: "world",
      config: true,
      type: Number,
      default: 5
    });

    game.settings.register(MODULE_NAME, "orgasmResistanceDC", {
      name: "Orgasm Resistance DC",
      hint: "DC for Fortitude saves to resist orgasm when Stimulation reaches 100.",
      scope: "world",
      config: true,
      type: Number,
      default: 25
    });

    console.log("[D&Degenerates] ✅ Settings registered");
  }
}

// 🧠 SETTINGS GETTERS (for subsystems to use)
export function getArousalThreshold() {
  return game.settings.get(MODULE_NAME, "arousalThreshold");
}

export function getStimDecayRate() {
  return game.settings.get(MODULE_NAME, "stimDecayRate");
}

export function getOrgasmResistanceDC() {
  return game.settings.get(MODULE_NAME, "orgasmResistanceDC");
}
