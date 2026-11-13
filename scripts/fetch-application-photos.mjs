// One-off: find a relevant Commons photo for each pending application.
import { writeFileSync } from "node:fs";

const UA = "PaisleyChristmasMarkets-PoC/1.0 (student coursework, UWS COMP10020)";

const APPS = [
  { name: "Loch Lomond Honey Farm", queries: ["honey jar honeycomb", "jar of honey"], avoid: ["bear"] },
  { name: "Churros del Sol", queries: ["churros chocolate", "churros"], avoid: [] },
  { name: "Argyll Leathercraft", queries: ["leather craft handmade", "leather workshop tools"], avoid: ["jacket"] },
  { name: "Silver & Selkie Jewellery", queries: ["handmade silver jewellery", "silver ring handmade"], avoid: ["spring"] },
  { name: "Prosecco & Frost Bar", queries: ["prosecco glass", "prosecco bottle"], avoid: ["crate"] },
  { name: "Storytelling Yurt", queries: ["yurt interior", "yurt mongolia"], avoid: ["map"] },
];

async function searchCommons(query) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json" +
    "&generator=search&gsrnamespace=6&gsrlimit=10" +
    `&gsrsearch=${encodeURIComponent("filetype:bitmap " + query)}` +
    "&prop=imageinfo&iiprop=url%7Cmime%7Cextmetadata&iiurlwidth=1200";
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  return Object.values(data?.query?.pages ?? {})
    .map((p) => ({ title: p.title.replace(/^File:/, ""), info: p.imageinfo?.[0] }))
    .filter((p) => p.info && p.info.mime === "image/jpeg" && p.info.thumburl);
}

async function verify(url) {
  return (await fetch(url, { headers: { "User-Agent": UA } })).ok;
}

function stripTags(html) {
  return (html || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function sqlEsc(v) {
  return v.replace(/'/g, "''");
}

const out = [];
for (const app of APPS) {
  const keywords = app.queries[0].toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const pool = [];
  for (const query of app.queries) {
    let candidates = [];
    try {
      candidates = await searchCommons(query);
    } catch (e) {
      console.log(`SEARCH-FAIL ${app.name} "${query}": ${e.message}`);
      continue;
    }
    const ranked = candidates
      .filter((c) => !app.avoid.some((bad) => c.title.toLowerCase().includes(bad)))
      .map((c) => ({
        ...c,
        score: keywords.filter((w) => c.title.toLowerCase().includes(w)).length,
      }))
      .sort((a, b) => b.score - a.score);
    for (const c of ranked) {
      if (await verify(c.info.thumburl)) {
        pool.push({ title: c.title, url: c.info.thumburl, score: c.score });
        break;
      }
    }
    if (pool.length && pool[0].score >= 1) break;
  }
  if (pool.length) {
    pool.sort((a, b) => b.score - a.score);
    out.push({ name: app.name, ...pool[0] });
    console.log(`OK  ${app.name} -> ${pool[0].title} (score ${pool[0].score})`);
  } else {
    console.log(`MISS ${app.name}`);
  }
}

const sql = out
  .map(
    (r) =>
      `update public.applications set image_url = '${sqlEsc(r.url)}'\nwhere business_name = '${sqlEsc(r.name)}' and status = 'pending';`
  )
  .join("\n\n");
writeFileSync("supabase/application-photo-updates.sql", sql + "\n", "utf8");
console.log("\nwrote supabase/application-photo-updates.sql (" + out.length + " updates)");
