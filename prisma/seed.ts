import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const products = [
  {
    name: "Asad",
    brand: "Lattafa",
    slug: "lattafa-asad",
    description:
      "Fragancia intensa y masculina inspirada en el poder del león. Notas amaderadas con un toque especiado que deja una estela imponente. Alta duración y proyección.",
    notes: "Pimienta negra, Piña, Bergamota, Ámbar, Vainilla, Cuero",
    gender: "Masculino",
    price: 179,
    compareAt: 249,
    stock: 20,
    imageUrl:
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&q=80",
    featured: true,
  },
  {
    name: "Yara",
    brand: "Lattafa",
    slug: "lattafa-yara",
    description:
      "El favorito femenino. Dulce, cremoso y adictivo, con notas gourmand que enamoran. Perfecto para uso diario con una fijación que dura todo el día.",
    notes: "Orquídea, Heliotropo, Frutas tropicales, Vainilla, Almizcle, Sándalo",
    gender: "Femenino",
    price: 169,
    compareAt: 229,
    stock: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&q=80",
    featured: true,
  },
  {
    name: "Khamrah",
    brand: "Lattafa",
    slug: "lattafa-khamrah",
    description:
      "Una experiencia gourmand de lujo. Cálido, dulce y especiado, ideal para las noches. De los más vendidos por su estela envolvente y sofisticada.",
    notes: "Canela, Dátil, Nuez moscada, Praliné, Vainilla, Tonka, Mirra",
    gender: "Unisex",
    price: 199,
    compareAt: 279,
    stock: 15,
    imageUrl:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=80",
    featured: true,
  },
  {
    name: "Club de Nuit Intense Man",
    brand: "Armaf",
    slug: "armaf-club-de-nuit-intense",
    description:
      "El clon legendario de un clásico de lujo. Fresco, potente y elegante. Una de las mejores relaciones calidad-precio del mundo de la perfumería.",
    notes: "Piña, Limón, Grosella negra, Abedul, Jazmín, Almizcle, Vainilla",
    gender: "Masculino",
    price: 189,
    compareAt: 259,
    stock: 18,
    imageUrl:
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80",
    featured: false,
  },
  {
    name: "Fakhar Rose",
    brand: "Lattafa",
    slug: "lattafa-fakhar-rose",
    description:
      "Elegancia floral con carácter. Rosa envuelta en frutas y almizcle para una presencia refinada y moderna. Ideal para la mujer segura de sí misma.",
    notes: "Rosa, Frutas, Geranio, Almizcle blanco, Pachulí",
    gender: "Femenino",
    price: 159,
    compareAt: 219,
    stock: 12,
    imageUrl:
      "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=600&q=80",
    featured: false,
  },
  {
    name: "Badee Al Oud Amethyst",
    brand: "Lattafa",
    slug: "lattafa-badee-al-oud-amethyst",
    description:
      "Oud puro y lujoso con un toque frutal. Una fragancia unisex profunda y misteriosa que evoca el auténtico lujo del Medio Oriente.",
    notes: "Frutas rojas, Oud, Azafrán, Rosa, Pachulí, Ámbar",
    gender: "Unisex",
    price: 209,
    compareAt: 289,
    stock: 10,
    imageUrl:
      "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=600&q=80",
    featured: true,
  },
];

async function main() {
  console.log("🌱 Sembrando base de datos...");

  // Configuracion inicial
  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      storeName: "Aroma de Reyes",
      notifyPhone: "51987654321",
      shippingCost: 0,
      freeShippingFrom: 165,
    },
  });

  // Usuario admin
  const adminPass = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@aroma.pe" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@aroma.pe",
      password: adminPass,
      role: "ADMIN",
    },
  });

  // Usuario vendedor
  const vendPass = await bcrypt.hash("vendedor123", 10);
  await prisma.user.upsert({
    where: { email: "vendedor@aroma.pe" },
    update: {},
    create: {
      name: "Vendedor",
      email: "vendedor@aroma.pe",
      password: vendPass,
      role: "VENDEDOR",
    },
  });

  // Productos
  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }

  console.log("✅ Listo!");
  console.log("   Admin:    admin@aroma.pe / admin123");
  console.log("   Vendedor: vendedor@aroma.pe / vendedor123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
