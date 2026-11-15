// app.js — chỉ lo giao diện: đọc input, gọi castChart, vẽ lá quẻ, đồng bộ URL.
// Quy tắc an quẻ nằm trong luchao-core.js (không sửa); phản/phục ngâm trong luchao-extra.js;
// nạp can, vượng suy, trường sinh, Đào hoa, Dịch mã, âm lịch trong luchao-info.js.
import { castChart, solarTermJD, jdToLocalString, CHI_HANH } from "./luchao-core.js";
import { phanPhucNgam } from "./luchao-extra.js";
import { chiTietHao, amLich, canChiNam, canChiThangAm, tietKhi24, daoHoa, dichMa } from "./luchao-info.js";
import { drawSheet } from "./luchao-image.js";

const TZ = 7;
// true khi chạy trong bản đóng gói một file (scripts/build-embed.mjs)
const EMBED = typeof window !== "undefined" && window.__LUCHAO_EMBED__ === true;
const STATES = {
  7: { label: "Dương", duong: true, dong: false },
  8: { label: "Âm", duong: false, dong: false },
  9: { label: "Dương động", duong: true, dong: true },
  6: { label: "Âm động", duong: false, dong: true },
};
const CYCLE = [7, 8, 9, 6];

const $ = (s) => document.querySelector(s);
const form = $("#cast-form");
const rowsEl = $("#line-rows");
const quickEl = $("#quick-input");
const dtEl = $("#dt-input");
const ziEl = $("#zi-input");
const castBtn = $("#cast-btn");
const statusEl = $("#form-status");
const resultEl = $("#result");

// lines[0] = hào 1 … lines[5] = hào 6; null = chưa chọn
const lines = [null, null, null, null, null, null];

// ───────── Tiện ích ─────────
const pad = (n) => String(n).padStart(2, "0");

function nowVN() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date()).map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function parseDT(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s || "");
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  return { y, m: mo, d, h, mi };
}
const fmtDT = (dt) => `${pad(dt.d)}/${pad(dt.m)}/${dt.y} ${pad(dt.h)}:${pad(dt.mi)}`;
const jdOf = (dt) => Date.UTC(dt.y, dt.m - 1, dt.d, dt.h, dt.mi) / 86400000 + 2440587.5 - TZ / 24;

function barHTML(isDuong, { dong = false, cls = "" } = {}) {
  return `<span class="bar ${isDuong ? "duong" : "am"}${dong ? " dong" : ""} ${cls}" aria-hidden="true">${isDuong ? "<i></i>" : "<i></i><i></i>"}</span>`;
}

// ───────── Khu nhập ─────────
// 6 hàng hào đã có sẵn trong index.html (tránh nhảy bố cục); ở đây chỉ gắn sự kiện.
function bindRows() {
  rowsEl.addEventListener("change", (e) => {
    const r = e.target.closest("input[type=radio]");
    if (!r) return;
    lines[Number(r.name.slice(3)) - 1] = Number(r.value);
    syncUI();
  });
  rowsEl.addEventListener("click", (e) => {
    const b = e.target.closest(".glyph-btn");
    if (!b) return;
    const i = Number(b.dataset.i);
    const cur = lines[i];
    lines[i] = cur === null ? CYCLE[0] : CYCLE[(CYCLE.indexOf(cur) + 1) % CYCLE.length];
    syncUI();
  });
}

function syncUI() {
  lines.forEach((v, i) => {
    const n = i + 1;
    rowsEl.querySelectorAll(`input[name=hao${n}]`).forEach((r) => { r.checked = Number(r.value) === v; });
    const btn = rowsEl.querySelector(`.glyph-btn[data-i="${i}"]`);
    const st = STATES[v];
    btn.innerHTML = st
      ? `${barHTML(st.duong, { dong: st.dong })}<span class="glyph-cap${st.dong ? " dong" : ""}">${st.label}</span>`
      : `<span class="glyph-empty">chưa chọn</span>`;
    btn.setAttribute("aria-label", `Hào ${n}: ${st ? st.label : "chưa chọn"}. Bấm để đổi trạng thái`);
  });
  const missing = lines.filter((v) => v === null).length;
  castBtn.disabled = missing > 0;
  statusEl.textContent = missing ? `Còn ${missing} hào chưa chọn` : "";
  if (document.activeElement !== quickEl) quickEl.value = missing ? "" : lines.join("");
}

function parseQuick(s) {
  const map = { "7": 7, "8": 8, "9": 9, "6": 6, "—": 7, "–": 7, "-": 8, o: 9, O: 9, x: 6, X: 6 };
  const chars = [...s.replace(/\s+/g, "")];
  if (chars.length !== 6) return null;
  const out = chars.map((c) => map[c]);
  return out.every(Boolean) ? out : null;
}

