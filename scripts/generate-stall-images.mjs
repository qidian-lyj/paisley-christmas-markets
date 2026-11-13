/**
 * Generates themed SVG illustrations for every stall in public/images/stalls.
 * Run:  node scripts/generate-stall-images.mjs
 * Images are generated, not photographed, so the PoC works offline and has
 * no hotlinking/licensing risk. Swap with real photos later by changing
 * the seed rows' image_url values.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "images", "stalls");
mkdirSync(outDir, { recursive: true });

const CATEGORIES = {
  food: { accent: "#c2392e", emoji: ["🥐", "🌭", "🧇", "🌰"] },
  drink: { accent: "#e8b84b", emoji: ["🍷", "☕", "🍎", "🥤"] },
  crafts: { accent: "#2d8556", emoji: ["🎄", "🪵", "🧵", "🏺"] },
  gifts: { accent: "#e8b84b", emoji: ["🧣", "🖼️", "🍬", "🎁"] },
  charity: { accent: "#c2392e", emoji: ["🥫", "🚤", "🧸", "🥣"] },
  other: { accent: "#f2d489", emoji: ["🎀", "🎅", "🎨", "🎠"] },
};

// Deterministic pseudo-random so every image is stable between runs.
function makeRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function buildSvg(category, emoji, seed) {
  const rand = makeRandom(seed);
  const accent = CATEGORIES[category].accent;

  // Snowfall dots
  let snow = "";
  for (let i = 0; i < 34; i++) {
    const x = Math.round(rand() * 780 + 10);
    const y = Math.round(rand() * 520 + 20);
    const r = (rand() * 4 + 1.6).toFixed(1);
    const o = (rand() * 0.22 + 0.08).toFixed(2);
    snow += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fbfaf6" opacity="${o}"/>`;
  }

  // Fairy-light garland across the top
  const bulbColors = ["#e8b84b", "#c2392e", "#f2d489", accent];
  let bulbs = "";
  let line = "";
  for (let x = 30; x <= 770; x += 62) {
    const y = 84 + Math.round(22 * Math.sin(x / 105));
    line += `${line ? "L" : "M"}${x},${y} `;
    const color = bulbColors[(x / 62) % bulbColors.length | 0];
    bulbs += `<circle cx="${x}" cy="${y + 12}" r="9" fill="${color}"/><circle cx="${x - 3}" cy="${y + 9}" r="3" fill="#fbfaf6" opacity="0.65"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" role="img">
  <rect width="800" height="600" fill="#185236"/>
  <ellipse cx="400" cy="660" rx="560" ry="160" fill="#fbfaf6" opacity="0.07"/>
  ${snow}
  <path d="${line}" fill="none" stroke="#0e3d27" stroke-width="3"/>
  ${bulbs}
  <text x="400" y="392" text-anchor="middle" font-family="'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif" font-size="230">${emoji}</text>
  <text x="400" y="548" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-style="italic" font-size="26" fill="#e8b84b">Paisley Christmas Markets</text>
</svg>
`;
}

let count = 0;
for (const [category, def] of Object.entries(CATEGORIES)) {
  def.emoji.forEach((emoji, i) => {
    const file = join(outDir, `${category}-${i + 1}.svg`);
    writeFileSync(file, buildSvg(category, emoji, i + 1 + Object.keys(CATEGORIES).indexOf(category) * 10));
    count++;
  });
}
console.log(`Generated ${count} stall illustrations in public/images/stalls`);
