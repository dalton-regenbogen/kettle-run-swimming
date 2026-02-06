import { writeFileSync } from "node:fs";

const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, "0");
const dd = String(now.getDate()).padStart(2, "0");

const lastUpdated = `${yyyy}-${mm}-${dd}`;
const version = `${yyyy}${mm}${dd}`;

const meta = { lastUpdated, version };
writeFileSync("assets/data/records-meta.json", JSON.stringify(meta, null, 2) + "\n");
console.log("Updated assets/data/records-meta.json:", meta);