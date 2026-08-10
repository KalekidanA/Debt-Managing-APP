import sharp from "sharp";
import { mkdirSync } from "fs";

mkdirSync("assets", { recursive: true });

const jobs = [
  ["assets/icon-source.svg", "assets/icon.png", 1024],
  ["assets/icon-foreground.svg", "assets/icon-foreground.png", 1024],
  ["assets/icon-background.svg", "assets/icon-background.png", 1024],
  ["assets/splash-source.svg", "assets/splash.png", 2732],
  ["assets/splash-source.svg", "assets/splash-dark.png", 2732],
];

for (const [src, out, size] of jobs) {
  await sharp(src, { density: 384 }).resize(size, size).png().toFile(out);
  console.log(`wrote ${out}`);
}
