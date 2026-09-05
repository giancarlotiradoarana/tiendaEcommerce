import sharp from "sharp";
import { writeFileSync } from "fs";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" rx="96" fill="#0B0B0F"/>
  <text x="50%" y="54%" font-size="300" text-anchor="middle" dominant-baseline="middle">👑</text>
  <text x="50%" y="82%" font-family="Georgia, serif" font-size="52" fill="#C9A24B" text-anchor="middle" font-weight="bold">AROMA</text>
</svg>`;

const png = await sharp(Buffer.from(svg)).png().toBuffer();
writeFileSync("public/icon.png", png);
console.log("✅ icon.png creado");
