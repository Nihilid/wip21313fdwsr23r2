// Body Map Configuration for Xana

export const BODY_MAP = {
  abdomen: {
    covers: ["abdomen"],
    layers: [
      { tag: "wrap", coverage: 0.3 },
      { tag: "crop top", coverage: 0.4 },
      { tag: "cutout", coverage: 0.2 },
      { tag: "shirt", coverage: 0.8 },
      { tag: "suit", coverage: 1.0 }
    ]
  },
  head: { covers: [], slotTags: ["hat", "hood"] },
  chest: {
    covers: ["nipples"],
    layers: [
      { tag: "bra", coverage: 0.3 },
      { tag: "bikini", coverage: 0.4 },
      { tag: "shirt", coverage: 0.8 },
      { tag: "micro boobtube", coverage: 0.3 },
      { tag: "suit", coverage: 1.0 }
    ]
  },
  pelvis: {
    covers: ["genitals", "groin"],
    layers: [
      { tag: "panties", coverage: 0.3 },
      { tag: "bikini", coverage: 0.4 },
      { tag: "loincloth", coverage: 0.5 },
      { tag: "bottom", coverage: 0.7 },
      { tag: "micro bikini bottoms", coverage: 0.1 },
      { tag: "suit", coverage: 1.0 }
    ]
  },
  legs: {
    covers: ["thighs"],
    layers: [
      { tag: "pants", coverage: 1.0 },
      { tag: "leggings", coverage: 0.7 },
      { tag: "suit", coverage: 1.0 }
    ]
  },
  feet: { covers: [], layers: [] },
  arms: {
    covers: ["arms"],
    layers: [
      { tag: "sleeves", coverage: 0.6 },
      { tag: "bracers", coverage: 0.4 },
      { tag: "gauntlets", coverage: 0.5 },
      { tag: "suit", coverage: 1.0 }
    ]
  }
};

// This can be dynamically modified by users to add more body parts or layers.

export { BODY_MAP };
