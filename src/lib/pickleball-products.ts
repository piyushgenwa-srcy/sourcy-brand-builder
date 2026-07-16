export type BagColor = {
  id: string;
  name: string;
  hex: string;
  /** Fabric/color/hardware description injected into the generation prompt. */
  descriptor: string;
};

/** Public path to a pre-generated, unbranded base shot for a design/colorway. */
export function bagImagePath(
  designId: string,
  colorId: string,
  view: "front" | "back"
): string {
  return `/pickleball/${designId}--${colorId}--${view}.png`;
}

export type BagDesign = {
  id: string;
  name: string;
  description: string;
  /** Which mood board this design belongs to. */
  collection: "Court-to-Café" | "Office-to-Court";
  /** Neutral, color-agnostic description of the bag's shape and construction. */
  silhouette: string;
  /** Where the logo naturally sits on this design. */
  logoPlacement: string;
  /** Plain, unbranded back view description. */
  backDescription: string;
  colors: BagColor[];
};

export const BAG_DESIGNS: BagDesign[] = [
  {
    id: "court-sling",
    name: "Court Sling Backpack",
    description: "Perforated sling with a built-in paddle pocket",
    collection: "Court-to-Café",
    silhouette:
      "a compact perforated neoprene sling backpack for pickleball, with a large scalloped front zip pocket sized to hold a paddle, a separate mesh side pocket for a water bottle, and an adjustable padded crossbody strap",
    logoPlacement:
      "a small embroidered logo on the top of the front paddle pocket, just above the zipper pull",
    backDescription:
      "the plain back panel of the sling backpack — padded mesh strap system and breathable back panel, no branding, same color throughout, no paddle pocket visible from this angle",
    colors: [
      {
        id: "aqua-teal",
        name: "Aqua Teal",
        hex: "#4FB8B0",
        descriptor:
          "aqua teal perforated neoprene body with a bright lime-yellow zipper and matching zip pull",
      },
      {
        id: "coral-sunset",
        name: "Coral Sunset",
        hex: "#F2775B",
        descriptor:
          "warm coral neoprene body with cream trim and tan drawcord details",
      },
      {
        id: "blush-pink",
        name: "Blush Pink",
        hex: "#F3C9D4",
        descriptor:
          "soft blush pink neoprene body with white piping and rose-gold hardware",
      },
    ],
  },
  {
    id: "scallop-tote",
    name: "Scallop Paddle Tote",
    description: "Canvas weekender with a paddle-shaped front pocket",
    collection: "Court-to-Café",
    silhouette:
      "a canvas weekender tote bag for pickleball with a scalloped paddle-shaped exterior pocket stitched onto the front in a contrasting color, dual padded shoulder straps, and a wide top zip opening",
    logoPlacement:
      "a small woven logo patch stitched at the base of the top handles",
    backDescription:
      "the plain back panel of the tote — smooth canvas exterior with no paddle pocket and no branding, matching the base color",
    colors: [
      {
        id: "ivory-rainbow",
        name: "Ivory Rainbow Stripe",
        hex: "#F6EFE3",
        descriptor:
          "ivory canvas body with candy-striped rainbow pastel webbing handles and a cream paddle-shaped pocket",
      },
      {
        id: "sky-checkerboard",
        name: "Sky Checkerboard",
        hex: "#BFD4E8",
        descriptor:
          "powder blue and white checkerboard print canvas with black webbing handles",
      },
      {
        id: "blossom-pink",
        name: "Blossom Pink",
        hex: "#F1B8C4",
        descriptor:
          "blossom pink canvas body with white piping and a cream paddle-shaped pocket",
      },
    ],
  },
  {
    id: "racket-panel-duffel",
    name: "Racket-Panel Duffel",
    description: "Crossbody duffel with a diagonal paddle color-block",
    collection: "Court-to-Café",
    silhouette:
      "a structured crossbody duffel bag with a large diagonal paddle-silhouette color-block panel across the front, twin top handles, and an adjustable detachable shoulder strap",
    logoPlacement:
      "a small embroidered logo tag on the corner of the paddle-shaped front panel",
    backDescription:
      "the plain back panel of the duffel — smooth fabric with no paddle panel and no branding, showing the back of the crossbody strap hardware",
    colors: [
      {
        id: "lavender-dream",
        name: "Lavender Dream",
        hex: "#C6B6E2",
        descriptor:
          "soft lavender purple body with a white diagonal paddle panel and silver hardware",
      },
      {
        id: "stone-lilac",
        name: "Stone & Lilac",
        hex: "#D7D2CF",
        descriptor:
          "warm stone grey body with a periwinkle lilac paddle panel and brushed silver hardware",
      },
      {
        id: "rose-quartz",
        name: "Rose Quartz",
        hex: "#EBC7CE",
        descriptor:
          "dusty rose body with an ivory paddle panel and gold hardware",
      },
    ],
  },
  {
    id: "paddle-backpack",
    name: "Paddle-Shaped Backpack",
    description: "A backpack shaped like an oversized paddle",
    collection: "Office-to-Court",
    silhouette:
      "a backpack literally shaped like an oversized pickleball paddle — a rounded paddle-face main compartment tapering to a padded handle grip, with two adjustable backpack straps, an exterior paddle-holder loop, and an insulated side pocket sized for a tumbler",
    logoPlacement:
      "a small embroidered logo centered on the paddle face, below the top grip",
    backDescription:
      "the plain back panel of the paddle-shaped backpack — padded adjustable straps and breathable mesh back panel, no branding",
    colors: [
      {
        id: "sage-quilted",
        name: "Sage Quilted",
        hex: "#9CAE8C",
        descriptor:
          "sage green quilted fabric with cream trim and tan leather-look accents",
      },
      {
        id: "onyx-tan",
        name: "Onyx & Tan",
        hex: "#2B2B2E",
        descriptor:
          "matte black quilted fabric with cognac tan leather-look trim",
      },
      {
        id: "ivory-navy",
        name: "Ivory & Navy",
        hex: "#EDE7DC",
        descriptor: "ivory quilted fabric with navy piping and trim",
      },
    ],
  },
  {
    id: "weekender-duffel",
    name: "Office Weekender Duffel",
    description: "Minimalist structured duffel, quiet-luxury finish",
    collection: "Office-to-Court",
    silhouette:
      "a minimalist structured weekender duffel bag with a small paddle-shaped zip front pocket, striped webbing top handles, and a clean boxy silhouette in a quiet-luxury style",
    logoPlacement:
      "a small embroidered logo on the front paddle-shaped zip pocket",
    backDescription:
      "the plain back panel of the weekender duffel — smooth structured fabric with no exterior pocket and no branding",
    colors: [
      {
        id: "ivory-navy-stripe",
        name: "Ivory & Navy Stripe",
        hex: "#F4F0E6",
        descriptor:
          "ivory structured canvas with navy striped webbing handles",
      },
      {
        id: "forest-cream",
        name: "Forest & Cream",
        hex: "#3C5442",
        descriptor:
          "deep forest green structured canvas with cream webbing handles",
      },
      {
        id: "charcoal-cognac",
        name: "Charcoal & Cognac",
        hex: "#3A3A3C",
        descriptor:
          "charcoal structured canvas with cognac leather-look handles",
      },
    ],
  },
];
