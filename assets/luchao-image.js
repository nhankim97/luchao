// luchao-image.js — Vẽ ảnh lá quẻ bằng Canvas (không chụp màn hình), để ảnh luôn cùng một bố cục,
// rõ nét ở mọi thiết bị. Khổ logic rộng 1200, xuất ở scale 2 → ảnh PNG rộng 2400 px.
// Nhận "model" đã tính sẵn từ app.js; module này KHÔNG tính quẻ.

const C = {
  bg: "#fffdf8", ink: "#2a211c", muted: "#6b5d52", line: "#e4d9c8", brand: "#7a1f1f", soft: "#fbeee0",
  head: "#fdf8f1", moving: "#fff4d6", dong: "#c0281f", the: "#b3261e", ung: "#1d5fa8",
  ngamBg: "#f6f1fb", ngamLine: "#e0d4ee", warnBg: "#fff3cd", warnInk: "#5c4400",
  hanh: { Kim: "#5f6672", Mộc: "#286e2c", Thủy: "#1565c0", Hỏa: "#c62828", Thổ: "#75590f" },
  pill: {
    good: ["#1d6b2a", "#8cc79a", "#eef8f0"], bad: ["#a3201a", "#e6a29d", "#fdf0ef"],
    info: ["#1d4f8c", "#9dbbe0", "#eef4fb"], sao: ["#8a3a00", "#e9b88c", "#fff4e8"], ngam: ["#ffffff", "#6a3d9a", "#6a3d9a"],
  },
  vs: { Vượng: "#286e2c", Tướng: "#286e2c", Hưu: "#6b5d52", Tù: "#c0281f", Tử: "#c0281f" },
};
const FONT = '"Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif';
const F = (size, weight = 400) => `${weight} ${size}px ${FONT}`;

const W = 1200, P = 40, IN = W - 2 * P;

function painter(ctx, meas) {
  const c = ctx || meas;
  const rr = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  return {
    font(s) { c.font = s; },
    w(t) { return c.measureText(t).width; },
    text(t, x, y, color = C.ink, align = "left") {
      if (!ctx) return;
      ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "middle"; ctx.fillText(t, x, y);
    },
    box(x, y, w, h, { fill, stroke, r = 0, lw = 1 } = {}) {
      if (!ctx) return;
      rr(x, y, w, h, r);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
    },
    line(x1, y1, x2, y2, color = C.line, lw = 1) {
      if (!ctx) return;
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    },
    // Ngắt dòng theo khoảng trắng, dùng font hiện tại
    wrap(t, maxW) {
      const words = String(t).split(" "), out = [];
      let cur = "";
      for (const w of words) {
        const test = cur ? `${cur} ${w}` : w;
        if (c.measureText(test).width <= maxW || !cur) cur = test; else { out.push(cur); cur = w; }
      }
      if (cur) out.push(cur);
      return out;
    },
  };
}

// Vạch quẻ: dương một thanh, âm hai thanh
function bar(g, ctx, cx, cy, w, h, duong, color) {
  if (!ctx) return;
  const gap = Math.round(w * 0.16);
  if (duong) g.box(cx - w / 2, cy - h / 2, w, h, { fill: color, r: 2 });
  else {
    const half = (w - gap) / 2;
    g.box(cx - w / 2, cy - h / 2, half, h, { fill: color, r: 2 });
    g.box(cx + gap / 2, cy - h / 2, half, h, { fill: color, r: 2 });
  }
}

// Xếp các nhãn (pill) trong ô rộng cw; trả về chiều cao cần
function pills(g, list, x, cy, cw, draw) {
  const PH = 18, GAP = 4, PAD = 5;
  g.font(F(11, 600));
  const rows = [[]];
  let rowW = 0;
  for (const p of list) {
    const pw = g.w(p.t) + PAD * 2;
    if (rowW && rowW + GAP + pw > cw) { rows.push([]); rowW = 0; }
    rows[rows.length - 1].push({ ...p, pw });
    rowW += (rowW ? GAP : 0) + pw;
  }
  const h = rows.length * PH + (rows.length - 1) * GAP;
  if (draw) {
    let y = cy - h / 2;
    for (const row of rows) {
      const tw = row.reduce((s, p) => s + p.pw, 0) + GAP * (row.length - 1);
      let px = x + (cw - tw) / 2;
      for (const p of row) {
        const [ink, border, bg] = C.pill[p.k] || C.pill.info;
        g.box(px, y, p.pw, PH, { fill: bg, stroke: border, r: 3 });
        g.text(p.t, px + p.pw / 2, y + PH / 2 + 1, ink, "center");
        px += p.pw + GAP;
      }
      y += PH + GAP;
    }
  }
  return h;
}