quickEl.addEventListener("input", () => {
  const v = parseQuick(quickEl.value);
  if (v) { v.forEach((x, i) => { lines[i] = x; }); syncUI(); }
  quickEl.setAttribute("aria-invalid", quickEl.value && !v ? "true" : "false");
});
quickEl.addEventListener("blur", syncUI);
quickEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); if (!castBtn.disabled) form.requestSubmit(); }
});

$("#now-btn").addEventListener("click", () => { dtEl.value = nowVN(); });
$("#reset-btn").addEventListener("click", () => {
  lines.fill(null);
  quickEl.value = "";
  dtEl.value = nowVN();
  ziEl.checked = true;
  resultEl.hidden = true;
  resultEl.innerHTML = "";
  try { history.replaceState(null, "", location.pathname); } catch { /* bỏ qua */ }
  syncUI();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  cast(true);
});

// ───────── Lập quẻ ─────────
let lastText = "";
let lastModel = null; // dữ liệu để vẽ ảnh lá quẻ

function cast(scroll) {
  if (lines.some((v) => v === null)) return;
  let dt = parseDT(dtEl.value);
  if (!dt) { dtEl.value = nowVN(); dt = parseDT(dtEl.value); }
  const zi = ziEl.checked;
  const chart = castChart([...lines], dt, { tz: TZ, ziHourNextDay: zi });
  // Ghép tay để giữ dấu ":" dễ đọc: ?h=997888&t=2026-11-08T14:18
  // Bản nhúng (artifact) chỉ giữ được #hash dạng chữ-số-gạch: #q-997888-202611081418[-z0]
  const t = dtEl.value.slice(0, 16);
  const next = EMBED
    ? `#q-${lines.join("")}-${t.replace(/\D/g, "")}${zi ? "" : "-z0"}`
    : `${location.pathname}?h=${lines.join("")}&t=${t}${zi ? "" : "&z=0"}`;
  try { history.replaceState(null, "", next); } catch { /* khung nhúng có thể chặn */ }
  render(chart, dt, zi);
  if (scroll) resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

function nearTermWarning(p, dt) {
  const jd = jdOf(dt);
  const start = p.tiet.batDauJD;
  const nextLon = (Math.floor(((p.sunLongitude - 315 + 360) % 360) / 30) * 30 + 315 + 30) % 360;
  const next = solarTermJD(nextLon, start + 30.4);
  return Math.min(Math.abs(jd - start), Math.abs(next - jd)) * 1440 < 30;
}

// Âm lịch; nếu đổi ngày lúc 23h thì giờ Tý muộn tính sang ngày âm hôm sau cho khớp trụ ngày
function lunarOf(dt, zi) {
  let { y, m, d } = dt;
  if (zi && dt.h >= 23) {
    const n = new Date(Date.UTC(y, m - 1, d + 1));
    y = n.getUTCFullYear(); m = n.getUTCMonth() + 1; d = n.getUTCDate();
  }
  return amLich(d, m, y, TZ);
}

// ───────── Vẽ lá quẻ ─────────
const gz = (x) => `${x.can} ${x.chi}`;
const theUng = (g, i) => (g.the === i + 1 ? "Thế" : g.ung === i + 1 ? "Ứng" : "");
const TOT = new Set(["Lâm nguyệt lệnh", "Lâm nhật thần", "Nhật xung · Ám động"]);
const XAU = new Set(["Nguyệt phá", "Nhật xung · Nhật phá", "Tuần không", "Biến tử", "Biến mộ", "Biến tuyệt", "Biến không"]);
const chip = (txt, kind = "") => `<span class="chip ${kind}">${txt}</span>`;
const chipTT = (txt) => chip(txt, TOT.has(txt) ? "good" : XAU.has(txt) ? "bad" : "info");
const chipSao = (txt) => chip(txt, "sao");
const hanhSpan = (chi, hanh) => `<span class="h-${hanh}">${chi} – ${hanh}</span>`;

function bigGua(bits, moving) {
  // bits: 6 phần tử, hào 1 → 6; vẽ từ trên (hào 6) xuống
  let s = "";
  for (let i = 5; i >= 0; i--) s += barHTML(bits[i] === "Dương", { dong: moving[i], cls: "big" });
  return `<div class="big-gua">${s}</div>`;
}

function guaFigure(kind, g, bits, moving) {
  const nhan = [`Cung ${g.palace} (${g.palaceHanh})`, g.stage, g.quaiTinh].filter(Boolean).join(" · ");
  return `<figure class="gua-fig">
    <figcaption><span class="gua-kind">${kind}</span><span class="gua-name">${g.name}</span></figcaption>
    ${bigGua(bits, moving)}
    <p class="gua-sub">${nhan}</p>
    <p class="gua-sub">Thế hào ${g.the} · Ứng hào ${g.ung}</p>
  </figure>`;
}

function render(chart, dt, zi) {
  const p = chart.pillars;
  const { chu, bien } = chart;
  const ct = chiTietHao(chart);
  const ngam = phanPhucNgam(chart);
  const warn = nearTermWarning(p, dt);
  const al = lunarOf(dt, zi);
  const moving = chart.hao.map((h) => h.dong);
  const chuBits = chart.hao.map((h) => h.am_duong);
  const bienBits = chart.bienFull ? chart.bienFull.map((b) => b.am_duong) : null;
  const order = [5, 4, 3, 2, 1, 0];
  const lucThuCol = (i) => `<td class="lucthu">${chart.hao[i].lucThu}</td>`;

  // ── Bảng an quẻ ──
  // Màn rộng: MỘT bảng, mỗi hàng là một hào (quẻ chủ bên trái, quẻ biến bên phải) nên không bao giờ lệch dòng.
  // Màn hẹp: hai bảng xếp trên dưới.
  // Trong bảng ghi gọn: "Ám động" / "Nhật phá" (phần tổng hợp từng hào và phần giải thích ghi rõ là do Nhật xung).
  const ttGon = (list) => list.map((x) => chipTT(x).replace(/Nhật xung · /, "")).join("") || "–";
  const chuCells = (i, withThu) => {
    const h = chart.hao[i], c = ct[i].chu, tu = theUng(chu, i);
    return `<td class="col-bar">${barHTML(h.am_duong === "Dương", { dong: h.dong })}<span class="sr-only">Hào ${i + 1}${h.dong ? `, ${h.am_duong.toLowerCase()} động` : ""}</span></td>
      <td class="tu">${tu ? `<span class="tu-${tu === "Thế" ? "the" : "ung"}">${tu}</span>` : ""}</td>
      <th scope="row" class="lt">${h.lucThan}</th>
      <td class="cc">${hanhSpan(h.chi, h.hanh)}</td>
      <td class="phuc">${h.phucThan ? `${h.phucThan.lucThan} ${hanhSpan(h.phucThan.chi, h.phucThan.hanh)}` : "–"}</td>
      <td class="tt">${ttGon(c.trangThai)}</td>
      ${withThu ? lucThuCol(i) : ""}`;
  };
  const bienCells = (i, first) => {
    const b = ct[i].bien, bf = chart.bienFull[i], tu = theUng(bien, i);
    return `<td class="lt${first ? " split" : ""}">${bf.lucThan}${tu ? ` <span class="tu-soft">${tu}</span>` : ""}</td>
      <td class="cc">${hanhSpan(bf.chi, bf.hanh)}</td>
      ${lucThuCol(i)}
      <td class="tt">${ttGon(b.trangThai)}</td>
      <td class="col-bar">${barHTML(bf.am_duong === "Dương", { dong: b.tuHaoDong })}</td>`;
  };
  const rowCls = (i) => (chart.hao[i].dong ? "moving" : "");
  const headChu = `<th scope="col">Hào</th><th scope="col">Thế / Ứng</th><th scope="col">Lục thân</th><th scope="col">Can chi</th><th scope="col">Phục thần</th><th scope="col">Trạng thái</th>`;
  const headBien = (first) => `<th scope="col"${first ? ` class="split"` : ""}>Lục thân</th><th scope="col">Can chi</th><th scope="col">Lục thú</th><th scope="col">Trạng thái</th><th scope="col">Hào</th>`;
  const mainMerged = `<div class="tbl-wrap"><table class="sheet main-table${bien ? "" : " single"}">
    <caption class="sr-only">Bảng an quẻ, hào 6 ở trên</caption>
    <thead>
      <tr class="grp"><th scope="colgroup" colspan="${bien ? 6 : 7}">Quẻ chủ: ${chu.name}</th>${bien ? `<th scope="colgroup" colspan="5" class="split">Quẻ biến: ${bien.name}</th>` : ""}</tr>
      <tr>${headChu}${bien ? headBien(true) : `<th scope="col">Lục thú</th>`}</tr>
    </thead>
    <tbody>${order.map((i) => `<tr class="${rowCls(i)}">${chuCells(i, !bien)}${bien ? bienCells(i, true) : ""}</tr>`).join("")}</tbody>
  </table></div>`;
  const mainStacked = bien ? `<div class="tbl-wrap"><table class="sheet main-table">
      <caption>Quẻ chủ: ${chu.name}</caption>
      <thead><tr>${headChu}</tr></thead>
      <tbody>${order.map((i) => `<tr class="${rowCls(i)}">${chuCells(i, false)}</tr>`).join("")}</tbody>
    </table></div>
    <div class="tbl-wrap"><table class="sheet main-table">
      <caption>Quẻ biến: ${bien.name}</caption>
      <thead><tr>${headBien(false)}</tr></thead>
      <tbody>${order.map((i) => `<tr class="${rowCls(i)}">${bienCells(i, false).replace(/^<td class="lt">/, '<th scope="row" class="lt">').replace(/<\/td>/, "</th>")}</tr>`).join("")}</tbody>
    </table></div>` : "";

  // ── Vượng suy, trường sinh (cùng cách: một bảng khi màn rộng) ──
  const vsCells = (i, side, first) => {
    const x = ct[i][side];
    const tag = side === "chu" ? "th" : "td";
    return `<${tag}${tag === "th" ? ` scope="row"` : ""}${first ? ` class="split"` : ""}><span class="h-${x.hanh}">${x.can} ${x.chi}</span></${tag}>
      <td class="vs vs-${x.vuongSuy}">${x.vuongSuy}</td><td>${x.tsNgay}</td><td>${x.tsThang}</td>`;
  };
  const vsHead = (first) => `<th scope="col"${first ? ` class="split"` : ""}>Hào</th><th scope="col">Vượng suy<br><span class="th-sub">theo tháng</span></th><th scope="col">Trường sinh<br><span class="th-sub">theo ngày</span></th><th scope="col">Trường sinh<br><span class="th-sub">theo tháng</span></th>`;
  const vsMerged = `<div class="tbl-wrap"><table class="sheet vs-table">
    <caption class="sr-only">Vượng suy và trường sinh, hào 6 ở trên</caption>
    <thead>
      <tr class="grp"><th scope="colgroup" colspan="4">Quẻ chủ: ${chu.name}</th>${bien ? `<th scope="colgroup" colspan="4" class="split">Quẻ biến: ${bien.name}</th>` : ""}</tr>
      <tr>${vsHead(false)}${bien ? vsHead(true) : ""}</tr>
    </thead>
    <tbody>${order.map((i) => `<tr class="${rowCls(i)}">${vsCells(i, "chu", false)}${bien ? vsCells(i, "bien", true) : ""}</tr>`).join("")}</tbody>
  </table></div>`;
  const vsStacked = bien ? ["chu", "bien"].map((side) => `<div class="tbl-wrap"><table class="sheet vs-table">
      <caption>${side === "chu" ? `Quẻ chủ: ${chu.name}` : `Quẻ biến: ${bien.name}`}</caption>
      <thead><tr>${vsHead(false)}</tr></thead>
      <tbody>${order.map((i) => `<tr class="${rowCls(i)}">${vsCells(i, side, false).replace(/^<td>/, '<th scope="row">').replace(/<\/td>/, "</th>")}</tr>`).join("")}</tbody>
    </table></div>`).join("") : "";

  // ── Tổng hợp theo từng hào ──
  const cards = order.map((i) => {
    const h = chart.hao[i], c = ct[i].chu, b = ct[i].bien, tu = theUng(chu, i);
    const chuChips = [...c.sao.map(chipSao), ...c.trangThai.map(chipTT)].join("");
    let bienCol = "";
    if (b) {
      const btu = theUng(bien, i);
      const bChips = [...b.sao.map(chipSao), ...b.trangThai.map(chipTT), b.ngam ? chip(b.ngam, "ngam") : ""].join("");
      bienCol = `<div class="hc-col${b.tuHaoDong ? " from-dong" : ""}">
        <div class="hc-main"><b>${b.lucThan}</b> <span class="h-${b.hanh}">${b.can} ${b.chi} – ${b.hanh}</span>${btu ? ` <span class="tu-soft">${btu}</span>` : ""}</div>
        ${bChips ? `<div class="chips">${bChips}</div>` : `<div class="hint small">Không có gì nổi bật</div>`}
      </div>`;
    }
    return `<li class="hao-card${h.dong ? " moving" : ""}">
      <div class="hc-label">
        <b>${ct[i].ten}</b>
        ${barHTML(h.am_duong === "Dương", { dong: h.dong })}
        ${h.dong ? `<span class="badge-dong">${h.am_duong} động</span>` : ""}
      </div>
      <div class="hc-col">
        <div class="hc-main"><b>${h.lucThan}</b> <span class="h-${h.hanh}">${c.can} ${c.chi} – ${c.hanh}</span>${tu ? ` <span class="tu-${tu === "Thế" ? "the" : "ung"}">${tu}</span>` : ""}</div>
        <div class="hint small">Lục thú: ${h.lucThu}${h.phucThan ? ` · Phục thần: ${h.phucThan.lucThan} ${h.phucThan.chi} – ${h.phucThan.hanh}` : ""}</div>
        ${chuChips ? `<div class="chips">${chuChips}</div>` : `<div class="hint small">Không có gì nổi bật</div>`}
      </div>
      ${bienCol}
    </li>`;
  }).join("");

  const ngamItems = [];
  const ngamPlain = []; // cùng nội dung, dạng chữ thường cho ảnh
  if (bien) {
    ngam.quai.forEach((q) => {
      ngamItems.push(`<li><b>${q.vi} ${q.loai.toLowerCase()}</b>: ${q.lyDo}</li>`);
      ngamPlain.push(`${q.vi} ${q.loai.toLowerCase()}: ${q.lyDo}`);
    });
    const hn = ngam.hao.map((x, i) => (x ? `hào ${i + 1} ${chart.hao[i].chi} biến ${chart.hao[i].bien.chi} (${x.toLowerCase()})` : null)).filter(Boolean);
    if (hn.length) { ngamItems.push(`<li><b>Hào biến</b>: ${hn.join("; ")}</li>`); ngamPlain.push(`Hào biến: ${hn.join("; ")}`); }
    if (!ngamItems.length) { ngamItems.push("<li>Không có phản ngâm, không có phục ngâm.</li>"); ngamPlain.push("Không có phản ngâm, không có phục ngâm."); }
    if (ngam.hopXung) { ngamItems.push(`<li><b>${ngam.hopXung}</b></li>`); ngamPlain.push(ngam.hopXung); }
  }

  const tietStart = jdToLocalString(p.tiet.batDauJD, TZ);
  const thangAm = canChiThangAm(al.thang, al.nam);
  const amText = `giờ ${p.gio.chi}, ngày ${al.ngay} tháng ${al.thang}${al.nhuan ? " nhuận" : ""} (${thangAm}) năm ${canChiNam(al.nam)}`;

  resultEl.innerHTML = `
    <h2 class="sheet-title">Lá quẻ Lục Hào</h2>
    <dl class="info-grid">
      <div><dt>Thời điểm lập quẻ</dt><dd>${fmtDT(dt)} <span class="hint">(giờ Việt Nam${zi ? "" : ", đổi ngày lúc 0h"})</span></dd></div>
      <div><dt>Theo âm lịch</dt><dd>${amText}</dd></div>
      <div class="wide"><dt>Can chi</dt><dd>giờ <b>${gz(p.gio)}</b>, ngày <b>${gz(p.ngay)}</b>, tháng <b>${gz(p.thang)}</b> <span class="hint">(theo tiết khí)</span>, năm <b>${gz(p.nam)}</b></dd></div>
      <div><dt>Tiết khí</dt><dd><b>${tietKhi24(p.sunLongitude)}</b> <span class="hint">(tháng ${p.thang.chi} tính từ tiết ${p.tiet.ten}, ${tietStart})</span></dd></div>
      <div><dt>Tuần không</dt><dd><b>${p.tuanKhong.join(", ")}</b></dd></div>
      <div><dt>Nhật thần</dt><dd><b class="h-${CHI_HANH[p.ngay.chi]}">${p.ngay.chi} – ${CHI_HANH[p.ngay.chi]}</b></dd></div>
      <div><dt>Nguyệt lệnh</dt><dd><b class="h-${CHI_HANH[p.thang.chi]}">${p.thang.chi} – ${CHI_HANH[p.thang.chi]}</b></dd></div>
      <div><dt>Đào hoa</dt><dd>${daoHoa(p.ngay.chi)}</dd></div>
      <div><dt>Dịch mã</dt><dd>${dichMa(p.ngay.chi)}</dd></div>
    </dl>
    ${warn ? `<p class="warn" role="note">Gần giờ giao tiết, hãy đối chiếu tháng.</p>` : ""}

    <div class="gua-pair${bien ? "" : " single"}">
      ${guaFigure("Quẻ chủ", chu, chuBits, moving)}
      ${bien ? `<div class="gua-arrow" aria-hidden="true">biến<br>→</div>${guaFigure("Quẻ biến", bien, bienBits, moving)}` : ""}
    </div>
    ${bien ? "" : `<p class="hint center">Không có hào động nên không có quẻ biến (quẻ tĩnh).</p>`}

    ${bien ? `<div class="ngam"><h3>Phản ngâm · Phục ngâm · Lục hợp / Lục xung</h3><ul>${ngamItems.join("")}</ul></div>` : ""}

    <h3 class="sec">Bảng an quẻ</h3>
    <div class="${bien ? "only-wide" : ""}">${mainMerged}</div>
    ${bien ? `<div class="only-narrow stack">${mainStacked}</div>` : ""}

    <h3 class="sec">Vượng suy và trường sinh</h3>
    <div class="${bien ? "only-wide" : ""}">${vsMerged}</div>
    ${bien ? `<div class="only-narrow stack">${vsStacked}</div>` : ""}

    <h3 class="sec">Tổng hợp theo từng hào</h3>
    <div class="hc-head${bien ? "" : " single"}" aria-hidden="true"><span>Hào</span><span>Quẻ chủ</span>${bien ? "<span>Quẻ biến</span>" : ""}</div>
    <ol class="hao-cards${bien ? "" : " single"}">${cards}</ol>

    <details class="glossary">
      <summary>Giải thích các thuật ngữ</summary>
      <dl>
        <dt>Tuần không</dt><dd>Hai địa chi bị bỏ trống trong tuần mười ngày chứa ngày gieo quẻ. Hào gặp Tuần không tạm thời chưa có lực.</dd>
        <dt>Nguyệt phá</dt><dd>Địa chi của hào xung với tháng (nguyệt lệnh). Hào bị Nguyệt phá rất yếu trong tháng đó.</dd>
        <dt>Nhật xung · Ám động</dt><dd>Hào tĩnh đang vượng hoặc tướng mà bị ngày xung thì động ngầm, có tác dụng như hào động.</dd>
        <dt>Nhật xung · Nhật phá</dt><dd>Hào tĩnh đang hưu, tù hoặc tử mà bị ngày xung thì bị xung tán, càng yếu.</dd>
        <dt>Biến tử, Biến mộ, Biến tuyệt</dt><dd>Hào động biến ra địa chi mà ngũ hành của chính hào động ở giai đoạn Tử, Mộ hoặc Tuyệt (theo vòng Trường sinh). Hào động bị kéo yếu đi.</dd>
        <dt>Biến không</dt><dd>Hào động biến ra địa chi đang Tuần không.</dd>
        <dt>Lâm nguyệt lệnh, Lâm nhật thần</dt><dd>Địa chi của hào trùng với chi tháng hoặc chi ngày, được thêm lực.</dd>
        <dt>Vượng, Tướng, Hưu, Tù, Tử</dt><dd>Sức mạnh của hào theo tháng: cùng hành với tháng là Vượng, được tháng sinh là Tướng, sinh cho tháng là Hưu, khắc tháng là Tù, bị tháng khắc là Tử.</dd>
        <dt>Trường sinh</dt><dd>Mười hai giai đoạn (Trường sinh, Mộc dục, Quan đới, Lâm quan, Đế vượng, Suy, Bệnh, Tử, Mộ, Tuyệt, Thai, Dưỡng) của ngũ hành hào so với chi ngày và chi tháng. Lục hào cho Thổ theo Thủy.</dd>
        <dt>Đào hoa, Dịch mã</dt><dd>Tính theo chi ngày. Đào hoa liên quan tình cảm, sắc đẹp; Dịch mã liên quan đi lại, di chuyển, thay đổi.</dd>
        <dt>Phục thần</dt><dd>Lục thân vắng mặt trong quẻ chủ, lấy từ quẻ thuần của cung ở cùng vị trí hào.</dd>
      </dl>
    </details>

    <div class="result-actions">
      <button type="button" class="btn primary sm" id="save-img">Lưu ảnh lá quẻ</button>
      <button type="button" class="btn ghost sm" id="copy-text">Sao chép lá quẻ</button>
      ${EMBED ? "" : `<button type="button" class="btn ghost sm" id="copy-link">Chia sẻ link</button>`}
      <span class="hint" id="copy-status" aria-live="polite"></span>
    </div>`;
  resultEl.hidden = false;
  lastText = plainText(chart, ct, ngam, dt, warn, amText);

  // ── Dữ liệu cho ảnh lá quẻ (luchao-image.js chỉ vẽ, không tính) ──
  const ttImg = (list) => list.map((x) => ({ t: x.replace("Nhật xung · ", ""), k: TOT.has(x) ? "good" : XAU.has(x) ? "bad" : "info" }));
  const fig = (kind, g, bits) => ({
    kind, name: g.name, bits: bits.map((b) => b === "Dương"), moving,
    sub1: [`Cung ${g.palace} (${g.palaceHanh})`, g.stage, g.quaiTinh].filter(Boolean).join(" · "),
    sub2: `Thế hào ${g.the} · Ứng hào ${g.ung}`,
  });
  lastModel = {
    info: [
      ["Thời điểm lập quẻ", `${fmtDT(dt)} (giờ Việt Nam${zi ? "" : ", đổi ngày lúc 0h"})`],
      ["Theo âm lịch", amText],
      ["Can chi", `giờ ${gz(p.gio)}, ngày ${gz(p.ngay)}, tháng ${gz(p.thang)} (theo tiết khí), năm ${gz(p.nam)}`, true],
      ["Tiết khí", tietKhi24(p.sunLongitude)],
      ["Tuần không", p.tuanKhong.join(", ")],
      ["Nhật thần", `${p.ngay.chi} – ${CHI_HANH[p.ngay.chi]}`],
      ["Nguyệt lệnh", `${p.thang.chi} – ${CHI_HANH[p.thang.chi]}`],
      ["Đào hoa", daoHoa(p.ngay.chi)],
      ["Dịch mã", dichMa(p.ngay.chi)],
    ],
    warn,
    chu: fig("Quẻ chủ", chu, chuBits),
    bien: bien ? fig("Quẻ biến", bien, bienBits) : null,
    ngam: ngamPlain,
    rows: order.map((i) => {
      const h = chart.hao[i], c = ct[i].chu, b = ct[i].bien;
      return {
        moving: h.dong, lucThu: h.lucThu,
        chu: {
          duong: h.am_duong === "Dương", tu: theUng(chu, i), lt: h.lucThan, chi: h.chi, hanh: h.hanh,
          phuc: h.phucThan ? { text: `${h.phucThan.lucThan} ${h.phucThan.chi} – ${h.phucThan.hanh}`, hanh: h.phucThan.hanh } : null,
          tt: ttImg(c.trangThai),
        },
        bien: b ? {
          lt: b.lucThan, tu: theUng(bien, i), chi: b.chi, hanh: b.hanh, tt: ttImg(b.trangThai),
          duong: b.am_duong === "Dương", moving: b.tuHaoDong,
        } : null,
      };
    }),
    vs: order.map((i) => {
      const c = ct[i].chu, b = ct[i].bien;
      const v = (x) => ({ canChi: `${x.can} ${x.chi}`, hanh: x.hanh, vs: x.vuongSuy, tsN: x.tsNgay, tsT: x.tsThang });
      return { moving: chart.hao[i].dong, chu: v(c), bien: b ? v(b) : null };
    }),
    footer: EMBED ? "Lập quẻ Lục Hào online" : `Mở lại lá quẻ: ${location.host}${location.pathname}?h=${lines.join("")}&t=${dtEl.value.slice(0, 16)}${zi ? "" : "&z=0"}`,
    fileName: `la-que-${slug(chu.name)}${bien ? `-bien-${slug(bien.name)}` : ""}-${dt.y}${pad(dt.m)}${pad(dt.d)}-${pad(dt.h)}${pad(dt.mi)}.png`,
  };

  $("#save-img").addEventListener("click", saveImage);
  $("#copy-text").addEventListener("click", () => copy(lastText, "Đã chép lá quẻ"));
  $("#copy-link")?.addEventListener("click", () => copy(location.href, "Đã chép link"));
}

const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ───────── Lưu ảnh lá quẻ ─────────
let imgUrl = null;
function imgDialog() {
  let d = $("#img-dialog");
  if (d) return d;
  d = document.createElement("dialog");
  d.id = "img-dialog";
  d.className = "img-dialog";
  d.setAttribute("aria-labelledby", "img-dialog-title");
  d.innerHTML = `
    <div class="img-dialog-head">
      <h2 id="img-dialog-title">Ảnh lá quẻ</h2>
      <button type="button" class="btn ghost sm" data-close>Đóng</button>
    </div>
    <p class="hint" id="img-hint"></p>
    <div class="img-dialog-actions">
      <a class="btn primary sm" id="img-download" download>Tải ảnh về máy</a>
      <button type="button" class="btn ghost sm" id="img-share" hidden>Lưu vào Ảnh / Chia sẻ</button>
    </div>
    <div class="img-scroll"><img id="img-preview" alt="Ảnh lá quẻ Lục Hào"></div>`;
  document.body.appendChild(d);
  d.querySelector("[data-close]").addEventListener("click", () => d.close());
  d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
  return d;
}

async function saveImage() {
  if (!lastModel) return;
  const btn = $("#save-img");
  btn.disabled = true;
  btn.textContent = "Đang tạo ảnh…";
  try {
    const canvas = drawSheet(lastModel, 2);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    if (!blob) throw new Error("Trình duyệt không tạo được ảnh");
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    imgUrl = URL.createObjectURL(blob);
    const d = imgDialog();
    d.querySelector("#img-preview").src = imgUrl;
    const dl = d.querySelector("#img-download");
    dl.href = imgUrl;
    dl.download = lastModel.fileName;
    dl.hidden = EMBED; // khung nhúng chặn tải file
    const file = new File([blob], lastModel.fileName, { type: "image/png" });
    const share = d.querySelector("#img-share");
    const canShare = !EMBED && navigator.canShare && navigator.canShare({ files: [file] });
    share.hidden = !canShare;
    share.onclick = async () => {
      try { await navigator.share({ files: [file], title: "Lá quẻ Lục Hào" }); } catch { /* người dùng huỷ */ }
    };
    d.querySelector("#img-hint").textContent = EMBED
      ? `Ảnh ${canvas.width}×${canvas.height} px. Nhấn giữ (điện thoại) hoặc bấm chuột phải (máy tính) vào ảnh rồi chọn Lưu ảnh.`
      : `Ảnh PNG ${canvas.width}×${canvas.height} px. Nếu nút tải không chạy (ví dụ trong Zalo, Facebook), hãy nhấn giữ vào ảnh rồi chọn Lưu ảnh.`;
    if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
  } catch (err) {
    const st = $("#copy-status");
    if (st) st.textContent = `Không tạo được ảnh: ${err.message}`;
  } finally {
    btn.disabled = false;
    btn.textContent = "Lưu ảnh lá quẻ";
  }
}

function guaLine(g) {
  return `${g.name} – cung ${g.palace} (${g.palaceHanh}), ${g.stage}, Thế hào ${g.the}, Ứng hào ${g.ung}${g.quaiTinh ? `, ${g.quaiTinh}` : ""}`;
}

function plainText(chart, ct, ngam, dt, warn, amText) {
  const p = chart.pillars;
  const { chu, bien } = chart;
  const out = [];
  out.push("LÁ QUẺ LỤC HÀO");
  out.push(`Thời điểm: ${fmtDT(dt)} (giờ VN) · Âm lịch: ${amText}`);
  out.push(`Can chi: giờ ${gz(p.gio)}, ngày ${gz(p.ngay)}, tháng ${gz(p.thang)} (theo tiết khí), năm ${gz(p.nam)}`);
  out.push(`Tiết khí: ${tietKhi24(p.sunLongitude)} · Tuần không: ${p.tuanKhong.join(", ")} · Nhật thần: ${p.ngay.chi}-${CHI_HANH[p.ngay.chi]} · Nguyệt lệnh: ${p.thang.chi}-${CHI_HANH[p.thang.chi]}`);
  out.push(`Đào hoa: ${daoHoa(p.ngay.chi)} · Dịch mã: ${dichMa(p.ngay.chi)}`);
  if (warn) out.push("Lưu ý: gần giờ giao tiết, hãy đối chiếu tháng.");
  out.push(`Quẻ chủ: ${guaLine(chu)}`);
  out.push(bien ? `Quẻ biến: ${guaLine(bien)}` : "Quẻ tĩnh (không có hào động)");
  if (bien) {
    const notes = [...ngam.tongKet];
    const hn = ngam.hao.map((x, i) => (x ? `hào ${i + 1} ${x.toLowerCase()}` : null)).filter(Boolean);
    if (hn.length) notes.push(hn.join(", "));
    if (ngam.hopXung) notes.push(ngam.hopXung);
    out.push(`Phản ngâm / Phục ngâm: ${notes.length ? notes.join("; ") : "không có"}`);
  }
  out.push("");
  for (const i of [5, 4, 3, 2, 1, 0]) {
    const h = chart.hao[i], c = ct[i].chu, b = ct[i].bien;
    const tu = theUng(chu, i);
    const bar = h.am_duong === "Dương" ? "▅▅▅" : "▅ ▅";
    const parts = [
      `${ct[i].ten}: ${bar}${h.dong ? ` (${h.am_duong.toLowerCase()} động)` : ""}`,
      h.lucThu,
      `${h.lucThan} ${c.can} ${c.chi}-${c.hanh}${tu ? ` [${tu}]` : ""}`,
      c.vuongSuy,
    ];
    const extra = [...c.sao, ...c.trangThai];
    if (h.phucThan) extra.push(`Phục thần ${h.phucThan.lucThan} ${h.phucThan.chi}-${h.phucThan.hanh}`);
    if (extra.length) parts.push(extra.join(", "));
    let line = parts.join(" · ");
    if (b) {
      const btu = theUng(bien, i);
      const bx = [...b.sao, ...b.trangThai, b.ngam].filter(Boolean);
      line += `  →  ${b.lucThan} ${b.can} ${b.chi}-${b.hanh}${btu ? ` [${btu}]` : ""}${bx.length ? ` (${bx.join(", ")})` : ""}`;
    }
    out.push(line);
  }
  if (!EMBED) { out.push(""); out.push(location.href); }
  return out.join("\n");
}

async function copy(text, okMsg) {
  const st = $("#copy-status");
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch { /* bỏ qua */ }
    ta.remove();
  }
  if (st) { st.textContent = okMsg; setTimeout(() => { st.textContent = ""; }, 2000); }
}

// ───────── Khởi động: đọc URL ─────────
function init() {
  bindRows();
  const q = new URLSearchParams(location.search);
  let h = q.get("h");
  let t = q.get("t");
  let z = q.get("z");
  const hm = /^#q-([6789]{6})-(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(-z0)?$/.exec(location.hash);
  if (!h && hm) { h = hm[1]; t = `${hm[2]}-${hm[3]}-${hm[4]}T${hm[5]}:${hm[6]}`; z = hm[7] ? "0" : null; }
  dtEl.value = t && parseDT(t) ? t.slice(0, 16) : nowVN();
  ziEl.checked = z !== "0";
  const valid = h && /^[6789]{6}$/.test(h);
  if (valid) [...h].forEach((c, i) => { lines[i] = Number(c); });
  syncUI();
  if (valid) cast(false);
}
init();
