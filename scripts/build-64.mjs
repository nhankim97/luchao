// Sinh 64 trang tĩnh /que/<slug>/index.html, trang danh mục /que/index.html và sitemap.xml.
// Dùng: node scripts/build-64.mjs   (chạy lại sau khi đổi domain trong canonical của index.html)
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { GUA, PALACES, TRIGRAM, TRIGRAM_HANH, castChart } from "../assets/luchao-core.js";
import { napCan } from "../assets/luchao-info.js";
import { QUE_DATA } from "./que-data.mjs";
import K1 from "./que-kinh-1.mjs";
import K2 from "./que-kinh-2.mjs";
import K3 from "./que-kinh-3.mjs";
import K4 from "./que-kinh-4.mjs";
const KINH = { ...K1, ...K2, ...K3, ...K4 };

const root = new URL("../", import.meta.url);
const home = await readFile(new URL("index.html", root), "utf8");
const BASE = /<link rel="canonical" href="([^"]+)">/.exec(home)[1].replace(/\/?$/, "/");
const TODAY = new Date().toISOString().slice(0, 10);

export const slugOf = (name) => name.normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const TUONG = { Càn: "Thiên – Trời", Đoài: "Trạch – Đầm", Ly: "Hỏa – Lửa", Chấn: "Lôi – Sấm", Tốn: "Phong – Gió", Khảm: "Thủy – Nước", Cấn: "Sơn – Núi", Khôn: "Địa – Đất" };
const HAO_TEN = ["Sơ hào (hào 1)", "Hào 2", "Hào 3", "Hào 4", "Hào 5", "Thượng hào (hào 6)"];
const STAGE_NOTE = {
  "Bát thuần": (q) => `Đây là quẻ đứng đầu cung ${q.palace}, trên dưới cùng một quái, Thế ở hào 6. Các quẻ khác trong cung đều được dùng để tìm Phục thần từ quẻ này.`,
  "Du hồn": () => "Đây là quẻ Du hồn (hồn đi xa) của cung. Khi gặp quẻ Du hồn, người xem thường lưu ý đến sự dao động, đi lại, thay đổi chỗ ở hoặc lòng chưa yên.",
  "Quy hồn": () => "Đây là quẻ Quy hồn (hồn trở về) của cung. Quẻ Quy hồn thường gợi đến việc quay về chỗ cũ, ở yên một chỗ, hoặc việc khó đi xa.",
};
const TINH_NOTE = {
  "Lục xung": "Quẻ thuộc nhóm Lục xung: ba cặp hào nội ngoại (1–4, 2–5, 3–6) xung nhau từng đôi. Lục xung thường ứng với việc đến nhanh, tan nhanh, khó giữ lâu dài.",
  "Lục hợp": "Quẻ thuộc nhóm Lục hợp: ba cặp hào nội ngoại (1–4, 2–5, 3–6) hợp nhau từng đôi. Lục hợp thường ứng với sự gắn kết, việc dễ thành, nhưng có khi tiến triển chậm.",
};

// Danh sách 64 quẻ theo thứ tự Bát Cung
const keyOf = (bits) => bits.join("");
// "Thuần Càn" và "Thuần Cấn" bỏ dấu đều ra "thuan-can", nên ghi kèm tượng để phân biệt
const SLUG_RIENG = { "Thuần Càn": "thuan-can-thien", "Thuần Cấn": "thuan-can-son" };
const all = Object.entries(GUA).map(([k, g]) => ({ key: k, bits: [...k].map(Number), ...g, slug: SLUG_RIENG[g.name] || slugOf(g.name) }));
const STAGES = ["Bát thuần", "Nhất thế", "Nhị thế", "Tam thế", "Tứ thế", "Ngũ thế", "Du hồn", "Quy hồn"];
all.sort((a, b) => PALACES.indexOf(a.palace) - PALACES.indexOf(b.palace) || STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage));
const byKey = Object.fromEntries(all.map((q) => [q.key, q]));

