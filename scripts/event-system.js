// event-system.js
// [D&Degenerates] Central Event System for Cross-Subsystem Communication

/**
 * Lightweight pub-sub event system.
 * Allows subsystems to emit and listen to events without direct dependencies.
 */
export const EventSystem = {
  _events: {},

  /**
   * Register a callback to a specific event.
   * @param {string} event - The name of the event.
   * @param {Function} callback - The callback to trigger.
   */
  on(event, callback) {
    if (!this._events[event]) this._events[event] = [];
    this._events[event].push(callback);
  },

  /**
   * Remove a callback from a specific event.
   * @param {string} event - The name of the event.
   * @param {Function} callback - The callback to remove.
   */
  off(event, callback) {
    if (!this._events[event]) return;
    this._events[event] = this._events[event].filter(cb => cb !== callback);
  },

  /**
   * Emit (trigger) a specific event.
   * @param {string} event - The name of the event.
   * @param {any} data - The data payload to pass to listeners.
   */
  emit(event, data = {}) {
    if (!this._events[event]) return;
    for (const callback of this._events[event]) {
      try {
        callback(data);
      } catch (error) {
        console.error(`[D&Degenerates] EventSystem callback error for event '${event}':`, error);
      }
    }
  },

  /**
   * Debugging utility: List all currently registered events and their listener counts.
   */
  listEvents() {
    console.log("[D&Degenerates] Current Event Registrations:",
      Object.entries(this._events).map(([event, listeners]) => ({ event, listeners: listeners.length }))
    );
  }
};

// Example usage (remove after integration):
// EventSystem.on("TestEvent", (data) => console.log("TestEvent received:", data));
// EventSystem.emit("TestEvent", { foo: "bar" });
