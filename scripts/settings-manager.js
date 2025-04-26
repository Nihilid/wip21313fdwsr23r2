// settings-manager.js
// Centralized interface for accessing and updating system settings

import { MODULE_ID } from './settings.js';
import { logDebug } from './utils.js';

export function getSetting(key) {
  try {
    return game.settings.get(MODULE_ID, key);
  } catch (error) {
    logDebug(`❌ Failed to get setting '${key}':`, error);
    return undefined;
  }
}

export function setSetting(key, value) {
  try {
    return game.settings.set(MODULE_ID, key, value);
  } catch (error) {
    logDebug(`❌ Failed to set setting '${key}' to '${value}':`, error);
  }
}

export function registerSettings(definitions = []) {
  for (const def of definitions) {
    try {
      game.settings.register(MODULE_ID, def.name, def);
    } catch (error) {
      logDebug(`❌ Failed to register setting '${def.name}':`, error);
    }
  }
}

// Optional: utility to get all current values
export function getAllSettings(keys = []) {
  return keys.reduce((acc, key) => {
    acc[key] = getSetting(key);
    return acc;
  }, {});
}
