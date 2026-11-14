// In lá quẻ dạng bảng chữ để đối chiếu với app khác.
// Dùng: node scripts/dump-chart.mjs 997888 2026-11-08T14:18 [z0]
import { castChart } from "../assets/luchao-core.js";
import { chiTietHao, amLich, tietKhi24, canChiThangAm } from "../assets/luchao-info.js";

const [h, t, z] = process.argv.slice(2);
const [d, tm] = t.split("T");
const [y, m, dd] = d.split("-").map(Number);
const [hh, mi] = tm.split(":").map(Number);
const zi = z !== "z0";
const c = castChart([...h].map(Number), { y, m, d: dd, h: hh, mi }, { tz: 7, ziHourNextDay: zi });
const ct = chiTietHao(c);
const p = c.pillars;
const gz = (x) => `${x.can} ${x.chi}`;
let ad = { y, m, d: dd };
if (zi && hh >= 23) { const n = new Date(Date.UTC(y, m - 1, dd + 1)); ad = { y: n.getUTCFullYear(), m: n.getUTCMonth() + 1, d: n.getUTCDate() }; }
const al = amLich(ad.d, ad.m, ad.y);
console.log(`${c.chu.name} → ${c.bien ? c.bien.name : "(tĩnh)"} | cung ${c.chu.palace}${c.chu.quaiTinh ? " " + c.chu.quaiTinh : ""}${c.bien ? " | biến cung " + c.bien.palace + (c.bien.quaiTinh ? " " + c.bien.quaiTinh : "") : ""}`);
console.log(`Can chi: giờ ${gz(p.gio)}, ngày ${gz(p.ngay)}, tháng ${gz(p.thang)}, năm ${gz(p.nam)} | Âm lịch ${al.ngay}/${al.thang}${al.nhuan ? " nhuận" : ""}/${al.nam} (tháng ${canChiThangAm(al.thang, al.nam)}) | Tiết ${tietKhi24(p.sunLongitude)} | Tuần không ${p.tuanKhong.join(" ")}`);
for (let i = 5; i >= 0; i--) {
  const x = c.hao[i], a = ct[i].chu, b = ct[i].bien;
  const tu = c.chu.the === i + 1 ? "Thế" : c.chu.ung === i + 1 ? "Ứng" : "";
  const btu = c.bien ? (c.bien.the === i + 1 ? "Thế" : c.bien.ung === i + 1 ? "Ứng" : "") : "";
  const k = (f) => (f.includes("Tuần không") ? "K" : "-");
  const chu = `H${i + 1}${x.dong ? "*" : " "} ${tu.padEnd(3)} ${x.lucThan} ${x.chi}-${x.hanh} | phục ${x.phucThan ? x.phucThan.lucThan + " " + x.phucThan.chi : "-"} | TK ${k(a.trangThai)} | ${a.can} ${a.chi} ${a.vuongSuy} ${a.tsNgay} ${a.tsThang}`;
  const bien = b ? ` || ${b.lucThan} ${b.chi}-${b.hanh} ${btu} | ${x.lucThu} | TK ${k(b.trangThai)} | ${b.can} ${b.chi} ${b.vuongSuy} ${b.tsNgay} ${b.tsThang}` : ` || ${x.lucThu}`;
  console.log(chu + bien);
}
