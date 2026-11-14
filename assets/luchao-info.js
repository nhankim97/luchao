// luchao-info.js — Thông tin bổ sung cho lá quẻ (KHÔNG sửa luchao-core.js):
// nạp can, vượng suy theo nguyệt lệnh, trường sinh theo ngày/tháng, Đào hoa, Dịch mã,
// trạng thái Tuần không / Nguyệt phá / Nhật xung (ám động hay nhật phá), 24 tiết khí, âm lịch.
import { CAN, CHI, CHI_HANH } from "./luchao-core.js";
import { phanPhucNgam } from "./luchao-extra.js";

const SINH = { Kim: "Thủy", Thủy: "Mộc", Mộc: "Hỏa", Hỏa: "Thổ", Thổ: "Kim" };
const KHAC = { Kim: "Mộc", Mộc: "Thổ", Thổ: "Thủy", Thủy: "Hỏa", Hỏa: "Kim" };
const xung = (a, b) => (CHI.indexOf(a) + 6) % 12 === CHI.indexOf(b);

// Nạp can: [nội quái (hào 1–3), ngoại quái (hào 4–6)]
export const NAP_CAN = {
  Càn: ["Giáp", "Nhâm"], Khôn: ["Ất", "Quý"], Chấn: ["Canh", "Canh"], Tốn: ["Tân", "Tân"],
  Khảm: ["Mậu", "Mậu"], Ly: ["Kỷ", "Kỷ"], Cấn: ["Bính", "Bính"], Đoài: ["Đinh", "Đinh"],
};
export const napCan = (upper, lower) => [0, 1, 2, 3, 4, 5].map((i) => (i < 3 ? NAP_CAN[lower][0] : NAP_CAN[upper][1]));

// Vượng suy theo nguyệt lệnh: cùng hành Vượng, lệnh sinh hào Tướng, hào sinh lệnh Hưu, hào khắc lệnh Tù, lệnh khắc hào Tử
export function vuongSuy(hanh, lenhHanh) {
  if (hanh === lenhHanh) return "Vượng";
  if (SINH[lenhHanh] === hanh) return "Tướng";
  if (SINH[hanh] === lenhHanh) return "Hưu";
  if (KHAC[hanh] === lenhHanh) return "Tù";
  return "Tử";
}

// 12 cung trường sinh; Lục hào cho Thổ theo Thủy (cùng trường sinh tại Thân)
export const TRUONG_SINH = ["Trường sinh", "Mộc dục", "Quan đới", "Lâm quan", "Đế vượng", "Suy", "Bệnh", "Tử", "Mộ", "Tuyệt", "Thai", "Dưỡng"];
const SINH_TAI = { Mộc: "Hợi", Hỏa: "Dần", Kim: "Tỵ", Thủy: "Thân", Thổ: "Thân" };
export const truongSinh = (hanh, chi) => TRUONG_SINH[(CHI.indexOf(chi) - CHI.indexOf(SINH_TAI[hanh]) + 12) % 12];

// Đào hoa, Dịch mã theo chi ngày (nhóm tam hợp)
const TAM_HOP = { Thân: 0, Tý: 0, Thìn: 0, Dần: 1, Ngọ: 1, Tuất: 1, Tỵ: 2, Dậu: 2, Sửu: 2, Hợi: 3, Mão: 3, Mùi: 3 };
const DICH_MA = ["Dần", "Thân", "Hợi", "Tỵ"];
const DAO_HOA = ["Dậu", "Mão", "Ngọ", "Tý"];
export const dichMa = (ngayChi) => DICH_MA[TAM_HOP[ngayChi]];
export const daoHoa = (ngayChi) => DAO_HOA[TAM_HOP[ngayChi]];
export function sao(chi, ngayChi) {
  const out = [];
  if (daoHoa(ngayChi) === chi) out.push("Đào hoa");
  if (dichMa(ngayChi) === chi) out.push("Dịch mã");
  return out;
}

// Tuần không / Nguyệt phá / Nhật xung của một địa chi
export function chiFlags(chi, p) {
  const f = [];
  if (p.tuanKhong.includes(chi)) f.push("Tuần không");
  if (xung(chi, p.thang.chi)) f.push("Nguyệt phá");
  if (xung(chi, p.ngay.chi)) f.push("Nhật xung");
  return f;
}

const HAO_TEN = ["Hào Sơ", "Hào Nhị", "Hào Tam", "Hào Tứ", "Hào Ngũ", "Hào Thượng"];

/**
 * Thông tin bổ sung cho từng hào (index 0 = hào 1).
 * Hào tĩnh bị Nhật xung: vượng/tướng → "Ám động", hưu/tù/tử → "Nhật phá"
 * (Tăng San Bốc Dịch Bình Thích, chương 23 "Ám động").
 */
