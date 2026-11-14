// Thay YOUR-DOMAIN bằng domain thật trong canonical, OG, JSON-LD, robots.txt và sitemap.xml.
// Dùng: node scripts/set-domain.mjs luchao.pages.dev
//       node scripts/set-domain.mjs tenban.github.io/luchao
import { readFile, writeFile } from "node:fs/promises";

const domain = (process.argv[2] || "").replace(/^https?:\/\//, "").replace(/\/+$/, "");
if (!domain) { console.error("Thiếu domain. Ví dụ: node scripts/set-domain.mjs luchao.pages.dev"); process.exit(1); }
for (const f of ["index.html", "robots.txt", "sitemap.xml"]) {
  const url = new URL(`../${f}`, import.meta.url);
  const s = await readFile(url, "utf8");
  const n = s.split("YOUR-DOMAIN").length - 1;
  await writeFile(url, s.replaceAll("YOUR-DOMAIN", domain));
  console.log(`${f}: thay ${n} chỗ`);
}
