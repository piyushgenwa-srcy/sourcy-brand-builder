export type ProductCategory = {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
};

export const PRODUCTS: ProductCategory[] = [
  {
    id: "hoodie",
    name: "Hoodie",
    description: "Premium heavyweight hoodie",
    icon: "shirt",
    prompt:
      "a premium heavyweight pullover hoodie, flat lay on marble surface, natural light, product photography",
  },
  {
    id: "tee",
    name: "T-Shirt",
    description: "Classic cotton tee",
    icon: "shirt",
    prompt:
      "a classic cotton crew-neck t-shirt, flat lay on marble surface, natural light, product photography",
  },
  {
    id: "cap",
    name: "Cap",
    description: "Structured dad cap",
    icon: "hard-hat",
    prompt:
      "a structured baseball cap / dad hat, front view on clean background, product photography",
  },
  {
    id: "tote",
    name: "Tote Bag",
    description: "Heavy canvas tote",
    icon: "shopping-bag",
    prompt:
      "a heavy duty canvas tote bag, flat lay on marble surface, natural light, product photography",
  },
  {
    id: "bottle",
    name: "Water Bottle",
    description: "Insulated steel bottle",
    icon: "cup-soda",
    prompt:
      "a sleek insulated stainless steel water bottle, standing upright on clean surface, product photography",
  },
  {
    id: "notebook",
    name: "Notebook",
    description: "Hardcover journal",
    icon: "book-open",
    prompt:
      "a premium hardcover notebook journal, slightly open on marble surface, product photography",
  },
  {
    id: "sticker-kit",
    name: "Sticker Kit",
    description: "Die-cut sticker pack",
    icon: "sticker",
    prompt:
      "a set of die-cut vinyl stickers arranged on a flat surface, colorful brand sticker pack, product photography",
  },
  {
    id: "founder-kit",
    name: "Founder Kit",
    description: "The ultimate swag box",
    icon: "package",
    prompt:
      "an elegant branded gift box containing a hoodie, notebook, water bottle, and stickers, premium unboxing experience, product photography",
  },
];
