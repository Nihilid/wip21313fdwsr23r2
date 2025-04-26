// settings.js

/**
 * === Dungeons & Degenerates Setting Keys ===
 * Grouped for clarity in codebase; all settings are registered in Foundry's system config.
 * Each key here maps to a setting used in mechanics like Arousal, Lust, and Stimulation.
 */

export const SETTINGS = {
  DEBUG_STIMULI: "debugStimuli",
  MILK_GENERATION_RATE: "milkGenerationRate",
  STIMULUS_PULSE_INTERVAL: "stimulusPulseInterval",
  AROUSAL_RATE_COMBAT: "arousalRateCombat",
  DEBUG_MODE: "debugMode",
  LUST_AURA_RADIUS: "lustAuraRadius",
  LUST_DECAY: "lustDecay",
  LUST_SAVE_DC: "lustSaveDC",
  LUST_GAIN_FORMULA: "lustGainFormula",
  LUST_SAVE_EXPIRY: "lustSaveExpiry",
  LUST_COOLDOWN: "lustCooldown",
  FEMININE_TRAITS: "feminineTraits",
  MASCULINE_TRAITS: "masculineTraits",
  OTHER_TRAITS: "otherTraits",
  AROUSAL_RATE: "arousalRate",
  AROUSAL_MIN_RATE: "arousalMinRate",
  LIBIDO_RATE: "libidoRate",
  LIBIDO_MIN: "libidoMin",
  LIBIDO_MIN_RATE: "libidoMinRate",
  STIM_DECAY: "stimDecay"
};