export function chiTietHao(chart) {
  const p = chart.pillars;
  const lenh = CHI_HANH[p.thang.chi];
  const ngam = phanPhucNgam(chart);
  const canChu = napCan(chart.chu.upper, chart.chu.lower);
  const canBien = chart.bien ? napCan(chart.bien.upper, chart.bien.lower) : null;
  const info = (chi, can, dong) => {
    const hanh = CHI_HANH[chi];
    const vs = vuongSuy(hanh, lenh);
    const trangThai = [];
    if (chi === p.thang.chi) trangThai.push("Lâm nguyệt lệnh");
    if (chi === p.ngay.chi) trangThai.push("Lâm nhật thần");
    for (const f of chiFlags(chi, p)) {
      if (f === "Nhật xung" && dong === false) trangThai.push(["Vượng", "Tướng"].includes(vs) ? "Nhật xung · Ám động" : "Nhật xung · Nhật phá");
      else trangThai.push(f);
    }
    return {
      can, chi, hanh, vuongSuy: vs,
      tsNgay: truongSinh(hanh, p.ngay.chi),
      tsThang: truongSinh(hanh, p.thang.chi),
      sao: sao(chi, p.ngay.chi),
      trangThai,
    };
  };
  return chart.hao.map((h, i) => {
    const chu = info(h.chi, canChu[i], h.dong);
    let bien = null;
    if (chart.bienFull) {
      const bf = chart.bienFull[i];
      bien = { ...info(bf.chi, canBien[i], null), lucThan: bf.lucThan, am_duong: bf.am_duong, tuHaoDong: h.dong, ngam: ngam.hao[i] };
    }
    return { ten: HAO_TEN[i], viTri: i + 1, chu, bien };
  });
}

// 24 tiết khí theo kinh độ Mặt Trời (0° = Xuân Phân)
const TIET_24 = ["Xuân Phân", "Thanh Minh", "Cốc Vũ", "Lập Hạ", "Tiểu Mãn", "Mang Chủng", "Hạ Chí", "Tiểu Thử",
  "Đại Thử", "Lập Thu", "Xử Thử", "Bạch Lộ", "Thu Phân", "Hàn Lộ", "Sương Giáng", "Lập Đông", "Tiểu Tuyết",
  "Đại Tuyết", "Đông Chí", "Tiểu Hàn", "Đại Hàn", "Lập Xuân", "Vũ Thủy", "Kinh Trập"];
export const tietKhi24 = (sunLongitude) => TIET_24[Math.floor((((sunLongitude % 360) + 360) % 360) / 15)];

// ───── Âm lịch Việt Nam (thuật toán Hồ Ngọc Đức) ─────
const INT = Math.floor;
function jdFromDate(dd, mm, yy) {
  const a = INT((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3;
  let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
  if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  return jd;
}
function newMoon(k) {
  const T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = Math.PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat = T < -11
    ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
    : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return Jd1 + C1 - deltat;
}
const newMoonDay = (k, tz) => INT(newMoon(k) + 0.5 + tz / 24);
function sunLongitudeRad(jdn) {
  const T = (jdn - 2451545.0) / 36525, T2 = T * T, dr = Math.PI / 180;
  const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  L -= Math.PI * 2 * INT(L / (Math.PI * 2));
  return L;
}
const sunSector = (dayNumber, tz) => INT(sunLongitudeRad(dayNumber - 0.5 - tz / 24) / Math.PI * 6);
function lunarMonth11(yy, tz) {
  const k = INT((jdFromDate(31, 12, yy) - 2415021) / 29.530588853);
  let nm = newMoonDay(k, tz);
  if (sunSector(nm, tz) >= 9) nm = newMoonDay(k - 1, tz);
  return nm;
}
function leapMonthOffset(a11, tz) {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last, i = 1, arc = sunSector(newMoonDay(k + i, tz), tz);
  do { last = arc; i++; arc = sunSector(newMoonDay(k + i, tz), tz); } while (arc !== last && i < 14);
  return i - 1;
}
/** Dương lịch → âm lịch Việt Nam. @returns {{ngay:number, thang:number, nam:number, nhuan:boolean}} */
export function amLich(dd, mm, yy, tz = 7) {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = newMoonDay(k + 1, tz);
  if (monthStart > dayNumber) monthStart = newMoonDay(k, tz);
  let a11 = lunarMonth11(yy, tz), b11 = a11, nam;
  if (a11 >= monthStart) { nam = yy; a11 = lunarMonth11(yy - 1, tz); }
  else { nam = yy + 1; b11 = lunarMonth11(yy + 1, tz); }
  const ngay = dayNumber - monthStart + 1;
  const diff = INT((monthStart - a11) / 29);
  let nhuan = false, thang = diff + 11;
  if (b11 - a11 > 365) {
    const leapDiff = leapMonthOffset(a11, tz);
    if (diff >= leapDiff) { thang = diff + 10; if (diff === leapDiff) nhuan = true; }
  }
  if (thang > 12) thang -= 12;
  if (thang >= 11 && diff < 4) nam -= 1;
  return { ngay, thang, nam, nhuan };
}
export const canChiNam = (y) => `${CAN[((y - 4) % 10 + 10) % 10]} ${CHI[((y - 4) % 12 + 12) % 12]}`;
// Can chi tháng âm lịch (chỉ để hiển thị; tháng dùng để luận vẫn theo tiết khí).
// Ngũ Hổ Độn theo can năm âm lịch; tháng nhuận lấy can chi của tháng chính.
export const canChiThangAm = (thang, namAm) => {
  const canNam = ((namAm - 4) % 10 + 10) % 10;
  return `${CAN[((canNam % 5) * 2 + 2 + thang - 1) % 10]} ${CHI[(thang + 1) % 12]}`;
};
