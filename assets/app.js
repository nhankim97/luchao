// app.js — chỉ lo giao diện: đọc input, gọi castChart, vẽ lá quẻ, đồng bộ URL.
// Toàn bộ quy tắc an quẻ nằm trong luchao-core.js (không sửa).
import { castChart, solarTermJD, jdToLocalString } from "./luchao-core.js";

const TZ = 7;
const STATES = [
  { v: 7, sym: "—", txt: "Dương", label: "Dương" },
  { v: 8, sym: "- -", txt: "Âm", label: "Âm" },
  { v: 9, sym: "O", txt: "Động", label: "Dương động" },
  { v: 6, sym: "X", txt: "Động", label: "Âm động" },
];
const CYCLE = [7, 8, 9, 6];
const FLAG_SHORT = { "Không": "K", "Nguyệt phá": "NP", "Nhật xung": "NX" };
// Tên rút gọn chỉ để hiển thị trên màn hình hẹp (≤480px)
const SHORT = {
  "Huynh Đệ": "Huynh", "Tử Tôn": "Tử", "Thê Tài": "Tài", "Quan Quỷ": "Quỷ", "Phụ Mẫu": "Phụ",
  "Thanh Long": "Long", "Chu Tước": "Tước", "Câu Trần": "Câu", "Đằng Xà": "Xà", "Bạch Hổ": "Hổ", "Huyền Vũ": "Vũ",
};
const nm = (full) => `<span class="full">${full}</span><span class="short" aria-hidden="true">${SHORT[full]}</span>`;

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
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
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

function barHTML(isDuong, mark = "", small = false) {
  const cls = `bar ${isDuong ? "duong" : "am"}${small ? " sm" : ""}`;
  const inner = isDuong ? "<i></i>" : "<i></i><i></i>";
  return `<span class="${cls}" aria-hidden="true">${inner}${mark ? `<span class="mk">${mark}</span>` : ""}</span>`;
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
    const st = STATES.find((s) => s.v === v);
    btn.innerHTML = st ? barHTML(v === 7 || v === 9, v === 9 ? "O" : v === 6 ? "X" : "") : `<span class="glyph-empty">chưa chọn</span>`;
    btn.setAttribute("aria-label", `Hào ${n}: ${st ? st.label : "chưa chọn"}. Bấm để đổi trạng thái`);
  });
  const missing = lines.filter((v) => v === null).length;
  castBtn.disabled = missing > 0;
  statusEl.textContent = missing ? `Còn ${missing} hào chưa chọn` : "";
  if (document.activeElement !== quickEl) {
    quickEl.value = missing ? "" : lines.join("");
  }
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
  history.replaceState(null, "", location.pathname);
  syncUI();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  cast(true);
});

// ───────── Lập quẻ & vẽ ─────────
let lastText = "";

