// flavor-engine.js
import { getWhisperOrgasmMessages } from "./settings.js";
import { playCummingAudio, playEjaculatingAudio } from "./sound-engine.js"; // New modular sound manager!

const MODULE_NAME = "dungeons-and-degenerates-pf2e";

export class FlavorEngine {
  /**
   * Sends orgasm chat message and triggers audio cues.
   * @param {Actor} actor 
   * @param {boolean} isEjaculating - true if male ejaculation, false if female orgasm
   */
  static async sendOrgasmMessage(actor, isEjaculating = false) {
    const lines = isEjaculating
      ? [
          `${actor.name} groans as they pump thick, hot baby-batter into their victim.`,
          `${actor.name} grunts, thrusting deep and filling their target with potent sperm.`,
          `${actor.name} shudders violently, unleashing a heavy load inside.`
        ]
      : [
          `${actor.name} cries out uncontrollably, lost in overwhelming climax!`,
          `${actor.name}'s body trembles, giving in to waves of intense pleasure.`,
          `${actor.name} arches their back, succumbing to euphoric orgasm!`
        ];

    const flavor = lines[Math.floor(Math.random() * lines.length)];

    await ChatMessage.create({
      content: flavor,
      whisper: getWhisperOrgasmMessages() ? [game.user.id] : undefined
    });

    // Play orgasm audio
    if (isEjaculating) {
      await playEjaculatingAudio(actor);
    } else {
      await playCummingAudio(actor);
    }
  }

  /**
   * Sends resistance success chat message.
   * @param {Actor} actor 
   */
  static async sendResistMessage(actor) {
    const lines = [
      `${actor.name} clenches their muscles, barely resisting climax.`,
      `${actor.name} shudders but manages to stave off orgasm.`,
      `${actor.name} gasps sharply, fighting against the urge to surrender to pleasure.`
    ];

    const flavor = lines[Math.floor(Math.random() * lines.length)];

    await ChatMessage.create({
      content: flavor,
      whisper: getWhisperOrgasmMessages() ? [game.user.id] : undefined
    });

    // (No sound effect needed for resisting, at least for now)
  }
}