if (all.length !== 64 || new Set(all.map((q) => q.slug)).size !== 64) throw new Error("Cần đúng 64 quẻ, 64 slug khác nhau");
for (const q of all) {
  if (!QUE_DATA[q.name]) throw new Error("Thiếu giới thiệu cho " + q.name);
  const k = KINH[q.name];
  if (!k || !k.qt || !k.qtg || !k.tg || !k.tgg || k.hao.length !== 6 || k.hao.some((h) => h.length !== 2 || !h[0] || !h[1])) throw new Error("Thiếu lời kinh cho " + q.name);
}
const VI = ["Sơ", "Nhị", "Tam", "Tứ", "Ngũ", "Thượng"];
const haoNhan = (k, duong) => { const so = duong ? "Cửu" : "Lục"; return k === 0 || k === 5 ? `${VI[k]} ${so}` : `${so} ${VI[k]}`; };

const fromBits = (bits) => byKey[keyOf(bits)];
const hoQuai = (b) => fromBits([b[1], b[2], b[3], b[2], b[3], b[4]]); // quẻ hỗ: hào 2-3-4 làm nội, 3-4-5 làm ngoại
const doiQuai = (b) => fromBits(b.map((x) => 1 - x));                  // quẻ đối (thác): đổi âm dương cả sáu hào
const daoQuai = (b) => fromBits([...b].reverse());                      // quẻ đảo (tống): lật ngược quẻ

const bar = (d, cls = "") => `<span class="bar ${cls}" aria-hidden="true">${d ? "<i></i>" : "<i></i><i></i>"}</span>`;
const hanhSpan = (h) => `<span class="h-${h}">${h}</span>`;
const link = (q, from) => `<a href="${from}que/${q.slug}/">${q.name}</a>`;

// Menu dùng chung cho mọi trang (trang chủ viết sẵn trong index.html)
export const nav = (rel, cur) => `<nav class="site-nav" aria-label="Menu chính">
  <div class="wrap">
    <a class="brand" href="${rel}">Lục Hào</a>
    <ul>
      <li><a class="item" href="${rel}">Lập quẻ</a></li>
      <li><a class="item" href="${rel}que/"${cur === "hub" ? ' aria-current="page"' : ""}>64 quẻ</a></li>
      <li><a class="item" href="${rel}#huong-dan">Hướng dẫn</a></li>
      <li><a class="item" href="${rel}#faq">Hỏi đáp</a></li>
    </ul>
  </div>
</nav>`;

