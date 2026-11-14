// app.js — chỉ lo giao diện: đọc input, gọi castChart, vẽ lá quẻ, đồng bộ URL.
// Quy tắc an quẻ nằm trong luchao-core.js (không sửa); phản/phục ngâm trong luchao-extra.js.
import { castChart, solarTermJD, jdToLocalString, CHI_HANH } from "./luchao-core.js";
import { phanPhucNgam } from "./luchao-extra.js";

const TZ = 7;
const STATES = {
  7: { label: "Dương", duong: true, dong: false },
  8: { label: "Âm", duong: false, dong: false },
  9: { label: "Dương động", duong: true, dong: true },
  6: { label: "Âm động", duong: false, dong: true },
};
const CYCLE = [7, 8, 9, 6];
const FLAG_SHORT = { "Không": "K", "Nguyệt phá": "NP", "Nhật xung": "NX" };

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

function barHTML(isDuong, { dong = false, small = false } = {}) {
  const cls = `bar ${isDuong ? "duong" : "am"}${dong ? " dong" : ""}${small ? " sm" : ""}`;
  return `<span class="${cls}" aria-hidden="true">${isDuong ? "<i></i>" : "<i></i><i></i>"}</span>`;
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
  const ngam = phanPhucNgam(chart);
  // Ghép tay để giữ dấu ":" dễ đọc: ?h=997888&t=2026-11-08T14:18
  const q = `?h=${lines.join("")}&t=${dtEl.value.slice(0, 16)}${zi ? "" : "&z=0"}`;
  history.replaceState(null, "", location.pathname + q);
  render(chart, ngam, dt);
  if (scroll) resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

function nearTermWarning(p, dt) {
  const jd = jdOf(dt);
  const start = p.tiet.batDauJD;
  const nextLon = (Math.floor(((p.sunLongitude - 315 + 360) % 360) / 30) * 30 + 315 + 30) % 360;
  const next = solarTermJD(nextLon, start + 30.4);
  return Math.min(Math.abs(jd - start), Math.abs(next - jd)) * 1440 < 30;
}

const gz = (x) => `${x.can} ${x.chi}`;
const flagsTxt = (f) => f.map((x) => `(${FLAG_SHORT[x]})`).join(" ");
const flagsHTML = (f) => f.map((x) => ` <abbr class="flag" title="${x}">(${FLAG_SHORT[x]})</abbr>`).join("");
const theUng = (g, i) => (g.the === i + 1 ? "Thế" : g.ung === i + 1 ? "Ứng" : "");

// Ô "Lục thân + Can chi + Ngũ hành" hai dòng: "Huynh Đệ" / "Thìn Thổ (K)"
const ltCell = (lucThan, chi, hanh, flags = []) =>
  `<span class="lt-name h-${hanh}">${lucThan}</span> <span class="lt-chi h-${hanh}">${chi} ${hanh}</span>${flagsHTML(flags)}`;

function guaCard(title, g, extraNote = "") {
  return `<div class="gua-card">
    <div class="gua-kind">${title}</div>
    <div class="gua-name">${g.name}</div>
    <dl>
      <dt>Thuộc cung</dt><dd>${g.palace} <span class="h-${g.palaceHanh}">(${g.palaceHanh})</span></dd>
      <dt>Thứ tự</dt><dd>${g.stage}</dd>
      <dt>Thế / Ứng</dt><dd>Thế hào ${g.the} · Ứng hào ${g.ung}</dd>
      <dt>Lục xung / hợp</dt><dd>${g.quaiTinh ? `<span class="pill">${g.quaiTinh}</span>` : "Không"}</dd>
    </dl>${extraNote}
  </div>`;
}

function render(chart, ngam, dt) {
  const p = chart.pillars;
  const { chu, bien } = chart;
  const warn = nearTermWarning(p, dt);
  const tietStart = jdToLocalString(p.tiet.batDauJD, TZ);

  const rows = [];
  for (let i = 5; i >= 0; i--) {
    const h = chart.hao[i];
    const bf = chart.bienFull ? chart.bienFull[i] : null;
    const cls = [h.dong ? "moving" : "", h.the ? "is-the" : "", h.ung ? "is-ung" : ""].filter(Boolean).join(" ");
    const tu = theUng(chu, i);
    const tags = [
      tu ? `<span class="tag ${tu === "Thế" ? "the" : "ung"}">${tu}</span>` : "",
      h.dong ? `<span class="tag dong">${h.am_duong} động</span>` : "",
    ].join("");
    const phuc = h.phucThan ? ltCell(h.phucThan.lucThan, h.phucThan.chi, h.phucThan.hanh) : "";
    let bienCell = "";
    if (bf) {
      const btu = theUng(bien, i);
      const nm = ngam.hao[i];
      bienCell = `<div class="bien-in${h.dong ? " from-dong" : ""}">
        ${barHTML(bf.am_duong === "Dương", { small: true })}
        <div>${ltCell(bf.lucThan, bf.chi, bf.hanh, h.bien ? h.bien.flags : [])}
        ${btu ? `<span class="tag soft">${btu}</span>` : ""}${nm ? `<span class="tag ngam">${nm}</span>` : ""}</div>
      </div>`;
    }
    rows.push(`<tr class="${cls}">
      <th scope="row" class="lucthu">${h.lucThu}</th>
      <td class="phuc">${phuc}</td>
      <td class="lt">${ltCell(h.lucThan, h.chi, h.hanh, h.flags)}</td>
      <td class="col-hao">${barHTML(h.am_duong === "Dương", { dong: h.dong })}<div class="tags">${tags}</div><span class="sr-only">Hào ${h.viTri}</span></td>
      ${bien ? `<td class="bien-cell">${bienCell}</td>` : ""}
    </tr>`);
  }

  const ngamList = [];
  if (bien) {
    ngam.quai.forEach((q) => ngamList.push(`<li><b>${q.vi} ${q.loai.toLowerCase()}</b>: ${q.lyDo}</li>`));
    const haoNgam = ngam.hao.map((x, i) => (x ? `hào ${i + 1} ${chart.hao[i].chi} → ${chart.hao[i].bien.chi} (${x.toLowerCase()})` : null)).filter(Boolean);
    if (haoNgam.length) ngamList.push(`<li><b>Hào biến</b>: ${haoNgam.join("; ")}</li>`);
  }

  resultEl.innerHTML = `
    <h2>Lá quẻ</h2>
    <div class="pillar-grid" role="list">
      <div role="listitem"><span>Năm</span><b>${gz(p.nam)}</b></div>
      <div role="listitem"><span>Tháng</span><b>${gz(p.thang)}</b></div>
      <div role="listitem"><span>Ngày</span><b>${gz(p.ngay)}</b></div>
      <div role="listitem"><span>Giờ</span><b>${gz(p.gio)}</b></div>
    </div>
    <ul class="meta">
      <li>Tuần không: <b>${p.tuanKhong.join(" ")}</b></li>
      <li>Nguyệt lệnh: <b class="h-${CHI_HANH[p.thang.chi]}">${p.thang.chi} ${CHI_HANH[p.thang.chi]}</b> · Nhật thần: <b class="h-${CHI_HANH[p.ngay.chi]}">${p.ngay.chi} ${CHI_HANH[p.ngay.chi]}</b></li>
      <li>Tiết: <b>${p.tiet.ten}</b> <span class="hint">(từ ${tietStart})</span></li>
      <li class="hint">Gieo lúc ${fmtDT(dt)} giờ VN${ziEl.checked ? "" : ", đổi ngày lúc 0h"}</li>
    </ul>
    ${warn ? `<p class="warn" role="note">Gần giờ giao tiết, hãy đối chiếu tháng.</p>` : ""}
    <div class="gua-cards">
      ${guaCard("Quẻ chủ", chu)}
      ${bien ? guaCard("Quẻ biến", bien, `<p class="hint small">Lục thân quẻ biến tính theo cung quẻ chủ (${chu.palace} – ${chu.palaceHanh}).</p>`) : `<div class="gua-card"><div class="gua-kind">Quẻ biến</div><p>Không có hào động nên không có quẻ biến (quẻ tĩnh).</p></div>`}
    </div>
    ${bien ? `<div class="ngam">
      <h3>Phản ngâm · Phục ngâm · Hợp/Xung</h3>
      <ul>
        ${ngamList.length ? ngamList.join("") : "<li>Không có phản ngâm, không có phục ngâm.</li>"}
        ${ngam.hopXung ? `<li><b>${ngam.hopXung}</b></li>` : ""}
      </ul>
    </div>` : ""}
    <div class="table-wrap">
    <table class="chart${bien ? "" : " no-bien"}">
      <caption>Hào 6 ở trên, hào 1 ở dưới</caption>
      <thead><tr>
        <th scope="col">Lục thú</th>
        <th scope="col">Phục thần</th>
        <th scope="col">Quẻ chủ<br><span class="th-sub">${chu.name}</span></th>
        <th scope="col">Hào</th>
        ${bien ? `<th scope="col">Quẻ biến<br><span class="th-sub">${bien.name}</span></th>` : ""}
      </tr></thead>
      <tbody>${rows.join("")}</tbody>
    </table>
    </div>
    <p class="legend">
      ${barHTML(true)} dương · ${barHTML(false)} âm ·
      ${barHTML(true, { dong: true })} vạch đỏ = <b>hào động</b> (dương động biến thành âm, âm động biến thành dương) ·
      (K) Tuần không · (NP) Nguyệt phá · (NX) Nhật xung
    </p>
    <div class="result-actions">
      <button type="button" class="btn ghost sm" id="copy-text">Sao chép lá quẻ</button>
      <button type="button" class="btn ghost sm" id="copy-link">Chia sẻ link</button>
      <span class="hint" id="copy-status" aria-live="polite"></span>
    </div>`;
  resultEl.hidden = false;
  lastText = plainText(chart, ngam, dt, warn);
  $("#copy-text").addEventListener("click", () => copy(lastText, "Đã chép lá quẻ"));
  $("#copy-link").addEventListener("click", () => copy(location.href, "Đã chép link"));
}

function guaLine(g) {
  return `${g.name} – cung ${g.palace} (${g.palaceHanh}), ${g.stage}, Thế hào ${g.the}, Ứng hào ${g.ung}${g.quaiTinh ? `, ${g.quaiTinh}` : ""}`;
}

function plainText(chart, ngam, dt, warn) {
  const p = chart.pillars;
  const { chu, bien } = chart;
  const col = (s, w) => { s = String(s); return s.length >= w ? `${s} ` : s + " ".repeat(w - s.length); };
  const out = [];
  out.push(`Năm ${gz(p.nam)} · Tháng ${gz(p.thang)} · Ngày ${gz(p.ngay)} · Giờ ${gz(p.gio)}`);
  out.push(`Tuần không: ${p.tuanKhong.join(" ")} · Tiết: ${p.tiet.ten} · Gieo lúc ${fmtDT(dt)} (giờ VN)`);
  if (warn) out.push("Lưu ý: gần giờ giao tiết, hãy đối chiếu tháng.");
  out.push(`Quẻ chủ: ${guaLine(chu)}`);
  out.push(bien ? `Quẻ biến: ${guaLine(bien)}` : "Quẻ tĩnh (không có hào động)");
  if (bien) {
    const notes = [...ngam.tongKet];
    const haoNgam = ngam.hao.map((x, i) => (x ? `hào ${i + 1} ${x.toLowerCase()}` : null)).filter(Boolean);
    if (haoNgam.length) notes.push(haoNgam.join(", "));
    if (ngam.hopXung) notes.push(ngam.hopXung);
    out.push(`Phản/Phục ngâm: ${notes.length ? notes.join("; ") : "không"}`);
  }
  out.push("");
  out.push(col("Lục thú", 11) + col("Phục thần", 18) + col("Quẻ chủ", 41) + (bien ? "Quẻ biến" : ""));
  for (let i = 5; i >= 0; i--) {
    const h = chart.hao[i];
    const phuc = h.phucThan ? `${h.phucThan.lucThan} ${h.phucThan.chi} ${h.phucThan.hanh}` : "";
    const main = [`${h.lucThan} ${h.chi} ${h.hanh}`, flagsTxt(h.flags)].filter(Boolean).join(" ");
    const bar = h.am_duong === "Dương" ? "▅▅▅" : "▅ ▅";
    const tu = theUng(chu, i);
    const dong = h.dong ? `${h.am_duong.toLowerCase()} động` : "";
    let bv = "";
    if (chart.bienFull) {
      const bf = chart.bienFull[i];
      bv = [bf.am_duong === "Dương" ? "▅▅▅" : "▅ ▅", `${bf.lucThan} ${bf.chi} ${bf.hanh}`, h.bien ? flagsTxt(h.bien.flags) : "", theUng(bien, i)].filter(Boolean).join(" ");
    }
    out.push((col(h.lucThu, 11) + col(phuc, 18) + col(main, 22) + col(bar, 4) + col(tu, 4) + col(dong, 11) + bv).trimEnd());
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
