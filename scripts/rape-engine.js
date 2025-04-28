import { logDebug } from "./utils.js";
import { EventSystem } from "./event-system.js";

export class RapeEngine {
  static async fondle(sourceToken, targetToken) {
    if (!sourceToken?.actor || !targetToken?.actor) return;

    logDebug(`[RapeEngine] Fondle initiated: ${sourceToken.name} -> ${targetToken.name}`);

    // Fire fondle event
    EventSystem.trigger("fondle", { sourceToken, targetToken });
  }

  static async rape(sourceToken, targetToken) {
    if (!sourceToken?.actor || !targetToken?.actor) return;

    logDebug(`[RapeEngine] Rape initiated: ${sourceToken.name} -> ${targetToken.name}`);

    // Fire rape event
    EventSystem.trigger("rape", { sourceToken, targetToken });

    // Fire arousal increase
    EventSystem.trigger("arousal.increase", { targetToken, amount: 20 });

    // Fire effect apply
    EventSystem.trigger("effect.apply", { targetToken, type: "raped" });

    // Fire pregnancy risk
    EventSystem.trigger("fertility.check", { sourceToken, targetToken });
  }

  static async wombfuck(sourceToken, targetToken) {
    if (!sourceToken?.actor || !targetToken?.actor) return;

    logDebug(`[RapeEngine] Wombfuck initiated: ${sourceToken.name} -> ${targetToken.name}`);

    // Fire wombfuck event
    EventSystem.trigger("wombfuck", { sourceToken, targetToken });

    // Fire arousal increase
    EventSystem.trigger("arousal.increase", { targetToken, amount: 40 });

    // Fire effect apply
    EventSystem.trigger("effect.apply", { targetToken, type: "wombfucked" });

    // Fire pregnancy risk
    EventSystem.trigger("fertility.check", { sourceToken, targetToken });
  }
}
