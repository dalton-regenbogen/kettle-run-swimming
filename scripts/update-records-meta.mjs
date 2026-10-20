// Sets the "Updated …" date on the Records page to today.
// Run with: npm run records:meta   (after editing src/assets/data/records.json)

import { writeFileSync } from "node:fs";

const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, "0");
const dd = String(now.getDate()).padStart(2, "0");

const meta = { lastUpdated: `${yyyy}-${mm}-${dd}` };
writeFileSync("src/assets/data/records-meta.json", JSON.stringify(meta, null, 2) + "\n");
console.log("Updated src/assets/data/records-meta.json:", meta);