function layout(ctx, meas, m) {
  const g = painter(ctx, meas);
  let y = P;

  // Khung ngoài + tiêu đề
  g.font(F(34, 800));
  g.text("LÁ QUẺ LỤC HÀO", W / 2, y + 22, C.brand, "center");
  y += 58;

  // ── Thông tin chung ──
  const LBL = 160, COLW = (IN - 32 - 24) / 2;
  const rows = [];
  for (let i = 0; i < m.info.length; i++) {
    const it = m.info[i];
    if (it[2]) rows.push([it]);
    else if (m.info[i + 1] && !m.info[i + 1][2]) { rows.push([it, m.info[i + 1]]); i++; }
    else rows.push([it]);
  }
  g.font(F(19));
  const rowLines = rows.map((r) => r.map((it) => g.wrap(it[1], (r.length === 1 && it[2] ? IN - 32 : COLW) - LBL)));
  const LH = 29;
  const infoH = rowLines.reduce((s, r) => s + Math.max(...r.map((l) => l.length)) * LH + 6, 0) + 24;
  g.box(P, y, IN, infoH, { fill: C.soft, r: 10 });
  let iy = y + 12;
  rows.forEach((r, ri) => {
    const n = Math.max(...rowLines[ri].map((l) => l.length));
    r.forEach((it, ci) => {
      const x = P + 16 + ci * (COLW + 24);
      g.font(F(18)); g.text(it[0], x, iy + LH / 2, C.muted);
      g.font(F(19, 600));
      rowLines[ri][ci].forEach((ln, li) => g.text(ln, x + LBL, iy + LH / 2 + li * LH, it[3] || C.ink));
    });
    iy += n * LH + 6;
  });
  y += infoH + 14;

  if (m.warn) {
    g.box(P, y, IN, 40, { fill: C.warnBg, stroke: "#e6c65c", r: 8 });
    g.font(F(17, 600)); g.text("Gần giờ giao tiết, hãy đối chiếu tháng.", P + 16, y + 20, C.warnInk);
    y += 54;
  }

  // ── Hai quẻ vẽ lớn ──
  const figs = m.bien ? [[m.chu, P + IN * 0.25], [m.bien, P + IN * 0.75]] : [[m.chu, W / 2]];
  const BW = 190, BH = 24, BG = 15;
  for (const [fg, cx] of figs) {
    g.font(F(16, 700)); g.text(fg.kind.toUpperCase(), cx, y + 10, C.muted, "center");
    g.font(F(32, 800)); g.text(fg.name.toUpperCase(), cx, y + 46, C.dong, "center");
    for (let k = 0; k < 6; k++) {
      const i = 5 - k;
      bar(g, ctx, cx, y + 88 + k * (BH + BG) + BH / 2, BW, BH, fg.bits[i], fg.moving[i] ? C.dong : C.ink);
    }
    const sy = y + 88 + 6 * BH + 5 * BG + 26;
    g.font(F(18)); g.text(fg.sub1, cx, sy, C.muted, "center");
    g.text(fg.sub2, cx, sy + 27, C.muted, "center");
  }
  if (m.bien) {
    const my = y + 88 + (6 * BH + 5 * BG) / 2;
    g.font(F(20, 700)); g.text("biến", W / 2, my - 16, C.muted, "center");
    g.font(F(34, 700)); g.text("→", W / 2, my + 16, C.muted, "center");
  }
  y += 88 + 6 * BH + 5 * BG + 26 + 27 + 24;
  if (!m.bien) {
    g.font(F(17)); g.text("Không có hào động nên không có quẻ biến (quẻ tĩnh).", W / 2, y, C.muted, "center");
    y += 30;
  }

  // ── Phản ngâm / phục ngâm ──
  if (m.ngam.length) {
    g.font(F(18));
    const lines = m.ngam.flatMap((t) => g.wrap(`• ${t}`, IN - 32));
    const h = 14 + 30 + lines.length * 27 + 12;
    g.box(P, y, IN, h, { fill: C.ngamBg, stroke: C.ngamLine, r: 10 });
    g.font(F(19, 700)); g.text("Phản ngâm · Phục ngâm · Lục hợp / Lục xung", P + 16, y + 28, C.ink);
    g.font(F(18)); lines.forEach((ln, i) => g.text(ln, P + 16, y + 58 + i * 27, C.ink));
    y += h + 18;
  }

  // ── Tiêu đề mục ──
  const section = (t) => {
    g.box(P, y + 4, 6, 26, { fill: C.brand, r: 2 });
    g.font(F(22, 700)); g.text(t, P + 18, y + 17, C.ink);
    y += 44;
  };

  // ── Bảng an quẻ (một bảng: quẻ chủ | quẻ biến) ──
  section("Bảng an quẻ");
  const colsChu = [
    { t: "Hào", w: 74 }, { t: "Thế / Ứng", w: 78 }, { t: "Lục thân", w: 104 }, { t: "Can chi", w: 104 },
    { t: "Phục thần", w: 150 }, { t: "Trạng thái", w: m.bien ? 150 : 210 },
  ];
  const colsBien = m.bien
    ? [{ t: "Lục thân", w: 128 }, { t: "Can chi", w: 104 }, { t: "Lục thú", w: 108 }, { t: "Trạng thái", w: 64 + 50 }, { t: "Hào", w: 66 }]
    : [{ t: "Lục thú", w: 400 }];
  // Cân lại cho tổng đúng bằng IN
  const all = [...colsChu, ...colsBien];
  const sum = all.reduce((s, c) => s + c.w, 0);
  all.forEach((c) => { c.w = (c.w * IN) / sum; });
  let cx0 = P;
  all.forEach((c) => { c.x = cx0; cx0 += c.w; });
  const splitX = m.bien ? colsBien[0].x : null;

  const tableTop = y;
  if (m.bien) {
    g.box(P, y, IN, 36, { fill: C.soft });
    g.font(F(17, 700));
    g.text(`Quẻ chủ: ${m.chu.name}`, P + 12, y + 18, C.brand);
    g.text(`Quẻ biến: ${m.bien.name}`, splitX + 12, y + 18, C.brand);
    y += 36;
  }
  g.box(P, y, IN, 36, { fill: C.head });
  g.font(F(15, 600));
  all.forEach((c) => g.text(c.t, c.x + c.w / 2, y + 18, C.muted, "center"));
  y += 36;

  for (const r of m.rows) {
    // chiều cao hàng theo số dòng nhãn trạng thái
    const ttChu = pills(g, r.chu.tt, 0, 0, colsChu[5].w - 10, false);
    const ttBien = r.bien ? pills(g, r.bien.tt, 0, 0, colsBien[3].w - 10, false) : 0;
    const rh = Math.max(50, ttChu + 18, ttBien + 18);
    const cy = y + rh / 2;
    if (r.moving) g.box(P, y, IN, rh, { fill: C.moving });
    g.line(P, y, P + IN, y);
    const [cHao, cTu, cLt, cCc, cPhuc, cTt] = colsChu;
    bar(g, ctx, cHao.x + cHao.w / 2, cy, 50, 12, r.chu.duong, r.moving ? C.dong : C.ink);
    if (r.chu.tu) { g.font(F(18, 700)); g.text(r.chu.tu, cTu.x + cTu.w / 2, cy, r.chu.tu === "Thế" ? C.the : C.ung, "center"); }
    g.font(F(18, 700)); g.text(r.chu.lt, cLt.x + cLt.w / 2, cy, r.moving ? C.dong : C.ink, "center");
    g.font(F(18)); g.text(`${r.chu.chi} – ${r.chu.hanh}`, cCc.x + cCc.w / 2, cy, C.hanh[r.chu.hanh], "center");
    if (r.chu.phuc) { g.font(F(16)); g.text(r.chu.phuc.text, cPhuc.x + cPhuc.w / 2, cy, C.hanh[r.chu.phuc.hanh], "center"); }
    else { g.font(F(16)); g.text("–", cPhuc.x + cPhuc.w / 2, cy, C.muted, "center"); }
    if (r.chu.tt.length) pills(g, r.chu.tt, cTt.x + 5, cy, cTt.w - 10, true);
    else { g.font(F(16)); g.text("–", cTt.x + cTt.w / 2, cy, C.muted, "center"); }
    if (r.bien) {
      const [bLt, bCc, bThu, bTt, bHao] = colsBien;
      g.font(F(18, 700));
      const ltW = g.w(r.bien.lt);
      g.font(F(15, 600));
      const tuW = r.bien.tu ? g.w(r.bien.tu) + 6 : 0;
      const sx = bLt.x + (bLt.w - ltW - tuW) / 2;
      g.font(F(18, 700)); g.text(r.bien.lt, sx, cy, r.bien.moving ? C.dong : C.ink);
      if (r.bien.tu) { g.font(F(15, 600)); g.text(r.bien.tu, sx + ltW + 6, cy, C.muted); }
      g.font(F(18)); g.text(`${r.bien.chi} – ${r.bien.hanh}`, bCc.x + bCc.w / 2, cy, C.hanh[r.bien.hanh], "center");
      g.font(F(17)); g.text(r.lucThu, bThu.x + bThu.w / 2, cy, C.ink, "center");
      if (r.bien.tt.length) pills(g, r.bien.tt, bTt.x + 5, cy, bTt.w - 10, true);
      else { g.font(F(16)); g.text("–", bTt.x + bTt.w / 2, cy, C.muted, "center"); }
      bar(g, ctx, bHao.x + bHao.w / 2, cy, 46, 12, r.bien.duong, r.bien.moving ? C.dong : C.ink);
    } else {
      const c = colsBien[0];
      g.font(F(17)); g.text(r.lucThu, c.x + c.w / 2, cy, C.ink, "center");
    }
    y += rh;
  }
  g.box(P, tableTop, IN, y - tableTop, { stroke: C.line, r: 8 });
  if (splitX) g.line(splitX, tableTop, splitX, y, C.brand, 3);
  y += 26;

  // ── Vượng suy và trường sinh ──
  section("Vượng suy và trường sinh");
  const half = m.bien ? IN / 2 : IN;
  const vsCols = (x0) => {
    const ws = [0.25, 0.23, 0.26, 0.26];
    let x = x0;
    return ws.map((f) => { const c = { x, w: half * f }; x += half * f; return c; });
  };
  const vc = vsCols(P), vb = m.bien ? vsCols(P + half) : null;
  const vTop = y;
  if (m.bien) {
    g.box(P, y, IN, 36, { fill: C.soft });
    g.font(F(17, 700));
    g.text(`Quẻ chủ: ${m.chu.name}`, P + 12, y + 18, C.brand);
    g.text(`Quẻ biến: ${m.bien.name}`, P + half + 12, y + 18, C.brand);
    y += 36;
  }
  g.box(P, y, IN, 50, { fill: C.head });
  const heads = [["Hào", ""], ["Vượng suy", "theo tháng"], ["Trường sinh", "theo ngày"], ["Trường sinh", "theo tháng"]];
  for (const cols of [vc, vb].filter(Boolean)) {
    cols.forEach((c, k) => {
      g.font(F(15, 600)); g.text(heads[k][0], c.x + c.w / 2, y + (heads[k][1] ? 17 : 25), C.muted, "center");
      if (heads[k][1]) { g.font(F(13)); g.text(heads[k][1], c.x + c.w / 2, y + 35, C.muted, "center"); }
    });
  }
  y += 50;
  for (const r of m.vs) {
    const rh = 42, cy = y + rh / 2;
    if (r.moving) g.box(P, y, IN, rh, { fill: C.moving });
    g.line(P, y, P + IN, y);
    for (const [cols, x] of [[vc, r.chu], [vb, r.bien]]) {
      if (!cols || !x) continue;
      g.font(F(18, 600)); g.text(x.canChi, cols[0].x + cols[0].w / 2, cy, C.hanh[x.hanh], "center");
      g.font(F(18, 700)); g.text(x.vs, cols[1].x + cols[1].w / 2, cy, C.vs[x.vs], "center");
      g.font(F(17)); g.text(x.tsN, cols[2].x + cols[2].w / 2, cy, C.ink, "center");
      g.text(x.tsT, cols[3].x + cols[3].w / 2, cy, C.ink, "center");
    }
    y += rh;
  }
  g.box(P, vTop, IN, y - vTop, { stroke: C.line, r: 8 });
  if (m.bien) g.line(P + half, vTop, P + half, y, C.brand, 3);
  y += 22;

  // ── Chú thích + chân trang ──
  g.font(F(15));
  const legend = g.wrap("Vạch đỏ là hào động: dương động biến thành âm, âm động biến thành dương. Ám động và Nhật phá là hào tĩnh bị Nhật xung (vượng thì ám động, suy thì nhật phá).", IN);
  legend.forEach((ln, i) => g.text(ln, P, y + 10 + i * 23, C.muted));
  y += legend.length * 23 + 16;
  g.line(P, y, P + IN, y);
  g.font(F(16, 600)); g.text(m.footer, W / 2, y + 24, C.brand, "center");
  y += 40;

  return y + P - 10;
}

/** Vẽ lá quẻ, trả về <canvas> (kích thước thật = 1200·scale × chiều cao·scale). */
export function drawSheet(model, scale = 2) {
  const meas = document.createElement("canvas").getContext("2d");
  const H = Math.ceil(layout(null, meas, model));
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.strokeRect(10, 10, W - 20, H - 20);
  layout(ctx, meas, model);
  return canvas;
}
