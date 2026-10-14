import { Brand, Category, Product } from "../types";

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// DEMONSTRATION DATA. Prices are made up. Shown only when the API is unreachable and VITE_USE_DEMO_FALLBACK is not "false".
const d = (id: number, name: string, price: number, stock: number, cat: string): Product => ({
  id, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  description: "Demonstration product.", price, oldPrice: null, stock, inStock: stock > 0, image: null, cat, isDemo: true,
});
export const DEMO_PRODUCTS: Product[] = [
  d(1, "Yamaha Acoustic Guitar", 85000, 6, "Acoustic and Electric Guitars"),
  d(2, "Professional Drum Set", 420000, 2, "Drums and Percussion"),
  d(3, "Electric Guitar", 150000, 4, "Acoustic and Electric Guitars"),
  d(4, "Studio Microphone", 65000, 10, "Microphones"),
  d(5, "DJ Mixer", 230000, 0, "DJ Controllers and Mixers"),
  d(6, "Keyboard Piano", 180000, 3, "Keyboards and Digital Pianos"),
  d(7, "Bass Guitar", 130000, 5, "Bass Guitars"),
  d(8, "Studio Monitor Speakers (pair)", 210000, 3, "Studio Recording Equipment"),
];
const c = (id: number, name: string): Category => ({ id, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") });
export const DEMO_CATEGORIES: Category[] = [
  "Drums and Percussion", "Acoustic and Electric Guitars", "Keyboards and Digital Pianos", "Bass Guitars", "Microphones",
  "Studio Recording Equipment", "DJ Controllers and Mixers", "Speakers and PA Systems", "Amplifiers", "Headphones and Accessories",
].map((n, i) => c(i + 1, n));
export const DEMO_BRANDS: Brand[] = ["Yamaha", "Fender", "Gibson", "Roland", "Shure", "AKAI Professional", "Pioneer DJ", "Focusrite", "JBL", "Audio-Technica"]
  .map((n, i) => ({ id: i + 1, name: n, slug: slugify(n) }));
