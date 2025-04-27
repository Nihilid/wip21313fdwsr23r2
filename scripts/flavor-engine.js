// flavor-engine.js

import { BODY_REGIONS } from "./attire-bodymap.js";
import { playCummingAudio, playEjaculatingAudio } from "./sound-engine.js";

const MODULE_NAME = "dungeons-and-degenerates-pf2e";

export class FlavorEngine {
  /**
   * Play wardrobe malfunction chat flavor when clothing slips.
   * @param {Actor} actor 
   * @param {string} regionId 
   */
  static async playWardrobeMalfunctionFlavor(actor, regionId) {
    if (!actor || !regionId) return;

    const regionLabel = BODY_REGIONS[regionId.toUpperCase()]?.label || regionId;

    const flavorTemplates = {
      chest: [
        `${actor.name}'s chest covering slips dangerously low, revealing bare skin!`,
        `${actor.name}'s top shifts, baring a teasing view of their chest!`
      ],
      groin: [
        `${actor.name}'s groin covering strains and slips, dangerously exposing intimate areas!`,
        `${actor.name}'s lower garments slip just enough to reveal an enticing glimpse!`
      ],
      ass: [
        `${actor.name}'s attire clings tighter before riding up, leaving their ass almost bare!`,
        `${actor.name}'s rear is briefly bared as their clothing struggles to stay in place!`
      ],
      abdomen: [
        `${actor.name}'s midriff is revealed as their clothing slides upward!`,
        `${actor.name}'s stomach becomes exposed, skin glistening with effort!`
      ],
      thighs: [
        `${actor.name}'s clothing shifts along their thighs, flashing bare skin!`,
        `${actor.name}'s outfit rides higher, exposing more of their thighs!`
      ]
    };

    const possibleFlavors = flavorTemplates[regionId] || [
      `${actor.name}'s outfit slips precariously!`
    ];

    const flavorText = possibleFlavors[Math.floor(Math.random() * possibleFlavors.length)];

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<i>${flavorText}</i>`,
      type: CONST.CHAT_MESSAGE_TYPES.EMOTE
    });

    console.log(`[D&Degenerates] 🎭 Wardrobe malfunction flavor triggered: ${flavorText}`);
  }

  /**
   * Play orgasm audio for the actor based on gender.
   * @param {Actor} actor 
   */
    if (isEjaculating) {
      await playEjaculatingAudio(actor);
    } else {
      await playCummingAudio(actor);
    }
  }
}
