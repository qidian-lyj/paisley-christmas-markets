// One-off: sync the generated stalls + applications seed blocks from
// stall-seed-updates.sql into schema.sql (adds price/contact columns to the
// table definitions if missing).
import { readFileSync, writeFileSync } from "node:fs";

function sliceBlock(text, marker) {
  const start = text.indexOf(marker);
  if (start === -1) return null;
  const end = text.indexOf(";\n", text.indexOf("values", start)) + 2;
  return text.slice(start, end);
}

const seed = readFileSync("supabase/stall-seed-updates.sql", "utf8");
const appsBlock = sliceBlock(seed, "insert into public.applications");
const stallsBlock = sliceBlock(seed, "insert into public.stalls");
if (!appsBlock || !stallsBlock) {
  console.error("could not extract seed blocks from stall-seed-updates.sql");
  process.exit(1);
}

let schema = readFileSync("supabase/schema.sql", "utf8");

// 1) replace the stalls + applications seed blocks in schema.sql
const stallsRe = /insert into public\.stalls\s*\([\s\S]*?\);\n/;
const appsRe = /insert into public\.applications\s*\([\s\S]*?\);\n/;
if (!stallsRe.test(schema)) {
  console.error("stalls seed block not found in schema.sql");
  process.exit(1);
}
if (!appsRe.test(schema)) {
  console.error("applications seed block not found in schema.sql");
  process.exit(1);
}
schema = schema.replace(stallsRe, stallsBlock);
schema = schema.replace(appsRe, appsBlock);

// 2) make sure the price_info column exists in both table definitions
//    (tolerates CRLF/LF line endings; skips if already added)
const stallsDef = /  contact_phone text,\r?\n  approved boolean not null default true,/;
if (stallsDef.test(schema)) {
  schema = schema.replace(
    stallsDef,
    "  contact_phone text,\n  price_info text,\n  approved boolean not null default true,"
  );
} else if (!schema.includes("price_info text,")) {
  console.error("stalls definition pattern not found");
  process.exit(1);
}

const appsDef = /  pitch text not null,\r?\n  status text not null default 'pending' check/;
if (appsDef.test(schema)) {
  schema = schema.replace(
    appsDef,
    "  pitch text not null,\n  price_info text,\n  status text not null default 'pending' check"
  );
} else {
  console.log("applications price_info column already present");
}

writeFileSync("supabase/schema.sql", schema, "utf8");
console.log("schema.sql synced (stalls + applications blocks with pricing)");