function cast(scroll) {
  if (lines.some((v) => v === null)) return;
  let dt = parseDT(dtEl.value);
  if (!dt) { dtEl.value = nowVN(); dt = parseDT(dtEl.value); }
  const zi = ziEl.checked;
  const chart = castChart([...lines], dt, { tz: TZ, ziHourNextDay: zi });
  render(chart, dt);
  // Ghép tay để giữ dấu ":" dễ đọc: ?h=998788&t=2026-11-08T14:18
  const q = `?h=${lines.join("")}&t=${dtEl.value.slice(0, 16)}${zi ? "" : "&z=0"}`;
  history.replaceState(null, "", location.pathname + q);
  if (scroll) resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

function nearTermWarning(p, dt) {
  const jd = jdOf(dt);
  const start = p.tiet.batDauJD;
  const nextLon = (Math.floor(((p.sunLongitude - 315 + 360) % 360) / 30) * 30 + 315 + 30) % 360;
  const next = solarTermJD(nextLon, start + 30.4);
  const mins = Math.min(Math.abs(jd - start), Math.abs(next - jd)) * 1440;
  return mins < 30;
}

const gz = (x) => `${x.can} ${x.chi}`;
const flagsTxt = (f) => f.map((x) => `(${FLAG_SHORT[x]})`).join(" ");
const flagsHTML = (f) => f.map((x) => `<wbr><abbr class="flag" title="${x}">(${FLAG_SHORT[x]})</abbr>`).join("");

function guaDesc(g) {
  const bits = [`cung ${g.palace} – ${g.palaceHanh}`, g.stage];
  if (g.quaiTinh) bits.push(g.quaiTinh);
  return bits.join(", ");
}

function render(chart, dt) {
  const p = chart.pillars;
  const { chu, bien } = chart;
  const warn = nearTermWarning(p, dt);
  const tietStart = jdToLocalString(p.tiet.batDauJD, TZ);

  const rows = [];
  for (let i = 5; i >= 0; i--) {
    const h = chart.hao[i];
    const bf = chart.bienFull ? chart.bienFull[i] : null;
    const cls = [h.dong ? "moving" : "", h.the ? "is-the" : "", h.ung ? "is-ung" : ""].filter(Boolean).join(" ");
    const tu = h.the ? `<span class="tag the">Thế</span>` : h.ung ? `<span class="tag ung">Ứng</span>` : "";
    const phuc = h.phucThan ? `<span class="h-${h.phucThan.hanh}">${nm(h.phucThan.lucThan)} ${h.phucThan.chi}</span><span class="hanh"> ${h.phucThan.hanh}</span>` : "";
    let bienCell = "";
    if (bf) {
      bienCell = barHTML(bf.am_duong === "Dương", "", true);
      if (h.bien) {
        bienCell += `<span class="h-${h.bien.hanh}">${nm(h.bien.lucThan)} ${h.bien.chi}</span><span class="hanh"> ${h.bien.hanh}</span>${flagsHTML(h.bien.flags)}`;
      }
    }
    rows.push(`<tr class="${cls}">
      <th scope="row" class="lucthu">${nm(h.lucThu)}</th>
      <td class="phuc">${phuc}</td>
      <td class="lt"><span class="h-${h.hanh}">${nm(h.lucThan)} ${h.chi}</span>${flagsHTML(h.flags)}</td>
      <td class="hanh col-hanh h-${h.hanh}">${h.hanh}</td>
      <td class="col-bar">${barHTML(h.am_duong === "Dương")}<span class="sr-only">Hào ${h.viTri} ${h.am_duong}</span></td>
      <td>${tu}</td>
      <td class="col-mk">${h.kyHieu}</td>
      <td class="bien-cell">${bienCell}</td>
    </tr>`);
  }

  resultEl.innerHTML = `
    <h2>Lá quẻ</h2>
    <p class="pillars">
      <b>${gz(p.nam)}</b> năm · <b>${gz(p.thang)}</b> tháng · <b>${gz(p.ngay)}</b> ngày · <b>${gz(p.gio)}</b> giờ
      <br>Tuần không: <b>${p.tuanKhong.join(" ")}</b> · Tiết: <b>${p.tiet.ten}</b> <span class="hint">(từ ${tietStart})</span>
      · <span class="hint">Gieo lúc ${fmtDT(dt)}${ziEl.checked ? "" : ", đổi ngày lúc 0h"}</span>
    </p>
    ${warn ? `<p class="warn" role="note">Gần giờ giao tiết, hãy đối chiếu tháng.</p>` : ""}
    <p class="gua-names">
      Quẻ chủ: <span class="name">${chu.name}</span> <span class="hint">(${guaDesc(chu)})</span>
      ${bien ? `<br>→ Quẻ biến: <span class="name">${bien.name}</span> <span class="hint">(${guaDesc(bien)})</span>` : `<br><span class="hint">Không có hào động (quẻ tĩnh).</span>`}
    </p>
    <div class="table-wrap">
    <table class="chart">
      <caption>Quẻ chủ ${esc(chu.name)}${bien ? ` biến ${esc(bien.name)}` : ""}, hào 6 ở trên, hào 1 ở dưới</caption>
      <thead><tr>
        <th scope="col">Lục thú</th>
        <th scope="col">Phục thần</th>
        <th scope="col">Quẻ chủ</th>
        <th scope="col" class="col-hanh">Hành</th>
        <th scope="col" class="col-bar"><span class="sr-only">Vạch quẻ</span></th>
        <th scope="col"><span class="sr-only">Thế Ứng</span></th>
        <th scope="col" class="col-mk"><span class="sr-only">Động</span></th>
        <th scope="col">${bien ? "Quẻ biến" : ""}</th>
      </tr></thead>
      <tbody>${rows.join("")}</tbody>
    </table>
    </div>
    <p class="legend">(K) Tuần không · (NP) Nguyệt phá · (NX) Nhật xung · O dương động · X âm động · nền vàng: hào động</p>
    <div class="result-actions">
      <button type="button" class="btn ghost sm" id="copy-text">Sao chép lá quẻ</button>
      <button type="button" class="btn ghost sm" id="copy-link">Chia sẻ link</button>
      <span class="hint" id="copy-status" aria-live="polite"></span>
    </div>`;
  resultEl.hidden = false;
  lastText = plainText(chart, dt, warn);
  $("#copy-text").addEventListener("click", () => copy(lastText, "Đã chép lá quẻ"));
  $("#copy-link").addEventListener("click", () => copy(location.href, "Đã chép link"));
}

function plainText(chart, dt, warn) {
  const p = chart.pillars;
  const { chu, bien } = chart;
  const W = [11, 14, 26, 5, 5, 3];
  const col = (s, w) => { s = String(s); return s.length >= w ? `${s} ` : s + " ".repeat(w - s.length); };
  const out = [];
  out.push(`${gz(p.nam)} năm · ${gz(p.thang)} tháng · ${gz(p.ngay)} ngày · ${gz(p.gio)} giờ | Tuần không: ${p.tuanKhong.join(" ")} | Tiết: ${p.tiet.ten}`);
  out.push(`Gieo lúc ${fmtDT(dt)} (giờ VN)`);
  if (warn) out.push("Lưu ý: gần giờ giao tiết, hãy đối chiếu tháng.");
  out.push(`Quẻ chủ: ${chu.name} (${guaDesc(chu)})${bien ? ` → Quẻ biến: ${bien.name}` : ""}`);
  out.push("");
  out.push(col("Lục thú", W[0]) + col("Phục thần", W[1]) + col("Quẻ chủ", W[2] + W[3] + W[4] + W[5]) + (bien ? "Quẻ biến" : ""));
  for (let i = 5; i >= 0; i--) {
    const h = chart.hao[i];
    const phuc = h.phucThan ? `${h.phucThan.lucThan} ${h.phucThan.chi}` : "";
    const main = [`${h.lucThan} ${h.chi} ${h.hanh}`, flagsTxt(h.flags)].filter(Boolean).join(" ");
    const bar = h.am_duong === "Dương" ? "—" : "- -";
    const tu = h.the ? "Thế" : h.ung ? "Ứng" : "";
    const bv = h.bien ? [`${h.bien.lucThan} ${h.bien.chi} ${h.bien.hanh}`, flagsTxt(h.bien.flags)].filter(Boolean).join(" ") : "";
    out.push((col(h.lucThu, W[0]) + col(phuc, W[1]) + col(main, W[2]) + col(bar, W[3]) + col(tu, W[4]) + col(h.kyHieu, W[5]) + bv).trimEnd());
  }
  out.push("");
  out.push(location.href);
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
  const h = q.get("h");
  const t = q.get("t");
  dtEl.value = t && parseDT(t) ? t.slice(0, 16) : nowVN();
  ziEl.checked = q.get("z") !== "0";
  const valid = h && /^[6789]{6}$/.test(h);
  if (valid) [...h].forEach((c, i) => { lines[i] = Number(c); });
  syncUI();
  if (valid) cast(false);
}
init();
