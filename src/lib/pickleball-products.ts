export type ColorOption = {
  id: string;
  name: string;
  hex: string;
  /** Color description injected into the generation prompt. */
  descriptor: string;
};

export type MaterialOption = {
  id: string;
  name: string;
  /** Fabric/texture description injected into the generation prompt. */
  descriptor: string;
};

export type BagDesign = {
  id: string;
  name: string;
  description: string;
  exwPrice: number;
  moq: number;
  /** Where the logo naturally sits on this design. */
  logoPlacement: string;
  /** Used only when no real back photo exists, to help the model infer a back view. */
  backDescription: string;
  /** Whether a real supplier back-angle photo exists for this design. */
  hasBackPhoto: boolean;
  colors: ColorOption[];
  materials: MaterialOption[];
};

/** Public path to the real supplier reference photo for a design. */
export function referenceImagePath(
  designId: string,
  view: "front" | "back"
): string {
  return `/pickleball/reference/${designId}--${view}.png`;
}

export const BAG_DESIGNS: BagDesign[] = [
  {
    id: "white-paddle-backpack",
    name: "Quilted Court Backpack",
    description: "Teardrop paddle-shaped backpack with dual side pockets",
    exwPrice: 12,
    moq: 50,
    logoPlacement: "a small embroidered logo on the upper front zip pocket",
    backDescription:
      "the plain back panel — padded mesh straps with a hanging hook, breathable mesh back panel, no branding",
    hasBackPhoto: true,
    colors: [
      { id: "ivory", name: "Ivory", hex: "#F1EADF", descriptor: "ivory/cream" },
      { id: "sage", name: "Sage Green", hex: "#9CAE8C", descriptor: "sage green" },
      { id: "black", name: "Black", hex: "#212223", descriptor: "matte black" },
    ],
    materials: [
      { id: "quilted", name: "Quilted Puffer", descriptor: "quilted diamond-stitch puffer nylon" },
      { id: "smooth-nylon", name: "Smooth Nylon", descriptor: "smooth matte nylon" },
      { id: "ripstop", name: "Ripstop Nylon", descriptor: "textured ripstop nylon" },
    ],
  },
  {
    id: "pink-paddle-case",
    name: "Paddle Cover Sling",
    description: "Molded paddle case with an adjustable crossbody strap",
    exwPrice: 2.6,
    moq: 50,
    logoPlacement:
      "a small embroidered or debossed logo centered on the front face, replacing the placeholder branding",
    backDescription:
      "the plain back panel of the paddle case — a single flat exterior pocket, same color and material, no branding",
    hasBackPhoto: true,
    colors: [
      { id: "pink", name: "Pink", hex: "#F2A0B5", descriptor: "bubblegum pink" },
      { id: "sky-blue", name: "Sky Blue", hex: "#9CC7E8", descriptor: "sky blue" },
      { id: "black", name: "Black", hex: "#212223", descriptor: "matte black" },
    ],
    materials: [
      { id: "neoprene", name: "Neoprene", descriptor: "smooth molded neoprene" },
      { id: "eva-shell", name: "EVA Hard Shell", descriptor: "rigid molded EVA shell" },
      { id: "ripstop", name: "Ripstop Nylon", descriptor: "textured ripstop nylon" },
    ],
  },
  {
    id: "camel-weekender-backpack",
    name: "Weekender Backpack Tote",
    description: "Structured backpack-tote hybrid with a shoe compartment",
    exwPrice: 12.32,
    moq: 50,
    logoPlacement: "a small embroidered logo on the front zip pocket, below the top stripe",
    backDescription:
      "the plain back panel — adjustable padded backpack straps with a hanging hook, no branding",
    hasBackPhoto: true,
    colors: [
      { id: "camel", name: "Camel", hex: "#B79363", descriptor: "warm camel tan" },
      { id: "navy", name: "Navy", hex: "#2C3550", descriptor: "deep navy" },
      { id: "black", name: "Black", hex: "#212223", descriptor: "matte black" },
    ],
    materials: [
      { id: "smooth-nylon", name: "Smooth Nylon", descriptor: "smooth matte nylon" },
      { id: "canvas", name: "Canvas", descriptor: "structured cotton canvas" },
      { id: "vegan-leather", name: "Vegan Leather", descriptor: "smooth vegan leather" },
    ],
  },
  {
    id: "green-racket-tote",
    name: "Racket-Pocket Tote",
    description: "Open tote with a zippered racket-shaped front pocket",
    exwPrice: 6.16,
    moq: 50,
    logoPlacement: "a small embroidered logo on the upper body, above the racket pocket",
    backDescription:
      "the plain back panel of the tote — smooth exterior with no racket pocket and no branding",
    hasBackPhoto: false,
    colors: [
      { id: "green", name: "Green", hex: "#2E9E5B", descriptor: "kelly green" },
      { id: "coral", name: "Coral", hex: "#F2775B", descriptor: "warm coral" },
      { id: "navy", name: "Navy", hex: "#2C3550", descriptor: "deep navy" },
    ],
    materials: [
      { id: "smooth-nylon", name: "Smooth Nylon", descriptor: "smooth matte nylon" },
      { id: "canvas", name: "Canvas", descriptor: "structured cotton canvas" },
      { id: "quilted", name: "Quilted Puffer", descriptor: "quilted diamond-stitch puffer nylon" },
    ],
  },
];
