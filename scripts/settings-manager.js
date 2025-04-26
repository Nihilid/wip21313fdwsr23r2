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

    // 🔥 New: Decay Immunity Duration after orgasm
    game.settings.register(MODULE_NAME, "decayImmunityDuration", {
      name: "Decay Immunity Duration",
      hint: "Number of in-game minutes after orgasm before stimulation decay resumes.",
      scope: "world",
      config: true,
      type: Number,
      default: 10
    });

    // 🔥 New: Orgasm Message Whisper Toggle
    game.settings.register(MODULE_NAME, "whisperOrgasmMessages", {
      name: "Whisper Orgasm Messages to GM Only",
      hint: "If enabled, orgasm/resistance messages are only visible to the GM instead of public chat.",
      scope: "world",
      config: true,
      type: Boolean,
      default: true
    });

    console.log("[D&Degenerates] ✅ Settings registered");
  }
}

// 🧠 SETTINGS GETTERS
export function getArousalThreshold() {
  return game.settings.get(MODULE_NAME, "arousalThreshold");
}

export function getStimDecayRate() {
  return game.settings.get(MODULE_NAME, "stimDecayRate");
}

export function getOrgasmResistanceDC() {
  return game.settings.get(MODULE_NAME, "orgasmResistanceDC");
}

export function getDecayImmunityDuration() {
  return game.settings.get(MODULE_NAME, "decayImmunityDuration");
}

export function getWhisperOrgasmMessages() {
  return game.settings.get(MODULE_NAME, "whisperOrgasmMessages");
}
