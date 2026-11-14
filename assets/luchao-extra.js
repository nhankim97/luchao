// luchao-extra.js — Phần bổ sung cho lõi (KHÔNG sửa luchao-core.js):
// Phản ngâm, Phục ngâm, và chuyển biến Lục hợp / Lục xung giữa quẻ chủ và quẻ biến.
// Chỉ xét theo QUẺ CHỦ → HÀO ĐỘNG → QUẺ BIẾN (so địa chi nạp giáp), theo Tăng San Bốc Dịch Bình Thích,
// chương "Phản phục":
//  - Hào động biến ra chi xung chi gốc → hào phản ngâm; ra đúng chi gốc → hào phục ngâm.
//  - Quái (nội/ngoại) có hào động, biến ra quái mới mà cả ba địa chi đều XUNG ba chi cũ → quái phản ngâm
//    (Thăng biến Quan: nội ngoại phản ngâm; Quan biến Khôn: ngoại; Tốn biến Quan: nội).
//  - Quái có hào động, biến ra quái mới mà ba địa chi GIỐNG HỆT → quái phục ngâm (Vô Vọng biến Đại Tráng).
// KHÔNG dùng quy tắc "hai quái đối phương vị" (Càn–Khôn, Càn–Tốn…), vì quy tắc đó gán phản ngâm
// cả khi không hào động nào biến ra chi xung; chính Vương Hổ Ứng cũng nói nó ứng nghiệm kém hào biến phản ngâm.
import { NAP_GIAP, CHI } from "./luchao-core.js";

const xung = (a, b) => (CHI.indexOf(a) + 6) % 12 === CHI.indexOf(b);

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
    { vi: "Nội quái", k: 0, idx: [0, 1, 2], from: chu.lower, to: bien.lower },
    { vi: "Ngoại quái", k: 1, idx: [3, 4, 5], from: chu.upper, to: bien.upper },
  ];
  for (const p of parts) {
    const dong = p.idx.filter((i) => chart.hao[i].dong);
    if (!dong.length) continue; // quái này không có hào động
    const a = NAP_GIAP[p.from][p.k], b = NAP_GIAP[p.to][p.k];
    const haoDong = dong.map((i) => `hào ${i + 1} ${chart.hao[i].chi}→${chart.hao[i].bien.chi}`).join(", ");
    const route = `${p.from} biến ${p.to} (hào động: ${haoDong})`;
    if (a.every((c, j) => c === b[j])) {
      out.quai.push({ vi: p.vi, loai: "Phục ngâm", lyDo: `${route}, ba địa chi giữ nguyên ${a.join(" ")}` });
    } else if (a.every((c, j) => xung(c, b[j]))) {
      out.quai.push({ vi: p.vi, loai: "Phản ngâm", lyDo: `${route}, ba địa chi đều xung: ${a.map((c, j) => `${c}–${b[j]}`).join(", ")}` });
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