export function registerDungeonsAndDegeneratesSettings() {
  const progressionHint = "Controls how quickly the stat approaches its target. Quadratic accelerates for large gaps; Sigmoid is fast at first, slower at the end.";
  const traitHint = "Comma-separated list of traits that determine influence.";

    game.settings.register("dungeons-and-degenerates-pf2e", SETTINGS.DEBUG_STIMULI, {
    name: "Stimuli Debug Logs",
    hint: "Show debug messages when stimuli are triggered or flavor is missing.",
    scope: "world",
    config: true,
    default: false,
    type: Boolean
  });

  game.settings.register("dungeons-and-degenerates-pf2e", SETTINGS.MILK_GENERATION_RATE, {
    name: "Milk Generation Rate",
    hint: "Base milk production rate (mL/hour per pregnancy).",
    scope: "world",
    config: true,
    default: 10,
    type: Number
  });

  game.settings.register("dungeons-and-degenerates-pf2e", SETTINGS.DEBUG_MODE, {
    name: "Debug Mode",
    hint: "Enable detailed debug output for development and troubleshooting.",
    scope: "world",
    config: true,
    default: false,
    type: Boolean
  });

    game.settings.register("dungeons-and-degenerates-pf2e", SETTINGS.LUST_DECAY, {
    name: "Lust Decay Rate",
    hint: "The rate at which lust decays per minute when not influenced.",
    scope: "world",
    config: true,
    default: 3,
    type: Number
  });


  game.settings.register("dungeons-and-degenerates-pf2e", SETTINGS.LUST_SAVE_DC, {
    name: "Lust Save DC",
    hint: "The DC of the Will save against Lust Auras.",
    scope: "world",
    config: true,
    default: 15,
    type: Number
  });

  game.settings.register("dungeons-and-degenerates-pf2e", SETTINGS.LUST_GAIN_FORMULA, {
    name: "Lust Gain Formula",
    hint: "Roll formula for Lust gain on failed save (e.g. 2 + 1d4 + CHA).",
    scope: "world",
    config: true,
    default: "2 + 1d4 + CHA",
    type: String
  });

  game.settings.register("dungeons-and-degenerates-pf2e", SETTINGS.FEMININE_TRAITS, {
    name: "Feminine Traits",
    hint: traitHint,
    scope: "world",
    config: true,
    default: "female, futa, succubus",
    type: String
  });

  game.settings.register("dungeons-and-degenerates-pf2e", SETTINGS.MASCULINE_TRAITS, {
    name: "Masculine Traits",
    hint: traitHint,
    scope: "world",
    config: true,
    default: "male, incubus, orc",
    type: String
  });

  game.settings.register("dungeons-and-degenerates-pf2e", SETTINGS.OTHER_TRAITS, {
    name: "Other Traits",
    hint: traitHint,
    scope: "world",
    config: true,
    default: "androgynous, herm, shemale",
    type: String
  });

  game.settings.register("dungeons-and-degenerates-pf2e", SETTINGS.AROUSAL_RATE, {
    name: "Arousal Rate",
    hint: "Rate at which Arousal moves toward Lust, as a percentage per in-game hour (e.g., 10 = 10% per hour).",
    scope: "world",
    config: true,
    default: 7.5,
    type: Number
  });

  game.settings.register("dungeons-and-degenerates-pf2e", SETTINGS.AROUSAL_RATE_COMBAT, {
    name: "Combat Arousal Rate",
    hint: "Combat rate at which Arousal moves toward Lust, as a percentage per in-game hour (converted from rounds).",
    scope: "world",
    config: true,
    default: 25,
    type: Number
  });

  game.settings.register("dungeons-and-degenerates-pf2e", SETTINGS.AROUSAL_MIN_RATE, {
    name: "Arousal Min Rate",
    hint: "Minimum fallback rate of Arousal change per hour, applied if the main rate is too small to cause progress.",
    scope: "world",
    config: true,
    default: 0,
    type: Number
  });

  game.settings.register("dungeons-and-degenerates-pf2e", SETTINGS.LIBIDO_RATE, {
    name: "Libido Rate",
    hint: "Rate at which Libido increases toward Arousal, as a percentage per in-game hour.",
    scope: "world",
    config: true,
    default: 200,
    type: Number
  });

  game.settings.register("dungeons-and-degenerates-pf2e", SETTINGS.LIBIDO_MIN, {
    name: "Libido Minimum",
    hint: "Minimum value that Lust cannot fall below.",
    scope: "world",
    config: true,
    default: 30,
    type: Number
  });

  game.settings.register("dungeons-and-degenerates-pf2e", SETTINGS.LIBIDO_MIN_RATE, {
    name: "Libido Min Rate",
    hint: "Minimum fallback rate of Libido increase per hour, used when primary rate is too small to progress.",
    scope: "world",
    config: true,
    default: 0,
    type: Number
  });

  game.settings.register("dungeons-and-degenerates-pf2e", "arousalProgressionModel", {
    name: "Arousal Progression Model",
    hint: progressionHint,
    scope: "world",
    config: true,
    default: "linear",
    type: String,
    choices: {
      linear: "Linear",
      quadratic: "Quadratic",
      sigmoid: "Sigmoid"
    }
  });

  game.settings.register("dungeons-and-degenerates-pf2e", "libidoProgressionModel", {
    name: "Libido Progression Model",
    hint: progressionHint,
    scope: "world",
    config: true,
    default: "linear",
    type: String,
    choices: {
      linear: "Linear",
      quadratic: "Quadratic",
      sigmoid: "Sigmoid"
    }
  });

  game.settings.register("dungeons-and-degenerates-pf2e", SETTINGS.STIMULUS_PULSE_INTERVAL, {
    name: "Stimulus Pulse Interval",
    hint: "The number of in-game minutes between each automatic Lust stimulus pulse.",
    scope: "world",
    config: true,
    default: 5,
    type: Number
  });

  game.settings.register("dungeons-and-degenerates-pf2e", SETTINGS.STIM_DECAY, {
    name: "Stimulation Decay Rate",
    hint: "Amount Stimulation decays per in-game minute.",
    scope: "world",
    config: true,
    default: 5,
    type: Number
  });
}

export function getSetting(key) {
  const value = game.settings.get("dungeons-and-degenerates-pf2e", key);
  if (typeof value === "number" && isNaN(value)) return 0;
  if (typeof value === "boolean") return Boolean(value);
  if (typeof value === "string") return value;
  return value;
}
