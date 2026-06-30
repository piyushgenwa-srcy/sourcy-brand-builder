export type ProductCategory = {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
  backDescription: string;
};

export const PRODUCTS: ProductCategory[] = [
  {
    id: "hoodie",
    name: "Hoodie",
    description: "Premium heavyweight hoodie",
    icon: "shirt",
    prompt:
      "a premium heavyweight pullover hoodie, flat lay on marble surface, natural light, product photography",
    backDescription:
      "The back is completely plain — no logo, no text, just clean fabric from behind. Show the hood and the clean back panel.",
  },
  {
    id: "tee",
    name: "T-Shirt",
    description: "Classic cotton tee",
    icon: "shirt",
    prompt:
      "a classic cotton crew-neck t-shirt, flat lay on marble surface, natural light, product photography",
    backDescription:
      "The back is completely plain — no print, no logo, just clean blank fabric. Show the back collar and clean back panel.",
  },
  {
    id: "cap",
    name: "Cap",
    description: "Structured dad cap",
    icon: "hard-hat",
    prompt:
      "a structured baseball cap / dad hat, front view on clean background, product photography",
    backDescription:
      "The back of the cap showing the adjustable snapback or buckle closure hardware and back panel. No logo on the back — just the strap and clean fabric panels.",
  },
  {
    id: "tote",
    name: "Tote Bag",
    description: "Heavy canvas tote",
    icon: "shopping-bag",
    prompt:
      "a heavy duty canvas tote bag, flat lay on marble surface, natural light, product photography",
    backDescription:
      "The back is plain canvas — no print, no logo, just clean natural canvas. Same texture and color as the front, with the handles visible.",
  },
  {
    id: "bottle",
    name: "Water Bottle",
    description: "Insulated steel bottle",
    icon: "cup-soda",
    prompt:
      "a sleek insulated stainless steel water bottle, standing upright on clean surface, product photography",
    backDescription:
      "The back of the bottle (180° opposite side from the logo) — clean cylindrical stainless steel form with no branding on this side. Show the lid and clean body.",
  },
  {
    id: "notebook",
    name: "Notebook",
    description: "Hardcover journal",
    icon: "book-open",
    prompt:
      "a premium hardcover notebook journal, slightly open on marble surface, product photography",
    backDescription:
      "The back cover of the notebook — plain, clean, matching the front cover material and color. No logo on the back. Show the spine and back cover texture.",
  },
  {
    id: "sticker-kit",
    name: "Sticker Kit",
    description: "Die-cut sticker pack",
    icon: "sticker",
    prompt:
      "a set of die-cut vinyl stickers arranged on a flat surface, colorful brand sticker pack, product photography",
    backDescription:
      "The stickers spread and fanned out differently to show variety, with some sticker backing paper visible showing the die-cut vinyl quality and shape variety.",
  },
  {
    id: "founder-kit",
    name: "Founder Kit",
    description: "The ultimate swag box",
    icon: "package",
    prompt:
      "an elegant branded gift box containing a hoodie, notebook, water bottle, and stickers, premium unboxing experience, product photography",
    backDescription:
      "The gift box fully open from a top-down angle, showing the branded items inside neatly arranged with tissue paper — the unboxing experience.",
  },
];