function head({ title, desc, path, rel, ld }) {
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${BASE}${path}">
<meta name="robots" content="index,follow">
<meta property="og:type" content="article">
<meta property="og:locale" content="vi_VN">
<meta property="og:site_name" content="Lập Quẻ Lục Hào">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${BASE}${path}">
<meta property="og:image" content="${BASE}og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${rel}favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#7a1f1f">
<link rel="stylesheet" href="${rel}assets/style.css">
<script type="application/ld+json">
${JSON.stringify(ld, null, 1)}
</script>
</head>
<body>
${nav(rel, path === "que/" ? "hub" : "que")}`;
}
const crumbs = (items) => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: BASE + path })),
});
const foot = (rel) => `
<footer class="site-footer">
  <div class="wrap">
    <p><a href="${rel}">Lập quẻ Lục Hào online</a> · <a href="${rel}que/">Danh sách 64 quẻ theo Bát Cung</a></p>
    <p>Bảng nạp giáp, lục thân, phục thần sinh tự động từ cùng bộ quy tắc với công cụ lập quẻ (trường phái Tăng San Bốc Dịch). Âm Hán Việt lời quẻ, lời Tượng và hào từ theo nguyên văn Kinh Dịch; phần giảng nghĩa do trang tự biên soạn, có tham khảo bản dịch Kinh Dịch của Ngô Tất Tố.</p>
  </div>
</footer>
</body>
</html>
`;

function quePage(q, i) {
  const rel = "../../";
  const d = QUE_DATA[q.name];
  const lines = q.bits.map((b) => (b ? 7 : 8));
  const c = castChart(lines, { y: 2026, m: 1, d: 1, h: 12, mi: 0 });
  const can = napCan(q.upper, q.lower);
  const quaiTinh = c.chu.quaiTinh;
  const thuan = all.find((x) => x.palace === q.palace && x.stage === "Bát thuần");
  const cung = all.filter((x) => x.palace === q.palace);
  const prev = all[(i + 63) % 64], next = all[(i + 1) % 64];
  const ho = hoQuai(q.bits), doi = doiQuai(q.bits), dao = daoQuai(q.bits);
  const hEnc = lines.join("");
  const title = `Quẻ ${q.name} – Lời quẻ, hào từ, nạp giáp, Thế Ứng | Lục Hào`;
  const k = KINH[q.name];
  const desc = `Quẻ ${q.name}: ${d.y.toLowerCase()}. Thuộc cung ${q.palace} (${q.palaceHanh}), ${q.stage}, Thế hào ${q.the}, Ứng hào ${q.ung}${quaiTinh ? ", " + quaiTinh : ""}. Bảng nạp giáp, lục thân, phục thần và lập quẻ online.`;
  const ld = [crumbs([["Lập quẻ Lục Hào", ""], ["64 quẻ", "que/"], [q.name, `que/${q.slug}/`]])];

  const rows = [5, 4, 3, 2, 1, 0].map((k) => {
    const h = c.hao[k];
    const tu = q.the === k + 1 ? `<b class="tu-the">Thế</b>` : q.ung === k + 1 ? `<b class="tu-ung">Ứng</b>` : "";
    const phuc = h.phucThan ? `${h.phucThan.lucThan} ${h.phucThan.chi} ${hanhSpan(h.phucThan.hanh)}` : "–";
    return `<tr><th scope="row">${HAO_TEN[k]}</th><td>${bar(q.bits[k], "sm")}</td><td>${tu}</td><td>${h.lucThan}</td><td>${can[k]} ${h.chi}</td><td>${hanhSpan(h.hanh)}</td><td class="phuc">${phuc}</td></tr>`;
  }).join("\n");
  const coLucThan = [...new Set(c.hao.map((h) => h.lucThan))];
  const thieu = ["Phụ Mẫu", "Huynh Đệ", "Tử Tôn", "Thê Tài", "Quan Quỷ"].filter((x) => !coLucThan.includes(x));
  const phucList = c.hao.map((h, k) => (h.phucThan ? `${h.phucThan.lucThan} ${h.phucThan.chi} ${h.phucThan.hanh} ẩn dưới hào ${k + 1}` : null)).filter(Boolean);

  const notes = [
    STAGE_NOTE[q.stage] ? STAGE_NOTE[q.stage](q) : `Quẻ ở vị trí ${q.stage} của cung ${q.palace}, nên hào Thế nằm ở hào ${q.the}, hào Ứng ở hào ${q.ung}.`,
    quaiTinh ? TINH_NOTE[quaiTinh] : null,
    thieu.length
      ? `Quẻ vắng ${thieu.join(", ")}, nên lấy Phục thần từ quẻ ${q.name === thuan.name ? "thuần" : thuan.name}: ${phucList.join("; ")}.`
      : `Quẻ có đủ năm lục thân nên không cần tìm Phục thần.`,
  ].filter(Boolean);

  return `${head({ title, desc, path: `que/${q.slug}/`, rel, ld })}
<main class="wrap que-page">
  <nav class="crumbs" aria-label="Đường dẫn"><a href="${rel}">Trang chủ</a> › <a href="${rel}que/">64 quẻ</a> › <span aria-current="page">${q.name}</span></nav>
  <h1>Quẻ ${q.name}</h1>
  <p class="que-lead">${d.y}</p>

  <section class="card que-top">
    <div class="que-gua" role="img" aria-label="Hình quẻ ${q.name}, hào 6 ở trên">${[5, 4, 3, 2, 1, 0].map((k) => bar(q.bits[k], "lg")).join("")}</div>
    <dl class="que-facts">
      <div><dt>Ngoại quái (trên)</dt><dd>${q.upper} · ${TUONG[q.upper]} · ${hanhSpan(TRIGRAM_HANH[q.upper])}</dd></div>
      <div><dt>Nội quái (dưới)</dt><dd>${q.lower} · ${TUONG[q.lower]} · ${hanhSpan(TRIGRAM_HANH[q.lower])}</dd></div>
      <div><dt>Cung</dt><dd>${q.palace} – ${hanhSpan(q.palaceHanh)}, quẻ ${q.stage}</dd></div>
      <div><dt>Thế / Ứng</dt><dd>Thế hào ${q.the}, Ứng hào ${q.ung}</dd></div>
      <div><dt>Tính chất</dt><dd>${quaiTinh || "Không phải Lục xung hay Lục hợp"}</dd></div>
    </dl>
    <p class="que-cta"><a class="btn primary" href="${rel}?h=${hEnc}">Lập quẻ ${q.name} với giờ hiện tại</a></p>
  </section>

  <article class="content">
    <h2>Ý nghĩa quẻ ${q.name}</h2>
    <p>${d.mo}</p>
    <p>Quẻ gồm ngoại quái ${q.upper} (${TUONG[q.upper].split(" – ")[1].toLowerCase()}) ở trên và nội quái ${q.lower} (${TUONG[q.lower].split(" – ")[1].toLowerCase()}) ở dưới. Trong Lục Hào, ý nghĩa tổng quát của quẻ chỉ là bối cảnh; khi luận cần xem Dụng thần, Thế Ứng và sự sinh khắc với ngày tháng gieo quẻ.</p>

    <h2>Lời quẻ (Thoán từ)</h2>
    <blockquote class="kinh"><p lang="vi">${k.qt}</p></blockquote>
    <p>${k.qtg}</p>

    <h2>Lời Tượng</h2>
    <blockquote class="kinh"><p>${k.tg}</p></blockquote>
    <p>${k.tgg}</p>

    <h2>Hào từ sáu hào quẻ ${q.name}</h2>
    <ol class="hao-tu">
${k.hao.map(([am, giang], i) => `      <li><p class="hao-nhan"><b>${haoNhan(i, q.bits[i])}</b> ${bar(q.bits[i], "mini")}${q.the === i + 1 ? ' <span class="tu-the">Thế</span>' : q.ung === i + 1 ? ' <span class="tu-ung">Ứng</span>' : ""}</p><p class="kinh-am">${am}</p><p>${giang}</p></li>`).join("\n")}
    </ol>
    <p class="hint">Hào từ đọc từ hào 1 (Sơ) lên hào 6 (Thượng). "Cửu" là hào dương, "Lục" là hào âm. Trong Lục Hào, hào từ chỉ dùng tham khảo thêm; luận quẻ vẫn dựa vào Dụng thần, Thế Ứng và sinh khắc với ngày tháng.</p>

    <h2>Bảng nạp giáp quẻ ${q.name}</h2>
    <div class="tbl-wrap">
      <table class="sheet que-table">
        <caption>Nạp giáp, lục thân quẻ ${q.name} (cung ${q.palace} – ${q.palaceHanh})</caption>
        <thead><tr><th scope="col">Hào</th><th scope="col">Vạch</th><th scope="col">Thế / Ứng</th><th scope="col">Lục thân</th><th scope="col">Can chi</th><th scope="col">Ngũ hành</th><th scope="col">Phục thần</th></tr></thead>
        <tbody>
${rows}
        </tbody>
      </table>
    </div>
    <ul>
${notes.map((n) => `      <li>${n}</li>`).join("\n")}
      <li>Lục thân tính theo ngũ hành cung ${q.palace} (${q.palaceHanh}). Lục thú thay đổi theo can ngày gieo quẻ nên không ghi ở đây; hãy <a href="${rel}?h=${hEnc}">lập quẻ</a> để xem đủ Lục thú, Tuần không, Nguyệt phá.</li>
    </ul>

    <h2>Quẻ liên quan</h2>
    <ul class="que-rel">
      <li>Quẻ hỗ (hào 2–4 làm nội, 3–5 làm ngoại): ${link(ho, rel)}</li>
      <li>Quẻ đối (đổi âm dương cả sáu hào): ${link(doi, rel)}</li>
      <li>Quẻ đảo (lật ngược quẻ): ${dao.key === q.key ? `chính là ${q.name} (quẻ đối xứng)` : link(dao, rel)}</li>
    </ul>

    <h2>Tám quẻ cung ${q.palace}</h2>
    <ol class="que-cung">
${cung.map((x) => `      <li>${x.key === q.key ? `<b>${x.name}</b>` : link(x, rel)} <span class="hint">${x.stage}</span></li>`).join("\n")}
    </ol>

    <nav class="que-nav" aria-label="Quẻ trước và sau">
      <a href="${rel}que/${prev.slug}/">← ${prev.name}</a>
      <a href="${rel}que/${next.slug}/">${next.name} →</a>
    </nav>
  </article>
</main>${foot(rel)}`;
}

function hubPage() {
  const rel = "../";
  const title = "64 quẻ Lục Hào theo Bát Cung – Nạp giáp, Thế Ứng từng quẻ";
  const desc = "Danh sách đầy đủ 64 quẻ Kinh Dịch xếp theo Bát Cung dùng trong Lục Hào: cung, ngũ hành, thứ tự trong cung, Thế Ứng, Lục xung, Lục hợp. Mỗi quẻ có bảng nạp giáp, lục thân, phục thần.";
  const ld = [crumbs([["Lập quẻ Lục Hào", ""], ["64 quẻ", "que/"]])];
  const sections = PALACES.map((p) => {
    const list = all.filter((x) => x.palace === p);
    return `  <section class="card hub-cung" aria-labelledby="cung-${slugOf(p)}">
    <h2 id="cung-${slugOf(p)}">Cung ${p} – ${hanhSpan(TRIGRAM_HANH[p])}</h2>
    <ul class="hub-list">
${list.map((x) => {
  const tinh = castChart(x.bits.map((b) => (b ? 7 : 8)), { y: 2026, m: 1, d: 1, h: 12, mi: 0 }).chu.quaiTinh;
  return `      <li><a href="${x.slug}/"><span class="mini-gua" aria-hidden="true">${[5, 4, 3, 2, 1, 0].map((k) => bar(x.bits[k], "mini")).join("")}</span><span><b>${x.name}</b><span class="hint">${x.stage} · Thế ${x.the}${tinh ? " · " + tinh : ""}</span></span></a></li>`;
}).join("\n")}
    </ul>
  </section>`;
  }).join("\n");
  return `${head({ title, desc, path: "que/", rel, ld })}
<main class="wrap que-page">
  <nav class="crumbs" aria-label="Đường dẫn"><a href="${rel}">Trang chủ</a> › <span aria-current="page">64 quẻ</span></nav>
  <h1>64 quẻ Lục Hào theo Bát Cung</h1>
  <p class="que-lead">Lục Hào xếp 64 quẻ thành tám cung, mỗi cung tám quẻ: quẻ Thuần đứng đầu, rồi Nhất thế đến Ngũ thế, Du hồn và Quy hồn. Cung quyết định ngũ hành dùng để an Lục thân, thứ tự trong cung quyết định vị trí hào Thế.</p>
${sections}
</main>${foot(rel)}`;
}

// Ghi file
await rm(new URL("que/", root), { recursive: true, force: true });
for (const [i, q] of all.entries()) {
  const dir = new URL(`que/${q.slug}/`, root);
  await mkdir(dir, { recursive: true });
  await writeFile(new URL("index.html", dir), quePage(q, i));
}
await writeFile(new URL("que/index.html", root), hubPage());

const urls = ["", "que/", ...all.map((q) => `que/${q.slug}/`)];
await writeFile(new URL("sitemap.xml", root), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${BASE}${u}</loc>\n    <lastmod>${TODAY}</lastmod>\n  </url>`).join("\n")}
</urlset>
`);

// Khối liên kết 64 quẻ trên trang chủ (giữa hai dấu mốc)
const block = PALACES.map((p) => `      <li><b>Cung ${p}:</b> ${all.filter((x) => x.palace === p).map((x) => `<a href="que/${x.slug}/">${x.name}</a>`).join(", ")}</li>`).join("\n");
const START = "<!-- 64-que:start -->", END = "<!-- 64-que:end -->";
if (home.includes(START)) {
  const out = home.replace(new RegExp(`${START}[\\s\\S]*?${END}`), `${START}\n    <ul class="home-64">\n${block}\n    </ul>\n    ${END}`);
  await writeFile(new URL("index.html", root), out);
}
console.log(`Đã sinh ${all.length} trang quẻ, trang danh mục và sitemap (${urls.length} URL) với BASE ${BASE}`);
