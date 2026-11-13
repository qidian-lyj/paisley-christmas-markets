/**
 * Finds a real, freely-licensed photo for each stall on Wikimedia Commons,
 * scores candidates by title relevance, verifies the URL works, then writes:
 *   - supabase/stall-photo-updates.sql  (UPDATE statements to run in Supabase)
 *   - docs/image-credits.md             (author + license per photo)
 *   - patches image_url values in supabase/schema.sql and patch-stall-images.sql
 *
 * Safe to re-run: previously assigned URLs are detected in schema.sql and
 * replaced in-place.
 *
 * Run:  node scripts/fetch-stall-photos.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// queries: tried in order. avoid: skip candidates whose title contains one of these.
const STALLS = [
  { name: "Highland Bakehouse", category: "food", description: "Stollen, waffles and festive bakes from the west coast.", queries: ["Christmas stollen"], avoid: [] },
  { name: "Bratwurst Haus", category: "food", description: "Flame-grilled bratwurst and currywurst with sauerkraut.", queries: ["currywurst", "grilled bratwurst sausage", "bratwurst sauerkraut"], avoid: ["kiosk", "stand", "closed", "snow", "sign", "hut"] },
  { name: "Wee Waffle Window", category: "food", description: "Fresh Liege waffles with chocolate or caramel dust.", queries: ["liege waffle sugar", "belgian waffle"], avoid: ["iron", "machine", "station"] },
  { name: "Roasty Chestnut Co.", category: "food", description: "Paper bags of hot roasted chestnuts, straight from the grill.", queries: ["file:Roasted chestnuts.jpg", "file:Calderroste.jpg", "file:Roasted chestnut vendor in Budapest.jpg"], avoid: ["corn", "seattle", "almond", "water"] },
  { name: "The Gluhwein Wagon", category: "drink", description: "Traditional mulled wine, apple punch and hot chocolate.", queries: ["mulled wine orange cinnamon", "Gluhwein orange", "christmas drinks"], avoid: ["becher", "mug", "empty", "dresden", "market", "stall"] },
  { name: "Bothy Hot Chocolate", category: "drink", description: "Velvet hot chocolate topped with marshmallow snow.", queries: ["hot chocolate whipped cream", "cup of hot chocolate"], avoid: ["cupcake"] },
  { name: "Mulled Cider Mill", category: "drink", description: "Warm Scottish cider steeped with spice and orange peel.", queries: ["apple cider glass", "christmas punch glass"], avoid: ["machine", "press", "squeeze"] },
  { name: "Kinderpunsch Stand", category: "drink", description: "Alcohol-free punch for the little ones, served steaming.", queries: ["Weihnachtspunsch", "fruit punch glasses", "punsch glas"], avoid: ["organ", "wanamaker", "court", "baracke", "kasse", "hut", "bottle", "empty"] },
  { name: "Gauze Glass Studio", category: "crafts", description: "Hand-blown glass baubles, made in Renfrewshire.", queries: ["glass Christmas baubles"], avoid: [] },
  { name: "Renfrewshire Woodcraft", category: "crafts", description: "Carved spoons, wands and ornaments from fallen local timber.", queries: ["wooden handmade christmas decoration", "wood carving hands workshop"], avoid: ["museum", "sculpture", "lion", "delhi", "ralphie", "cheer"] },
  { name: "Thistle & Thread", category: "crafts", description: "Embroidered decorations stitched in the Paisley pattern.", queries: ["hand embroidery hoop", "cross stitch embroidery"], avoid: ["huipil", "coban", "machine"] },
  { name: "Clay Bothy Pottery", category: "crafts", description: "Hand-thrown mugs and little villages of ceramic houses.", queries: ["potter throwing clay hands", "pottery wheel hands", "potter at work"], avoid: ["psm", "old fashioned", "engraving", "drawing", "nigeria", "science", "monthly"] },
  { name: "Wee Woolly Knits", category: "gifts", description: "Scottish wool hats, scarves and mittens.", queries: ["hand knitted mittens", "knitted mittens pair"], avoid: ["19th century"] },
  { name: "Paisley Pattern Printworks", category: "gifts", description: "Prints and teatowels celebrating the famous Paisley pattern.", queries: ["paisley pattern", "paisley design textile"], avoid: ["abbey", "gargoyle", "cemetery", "town hall", "church"] },
  { name: "Sweetie Jar Emporium", category: "gifts", description: "Victorian jars filled with clootie dumpling fudge.", queries: ["pick and mix sweets", "old fashioned sweet shop", "candy jar"], avoid: ["cleveland", "sweetest day"] },
  { name: "Hamper & Hearth", category: "gifts", description: "Ready-made hampers of Scottish pantry treats.", queries: ["wiki:Hamper", "christmas gift basket", "food hamper"], avoid: ["inuit", "soldiers", "fort", "military", "cavalry", "captain", "cook", "voyages", "story"] },
  { name: "Paisley Foodbank", category: "charity", description: "Donate a tin, take a candy cane.", queries: ["foodbank collection", "food bank donation boxes"], avoid: ["kerry", "secretary"] },
  { name: "RNLI Christmas Appeal", category: "charity", description: "Lifeboat crew collecting for the Christmas appeal.", queries: ["RNLI lifeboat"], avoid: [] },
  { name: "Toy Collection Trolley", category: "charity", description: "Drop a new toy in the trolley for local families.", queries: ["wiki:Teddy bear", "teddy bear plush toy", "stuffed animals"], avoid: ["pope", "afb", "air force", "military", "navy", "fort bragg", "operation toy drop", "seaman"] },
  { name: "Mary's Meals Fundraiser", category: "charity", description: "Sponsor a school meal for a child with every donation.", queries: ["wiki:Bake sale", "bake sale", "cake stall market"], avoid: ["trafficking", "truckers", "osu", "clothing", "durham"] },
  { name: "The Wrapping Booth", category: "other", description: "Gifts wrapped in paper and ribbon while you shop.", queries: ["gift wrapping"], avoid: [] },
  { name: "Grotto Ticket Office", category: "other", description: "Book your slot to visit Santa in his grotto.", queries: ["Santa Claus Christmas market", "Weihnachtsmarkt Nikolaus"], avoid: [] },
  { name: "Face Painting by Fiona", category: "other", description: "Festive faces: snowflakes, reindeer and glitter.", queries: ["face painting girl", "face painting child"], avoid: ["steampunk", "body paint", "creature"] },
  { name: "Fairground Carousel", category: "other", description: "Traditional carousel rides beside the Abbey.", queries: ["Christmas market carousel"], avoid: [] },
  { name: "Poffertjes Parlour", category: "food", description: "Fluffy Dutch mini pancakes dusted with icing sugar.", queries: ["Poffertjes"], avoid: [] },
  { name: "Caramel Apple Stand", category: "food", description: "Crisp apples dipped in glossy caramel, made fresh daily.", queries: ["toffee apple", "caramel apple"], avoid: [] },
  { name: "Highland Gin Toddy", category: "drink", description: "Warm winter toddies with Scottish gin, honey and lemon.", queries: ["hot toddy", "whisky glass"], avoid: [] },
  { name: "Eggnog Nook", category: "drink", description: "Creamy eggnog served warm or chilled, topped with nutmeg.", queries: ["eggnog glass", "eggnog"], avoid: [] },
  { name: "Festive Wreath Workshop", category: "crafts", description: "Door wreaths woven from pine, holly and dried orange.", queries: ["Adventskranz", "Christmas wreath"], avoid: [] },
  { name: "Candlemakers' Corner", category: "crafts", description: "Beeswax candles rolled and dipped in front of you.", queries: ["file:Candlestock in Woodstock, NY - 55293583400.jpg", "file:Wax candle detail.jpg", "file:Dipping Candles, Riley's Farm, Oak Glen, CA 11-15 (22302310264).jpg", "hand dipped candles demonstration"], avoid: ["wall", "flame", "burning", "lit", "1927"] },
  { name: "Advent Calendar Attic", category: "gifts", description: "Fill-your-own advent calendars and countdown boxes.", queries: ["Advent calendar"], avoid: [] },
  { name: "Mistletoe & Holly Bunches", category: "gifts", description: "Fresh mistletoe and holly bunches, tied to order.", queries: ["mistletoe bunch", "holly berries sprig", "ilex aquifolium berries"], avoid: ["tree"] },
  { name: "Salvation Army Band", category: "charity", description: "Carols from the Salvation Army band, collecting for the appeal.", queries: ["Salvation Army band", "brass band christmas"], avoid: [] },
  { name: "Guide Dogs Collection", category: "charity", description: "Meet the puppies in training and support the guide dogs.", queries: ["guide dog puppy", "guide dog training"], avoid: [] },
  { name: "Open-Air Ice Rink Tickets", category: "other", description: "Book a skate session on the open-air rink beside the Abbey.", queries: ["Eisbahn Weihnachtsmarkt", "ice rink christmas market", "wiki:Ice rink"], avoid: ["lake", "mountain", "alps", "frozen", "presseggersee"] },
  { name: "Christmas Lights Trail", category: "other", description: "Pick up the map for the illuminated trail through town.", queries: ["Christmas lights street", "christmas lights house"], avoid: [] },
];

const UA =
  "PaisleyChristmasMarkets-PoC/1.0 (student coursework, UWS COMP10020; contact: student@example.com)";

function stripTags(html) {
  return (html || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function sqlEsc(value) {
  return value.replace(/'/g, "''");
}

async function searchCommons(query) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json" +
    "&generator=search&gsrnamespace=6&gsrlimit=12" +
    `&gsrsearch=${encodeURIComponent("filetype:bitmap " + query)}` +
    "&prop=imageinfo&iiprop=url%7Cmime%7Cextmetadata&iiurlwidth=1200";
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`API ${res.status} for "${query}"`);
  const data = await res.json();
  const pages = Object.values(data?.query?.pages ?? {});
  return pages
    .map((p) => ({ title: p.title, info: p.imageinfo?.[0] }))
    .filter((p) => p.info && p.info.mime === "image/jpeg" && p.info.thumburl);
}

async function verify(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  return res.ok;
}

// "file:Title.jpg" — look up one exact Commons file by title (hand-picked).
async function fileInfo(fileTitle) {
  const clean = fileTitle.startsWith("File:") ? fileTitle : "File:" + fileTitle;
  const res = await fetch(
    "https://commons.wikimedia.org/w/api.php?action=query&format=json" +
      `&titles=${encodeURIComponent(clean)}` +
      "&prop=imageinfo&iiprop=url%7Cmime%7Cextmetadata&iiurlwidth=1200",
    { headers: { "User-Agent": UA } }
  );
  if (!res.ok) return null;
  const pages = Object.values((await res.json())?.query?.pages ?? {});
  const info = pages[0]?.imageinfo?.[0];
  if (!info || info.mime !== "image/jpeg") return null;
  if (!(await verify(info.thumburl))) return null;
  const meta = info.extmetadata ?? {};
  return {
    title: clean.replace(/^File:/, ""),
    url: info.thumburl,
    page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(clean).replace(/%3A/g, ":")}`,
    author: stripTags(meta.Artist?.value) || "Unknown author",
    license: stripTags(meta.LicenseShortName?.value) || "See Commons",
  };
}

// "wiki:Article" — use the lead image of an English Wikipedia article.
// These are curated, so they are the most reliable choice for generic themes.
async function wikiLeadImage(article) {
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(article)}`,
    { headers: { "User-Agent": UA } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  let base = (data.originalimage?.source || data.thumbnail?.source || "").split("?")[0];
  if (!base) return null;
  // Wikimedia only serves a set of standard thumbnail widths.
  let url = null;
  for (const width of [1280, 960, 500, 330]) {
    const candidate = base.replace(/\/(\d+)px-/, `/${width}px-`);
    if (await verify(candidate)) {
      url = candidate;
      break;
    }
  }
  if (!url) return null;

  const segment = decodeURIComponent(url.split("/").pop() || "");
  const fileTitle = "File:" + segment.replace(/^\d+px-/, "");
  let author = "Via Wikipedia";
  let license = "See Commons";
  let page = `https://en.wikipedia.org/wiki/${encodeURIComponent(article)}`;
  let title = fileTitle.replace(/^File:/, "");

  const metaRes = await fetch(
    "https://commons.wikimedia.org/w/api.php?action=query&format=json" +
      `&titles=${encodeURIComponent(fileTitle)}` +
      "&prop=imageinfo&iiprop=extmetadata",
    { headers: { "User-Agent": UA } }
  );
  if (metaRes.ok) {
    const pages = Object.values((await metaRes.json())?.query?.pages ?? {});
    const meta = pages[0]?.imageinfo?.[0]?.extmetadata ?? {};
    author = stripTags(meta.Artist?.value) || author;
    license = stripTags(meta.LicenseShortName?.value) || license;
    page = `https://commons.wikimedia.org/wiki/${encodeURIComponent(fileTitle).replace(/%3A/g, ":")}`;
  }
  return { title, url, page, author, license };
}

// Rebuild the current name -> image_url map from schema.sql (handles SVG
// paths from the first run and photo URLs from previous fetch runs).
function currentUrlMap() {
  const map = {};
  const schemaPath = join(root, "supabase", "schema.sql");
  if (!existsSync(schemaPath)) return map;
  const text = readFileSync(schemaPath, "utf8");
  const rowRe =
    /\(1, '((?:[^']|'')*)', '([a-z]+)',\s*\n\s+'((?:[^']|'')*)', true,\s*\n\s+'(.+?)'\)/g;
  let m;
  while ((m = rowRe.exec(text)) !== null) {
    // Values escape single quotes as '', unescape for the lookup key.
    map[m[1].replace(/''/g, "'")] = m[4];
  }
  return map;
}

function patchSqlFiles(results, previousUrls) {
  for (const file of ["schema.sql"]) {
    const full = join(root, "supabase", file);
    let text = readFileSync(full, "utf8");
    for (const r of results) {
      const old =
        previousUrls[r.stall] ?? STALLS.find((s) => s.name === r.stall).path;
      text = text.split(old).join(sqlEsc(r.url));
    }
    writeFileSync(full, text, "utf8");
  }
}

const previousUrls = currentUrlMap();
const results = [];
const failures = [];

// Realistic UK Christmas market pricing, winter 2026.
const PRICES = {
  "Highland Bakehouse": "£2.50 – £6",
  "Bratwurst Haus": "£5 – £7.50",
  "Wee Waffle Window": "£4 – £6.50",
  "Roasty Chestnut Co.": "£3.50 – £5",
  "Poffertjes Parlour": "£4 – £6",
  "Caramel Apple Stand": "£3 – £4.50",
  "The Gluhwein Wagon": "£4.50 – £6",
  "Bothy Hot Chocolate": "£3 – £4.50",
  "Mulled Cider Mill": "£4 – £5.50",
  "Kinderpunsch Stand": "£2.50 – £4",
  "Highland Gin Toddy": "£6 – £8",
  "Eggnog Nook": "£3.50 – £5",
  "Gauze Glass Studio": "£8 – £35",
  "Renfrewshire Woodcraft": "£6 – £40",
  "Thistle & Thread": "£5 – £25",
  "Clay Bothy Pottery": "£10 – £45",
  "Festive Wreath Workshop": "£12 – £30",
  "Candlemakers' Corner": "£3 – £18",
  "Wee Woolly Knits": "£10 – £35",
  "Paisley Pattern Printworks": "£6 – £20",
  "Sweetie Jar Emporium": "£4 – £15",
  "Hamper & Hearth": "£15 – £50",
  "Advent Calendar Attic": "£5 – £22",
  "Mistletoe & Holly Bunches": "£3 – £10",
  "Paisley Foodbank": "Donations welcome",
  "RNLI Christmas Appeal": "Donations welcome",
  "Toy Collection Trolley": "Donations welcome",
  "Mary's Meals Fundraiser": "Donations welcome",
  "Salvation Army Band": "Donations welcome",
  "Guide Dogs Collection": "Donations welcome",
  "The Wrapping Booth": "£2 – £5 per gift",
  "Grotto Ticket Office": "Adults £3, children £8",
  "Face Painting by Fiona": "£4 – £8 per design",
  "Fairground Carousel": "Adults £3, children £2",
  "Open-Air Ice Rink Tickets": "Adults £9, children £6.50",
  "Christmas Lights Trail": "Adults £5, children £3",
};

// The demo applications waiting in the admin review queue.
const PENDING_APPLICATIONS = [
  { name: "Loch Lomond Honey Farm", contact: "Morag Ferguson", email: "morag@lochlomondhoneyfarm.co.uk", phone: "07700 900789", category: "food", pitch: "Raw Scottish honey, honeycomb chunks and warming honey mead from our hives on the Loch Lomond islands.", price: "£5 – £18" },
  { name: "Churros del Sol", contact: "Diego Alvarez", email: "diego@churrosdelsol.co.uk", phone: "07700 900456", category: "food", pitch: "Fresh churros with chocolate and salted caramel dips.", price: "£4 – £6.50" },
  { name: "Argyll Leathercraft", contact: "Iain Buchanan", email: "iain@argyllleathercraft.co.uk", phone: "07700 900321", category: "crafts", pitch: "Hand-stitched belts and journal covers, embossed while you wait.", price: "£15 – £60" },
  { name: "Silver & Selkie Jewellery", contact: "Catriona Bell", email: "catriona@silverandselkie.co.uk", phone: "07700 900654", category: "gifts", pitch: "Handmade silver pieces inspired by Scottish sea myths and the Selkie legend.", price: "£25 – £80" },
  { name: "Prosecco & Frost Bar", contact: "Sofia Rossi", email: "sofia@proseccoandfrost.co.uk", phone: "07700 900987", category: "drink", pitch: "Chilled prosecco and festive fizz by the glass, right beside the bandstand.", price: "£6 – £9" },
  { name: "Storytelling Yurt", contact: "Angus MacLeod", email: "angus@storytellingyurt.co.uk", phone: "07700 900258", category: "other", pitch: "Traditional Scottish winter tales in a heated yurt, every evening at six.", price: "Adults £4, children £2" },
];

// Retired demo applications to clean up when seeding.
const RETIRED_APPLICATION_NAMES = ["PoppyScotland Collection", "Braehead Candle Co."];

for (const stall of STALLS) {
  const keywords = stall.queries[0]
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  // Collect the best verified candidate across all queries, then pick the
  // highest-scoring one (Wikipedia lead images are trusted, score 100).
  const pool = [];
  outer: for (const query of stall.queries) {
    if (query.startsWith("file:")) {
      const info = await fileInfo(query.slice(5));
      if (info) {
        pool.push({ stall: stall.name, path: stall.path, score: 100, ...info });
        break;
      }
      console.log(`FILE-MISS ${stall.name}: "${query.slice(5)}" not usable`);
      continue;
    }
    if (query.startsWith("wiki:")) {
      const article = query.slice(5);
      const found = await wikiLeadImage(article);
      if (found) {
        pool.push({ stall: stall.name, path: stall.path, score: 100, ...found });
        break;
      }
      console.log(`WIKI-MISS ${stall.name}: no lead image for "${article}"`);
      continue;
    }

    let candidates = [];
    try {
      candidates = await searchCommons(query);
    } catch (err) {
      console.log(`SEARCH-FAIL ${stall.name} "${query}": ${err.message}`);
      continue;
    }

    // Skip blacklisted titles, then rank by how many query keywords appear.
    const ranked = candidates
      .filter(
        (c) =>
          !stall.avoid.some((bad) => c.title.toLowerCase().includes(bad))
      )
      .map((c) => ({
        ...c,
        score: keywords.filter((w) => c.title.toLowerCase().includes(w)).length,
      }))
      .sort((a, b) => b.score - a.score);

    for (const candidate of ranked) {
      if (await verify(candidate.info.thumburl)) {
        const meta = candidate.info.extmetadata ?? {};
        pool.push({
          stall: stall.name,
          path: stall.path,
          title: candidate.title.replace(/^File:/, ""),
          url: candidate.info.thumburl,
          page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(candidate.title).replace(/%3A/g, ":")}`,
          author: stripTags(meta.Artist?.value) || "Unknown author",
          license: stripTags(meta.LicenseShortName?.value) || "See Commons",
          score: candidate.score,
        });
        if (candidate.score >= 2) break outer; // confident match, stop searching
        break; // otherwise keep this query's best and try the next query
      }
    }
  }

  let chosen = null;
  if (pool.length > 0) {
    pool.sort((a, b) => b.score - a.score);
    chosen = { ...pool[0] };
  }

  if (chosen) {
    Object.assign(chosen, {
      isNew: stall.isNew,
      category: stall.category,
      description: stall.description,
    });
    results.push(chosen);
    console.log(`OK  ${chosen.stall} -> ${chosen.title} [${chosen.license}]`);
  } else {
    failures.push(stall.name);
    console.log(`MISS ${stall.name}: no usable photo found`);
  }
}

const EMAIL_PREFIXES = ["info", "hello", "orders", "team"];

if (results.length > 0) {
  // Deterministic, unique contact details for every stall.
  function contactFor(index, result) {
    const slug = result.stall
      .toLowerCase()
      .replace(/'/g, "")
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const charity = result.category === "charity";
    const email =
      (charity
        ? "hello@"
        : EMAIL_PREFIXES[index % EMAIL_PREFIXES.length] + "@") +
      slug +
      (charity ? ".org.uk" : ".co.uk");
    const phone =
      index % 2 === 0
        ? `07700 9002${String(10 + index).padStart(2, "0")}`
        : `0141 848 21${String(10 + index).padStart(2, "0")}`;
    return { email, phone };
  }

  // Full reset: wipe the stall directory and the demo application queue,
  // then reinsert everything with photos, contact details and pricing.
  // Idempotent, so running this SQL any number of times is safe.
  const alterSql = [
    `alter table public.stalls add column if not exists contact_email text;`,
    `alter table public.stalls add column if not exists contact_phone text;`,
    `alter table public.stalls add column if not exists price_info text;`,
    `alter table public.applications add column if not exists price_info text;`,
  ].join("\n");

  const retiredSql = [...RETIRED_APPLICATION_NAMES, ...PENDING_APPLICATIONS.map((a) => a.name)]
    .map((name) => `'${sqlEsc(name)}'`)
    .join(", ");

  const applicationsSql =
    `-- Demo applications waiting in the admin review queue\n` +
    `insert into public.applications\n` +
    `  (business_name, contact_name, email, phone, category, pitch, price_info, status)\nvalues\n` +
    PENDING_APPLICATIONS.map(
      (a) =>
        `  ('${sqlEsc(a.name)}', '${sqlEsc(a.contact)}', '${sqlEsc(a.email)}', '${sqlEsc(a.phone)}', '${a.category}', '${sqlEsc(a.pitch)}', '${sqlEsc(a.price)}', 'pending')`
    ).join(",\n") + ";\n";

  const seedSql =
    `-- Stall photos, contact details and pricing\n` +
    `-- (photos: Wikimedia Commons, free licences).\n` +
    `-- Run in: Supabase Dashboard -> SQL Editor -> New query\n` +
    `-- Resets stalls and the demo application queue: deletes existing rows,\n` +
    `-- then inserts everything. Safe to run multiple times.\n\n` +
    alterSql + "\n\n" +
    `delete from public.applications where business_name in (${retiredSql});\n\n` +
    applicationsSql + "\n" +
    `delete from public.stalls;\n\n` +
    `insert into public.stalls (market_id, name, category, description, approved, image_url, contact_email, contact_phone, price_info)\nvalues\n` +
    results
      .map((r, i) => {
        const { email, phone } = contactFor(i, r);
        const price = PRICES[r.stall] ?? "";
        return `  (1, '${sqlEsc(r.stall)}', '${r.category}', '${sqlEsc(r.description)}', true, '${sqlEsc(r.url)}', '${sqlEsc(email)}', '${sqlEsc(phone)}', '${sqlEsc(price)}')`;
      })
      .join(",\n") +
    ";\n";
  writeFileSync(join(root, "supabase", "stall-seed-updates.sql"), seedSql, "utf8");

  const credits =
    `# Image credits\n\n` +
    `Stall photos are from [Wikimedia Commons](https://commons.wikimedia.org), ` +
    `each under the licence listed below. Used in a non-commercial student ` +
    `proof of concept (COMP10020 Coursework 2).\n\n` +
    `| Stall | Photo | Author | Licence | Source |\n` +
    `| --- | --- | --- | --- | --- |\n` +
    results
      .map(
        (r) =>
          `| ${r.stall} | ${r.title} | ${r.author} | ${r.license} | [Commons](${r.page}) |`
      )
      .join("\n") +
    "\n";
  writeFileSync(join(root, "docs", "image-credits.md"), credits, "utf8");

  patchSqlFiles(results, previousUrls);
}

console.log(`\nDone. ${results.length} photos assigned, ${failures.length} missing.`);
if (failures.length) console.log("Missing stalls: " + failures.join(", "));
