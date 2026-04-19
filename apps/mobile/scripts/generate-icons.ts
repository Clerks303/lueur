/**
 * Pure-JS icon generator. Emits cream (#FAF6EE) squares with a
 * geometric terracotta (#A8533A) "L" glyph at the sizes Expo + iOS +
 * Android expect. Zero native deps — pngjs is pure JavaScript.
 *
 *   pnpm --filter @lueur/mobile icons:gen
 *
 * When we want a typographically refined icon, swap this script for an
 * SVG→PNG renderer (resvg, sharp). The SVG sources in assets/*.svg are
 * the source of truth for future work; this script reproduces the same
 * visual concept in raster form without a renderer.
 */
import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PNG } from "pngjs";

const here = dirname(fileURLToPath(import.meta.url));
const assets = resolve(here, "../assets");

const CREAM = { r: 0xfa, g: 0xf6, b: 0xee, a: 0xff };
const TERRACOTTA = { r: 0xa8, g: 0x53, b: 0x3a, a: 0xff };

type Target = {
  out: string;
  size: number;
  /** How the L sits: full-bleed cream bg, or transparent (for adaptive foreground). */
  transparentBg: boolean;
  /** 0..1 — "L" size relative to the canvas. */
  glyphScale: number;
};

const targets: Target[] = [
  { out: "icon.png", size: 1024, transparentBg: false, glyphScale: 0.58 },
  { out: "adaptive-icon.png", size: 1024, transparentBg: true, glyphScale: 0.45 },
  { out: "splash.png", size: 2048, transparentBg: false, glyphScale: 0.14 },
];

function renderL(t: Target): Buffer {
  const png = new PNG({ width: t.size, height: t.size, colorType: 6 });
  const bg = t.transparentBg
    ? { r: 0, g: 0, b: 0, a: 0 }
    : CREAM;

  for (let y = 0; y < t.size; y++) {
    for (let x = 0; x < t.size; x++) {
      const idx = (t.size * y + x) << 2;
      png.data[idx] = bg.r;
      png.data[idx + 1] = bg.g;
      png.data[idx + 2] = bg.b;
      png.data[idx + 3] = bg.a;
    }
  }

  // Glyph "L": one vertical stroke + one horizontal stroke at the bottom.
  const glyphHeight = Math.round(t.size * t.glyphScale);
  const strokeWidth = Math.round(glyphHeight * 0.17);
  const glyphX = Math.round((t.size - glyphHeight * 0.62) / 2);
  const glyphY = Math.round((t.size - glyphHeight) / 2);
  const vTop = glyphY;
  const vBottom = glyphY + glyphHeight;
  const hLeft = glyphX;
  const hRight = glyphX + Math.round(glyphHeight * 0.62);

  const stamp = (x: number, y: number): void => {
    if (x < 0 || x >= t.size || y < 0 || y >= t.size) return;
    const idx = (t.size * y + x) << 2;
    png.data[idx] = TERRACOTTA.r;
    png.data[idx + 1] = TERRACOTTA.g;
    png.data[idx + 2] = TERRACOTTA.b;
    png.data[idx + 3] = TERRACOTTA.a;
  };

  // Vertical stroke.
  for (let y = vTop; y < vBottom; y++) {
    for (let x = glyphX; x < glyphX + strokeWidth; x++) stamp(x, y);
  }
  // Horizontal stroke on the baseline.
  for (let y = vBottom - strokeWidth; y < vBottom; y++) {
    for (let x = hLeft; x < hRight; x++) stamp(x, y);
  }

  return PNG.sync.write(png, { colorType: 6, deflateLevel: 9 });
}

async function main(): Promise<void> {
  for (const t of targets) {
    const buf = renderL(t);
    await writeFile(resolve(assets, t.out), buf);
    console.log(`✓ ${t.out} (${t.size}×${t.size})`);
  }
}

main().catch((err) => {
  console.error("icon generation failed:", err);
  process.exit(1);
});
