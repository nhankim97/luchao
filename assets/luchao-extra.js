// luchao-extra.js — Phần bổ sung cho lõi (KHÔNG sửa luchao-core.js):
// Phản ngâm, Phục ngâm, và chuyển biến Lục hợp / Lục xung giữa quẻ chủ và quẻ biến.
// Định nghĩa theo Tăng San Bốc Dịch Bình Thích (Vương Hổ Ứng), chương "Phản phục":
//  - Quái (nội/ngoại) động biến ra ba địa chi đều XUNG với ba chi cũ → quái phản ngâm
//    (Thăng biến Quan: nội ngoại phản ngâm; Quan biến Khôn: ngoại; Tốn biến Quan: nội).
//  - Quái động biến sang quái ĐỐI PHƯƠNG VỊ (tiên thiên: Càn–Khôn, Khảm–Ly, Chấn–Tốn, Cấn–Đoài;
//    hậu thiên: Càn–Tốn, Khảm–Ly, Cấn–Khôn, Chấn–Đoài) → cũng gọi là phản ngâm (Càn biến Khôn, Càn biến Tốn).
//  - Quái động biến ra ba địa chi GIỐNG HỆT ba chi cũ → quái phục ngâm (Vô Vọng biến Đại Tráng).
//  - Hào động biến ra chi xung chi gốc → hào phản ngâm; ra đúng chi gốc → hào phục ngâm.
import { NAP_GIAP, CHI } from "./luchao-core.js";

const xung = (a, b) => (CHI.indexOf(a) + 6) % 12 === CHI.indexOf(b);
const TIEN_THIEN = [["Càn", "Khôn"], ["Khảm", "Ly"], ["Chấn", "Tốn"], ["Cấn", "Đoài"]];
const HAU_THIEN = [["Càn", "Tốn"], ["Khảm", "Ly"], ["Cấn", "Khôn"], ["Chấn", "Đoài"]];
const isPair = (list, a, b) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

/**
 * @param chart kết quả castChart()
 * @returns {{ hao: (null|"Phản ngâm"|"Phục ngâm")[], quai: {vi:"Nội quái"|"Ngoại quái", loai:"Phản ngâm"|"Phục ngâm", lyDo:string}[], tongKet: string[], hopXung: string|null }}
 */
export function phanPhucNgam(chart) {
  const out = { hao: Array(6).fill(null), quai: [], tongKet: [], hopXung: null };
  const { chu, bien } = chart;
  if (!bien) return out;

  chart.hao.forEach((h, i) => {
    if (!h.bien) return;
    if (h.bien.chi === h.chi) out.hao[i] = "Phục ngâm";
    else if (xung(h.chi, h.bien.chi)) out.hao[i] = "Phản ngâm";
  });

  const parts = [
    { vi: "Nội quái", k: 0, from: chu.lower, to: bien.lower },
    { vi: "Ngoại quái", k: 1, from: chu.upper, to: bien.upper },
  ];
  for (const p of parts) {
    if (p.from === p.to) continue; // quái này không động
    const a = NAP_GIAP[p.from][p.k], b = NAP_GIAP[p.to][p.k];
    const route = `${p.from} biến ${p.to}`;
    if (a.every((c, j) => c === b[j])) {
      out.quai.push({ vi: p.vi, loai: "Phục ngâm", lyDo: `${route}, địa chi giữ nguyên ${a.join(" ")}` });
    } else if (a.every((c, j) => xung(c, b[j]))) {
      out.quai.push({ vi: p.vi, loai: "Phản ngâm", lyDo: `${route}, địa chi xung: ${a.map((c, j) => `${c}–${b[j]}`).join(", ")}` });
    } else if (isPair(TIEN_THIEN, p.from, p.to) || isPair(HAU_THIEN, p.from, p.to)) {
      const kieu = isPair(TIEN_THIEN, p.from, p.to) ? "tiên thiên" : "hậu thiên";
      out.quai.push({ vi: p.vi, loai: "Phản ngâm", lyDo: `${route}, hai quái đối phương vị ${kieu}` });
    }
  }

  for (const loai of ["Phản ngâm", "Phục ngâm"]) {
    const vis = out.quai.filter((q) => q.loai === loai).map((q) => q.vi);
    if (vis.length === 2) out.tongKet.push(`Nội ngoại đều ${loai.toLowerCase()}`);
    else if (vis.length === 1) out.tongKet.push(`${vis[0]} ${loai.toLowerCase()}`);
  }

  if (chu.quaiTinh || bien.quaiTinh) {
    const a = chu.quaiTinh || "quẻ thường", b = bien.quaiTinh || "quẻ thường";
    out.hopXung = `${a[0].toUpperCase()}${a.slice(1)} biến ${b}`;
  }
  return out;
}
