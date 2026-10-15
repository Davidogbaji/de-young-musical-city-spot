import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
const prisma = new PrismaClient();
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const categories = ["Drums and Percussion","Acoustic and Electric Guitars","Keyboards and Digital Pianos","Bass Guitars","Microphones","Studio Recording Equipment","DJ Controllers and Mixers","Speakers and PA Systems","Amplifiers","Headphones and Accessories"];
const brands = ["Yamaha","Fender","Gibson","Roland","Shure","AKAI Professional","Pioneer DJ","Focusrite","JBL","Audio-Technica"];

// DEMONSTRATION DATA: prices and stock are made up. Replace via the admin dashboard.
const demo: [string, number, number, string][] = [
  ["Yamaha Acoustic Guitar", 85000, 6, "Acoustic and Electric Guitars"],
  ["Professional Drum Set", 420000, 2, "Drums and Percussion"],
  ["Electric Guitar", 150000, 4, "Acoustic and Electric Guitars"],
  ["Studio Microphone", 65000, 10, "Microphones"],
  ["DJ Mixer", 230000, 0, "DJ Controllers and Mixers"],
  ["Keyboard Piano", 180000, 3, "Keyboards and Digital Pianos"],
  ["Bass Guitar", 130000, 5, "Bass Guitars"],
  ["Studio Monitor Speakers (pair)", 210000, 3, "Studio Recording Equipment"],
  ["PA Speaker 15-inch", 175000, 7, "Speakers and PA Systems"],
  ["Guitar Amplifier", 95000, 0, "Amplifiers"],
  ["Studio Headphones", 38000, 12, "Headphones and Accessories"],
  ["USB Audio Interface", 98000, 8, "Studio Recording Equipment"],
];

async function main() {
  for (const [i, name] of categories.entries())
    await prisma.category.upsert({ where: { slug: slug(name) }, update: {}, create: { name, slug: slug(name), position: i } });
  for (const name of brands)
    await prisma.brand.upsert({ where: { slug: slug(name) }, update: {}, create: { name, slug: slug(name) } });

  for (const [name, price, stock, cat] of demo) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: slug(cat) } });
    await prisma.product.upsert({
      where: { slug: slug(name) },
      update: {},
      create: { name, slug: slug(name), price, stock, categoryId: category.id, isDemo: true, isFeatured: true,
        description: "Demonstration product. Replace with real details in the admin dashboard." },
    });
  }

  const settings: Record<string, string> = {
    whatsapp_number: "2348100090843",
    contact_email: "ogidithomasiji43@gmail.com",
    business_name: "De Young Musical and City Spot",
  };
  for (const [key, value] of Object.entries(settings))
    await prisma.siteSetting.upsert({ where: { key }, update: {}, create: { key, value } });

  const email = process.env.SEED_ADMIN_EMAIL, pw = process.env.SEED_ADMIN_PASSWORD;
  if (email && pw) {
    await prisma.user.upsert({
      where: { email }, update: {},
      create: { email, fullName: "Store Admin", role: "ADMIN", passwordHash: await bcrypt.hash(pw, 12) },
    });
    console.log("Admin account ready:", email);
  } else console.log("Skipped admin creation (set SEED_ADMIN_PASSWORD in .env to create one).");
  console.log("Seed complete.");
}
main().finally(() => prisma.$disconnect());
