// luchao-core.js — Lõi tính lá quẻ Lục Hào (Nạp Giáp, Bát Cung, trường phái Vương Hổ Ứng / Tăng San Bốc Dịch)
// ES module, không phụ thuộc thư viện. Chạy được trong trình duyệt và Node >= 18.
// Đã kiểm thử với test.mjs (5 lá quẻ thật chụp từ app + các bất biến của 64 quẻ).

// ───────────────────────── Bảng gốc ─────────────────────────
export const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
export const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

export const CHI_HANH = {
  Tý: "Thủy", Hợi: "Thủy", Dần: "Mộc", Mão: "Mộc", Tỵ: "Hỏa", Ngọ: "Hỏa",
  Thân: "Kim", Dậu: "Kim", Thìn: "Thổ", Tuất: "Thổ", Sửu: "Thổ", Mùi: "Thổ",
};
const SINH = { Kim: "Thủy", Thủy: "Mộc", Mộc: "Hỏa", Hỏa: "Thổ", Thổ: "Kim" }; // A sinh SINH[A]
const KHAC = { Kim: "Mộc", Mộc: "Thổ", Thổ: "Thủy", Thủy: "Hỏa", Hỏa: "Kim" }; // A khắc KHAC[A]

// Quái đơn: vạch từ DƯỚI lên TRÊN, 1 = dương, 0 = âm
export const TRIGRAM = {
  Càn: [1, 1, 1], Đoài: [1, 1, 0], Ly: [1, 0, 1], Chấn: [1, 0, 0],
  Tốn: [0, 1, 1], Khảm: [0, 1, 0], Cấn: [0, 0, 1], Khôn: [0, 0, 0],
};
export const TRIGRAM_HANH = {
  Càn: "Kim", Đoài: "Kim", Ly: "Hỏa", Chấn: "Mộc", Tốn: "Mộc", Khảm: "Thủy", Cấn: "Thổ", Khôn: "Thổ",
};
// Nạp giáp: [nội quái (hào 1-3), ngoại quái (hào 4-6)]
export const NAP_GIAP = {
  Càn: [["Tý", "Dần", "Thìn"], ["Ngọ", "Thân", "Tuất"]],
  Khảm: [["Dần", "Thìn", "Ngọ"], ["Thân", "Tuất", "Tý"]],
  Cấn: [["Thìn", "Ngọ", "Thân"], ["Tuất", "Tý", "Dần"]],
  Chấn: [["Tý", "Dần", "Thìn"], ["Ngọ", "Thân", "Tuất"]],
  Tốn: [["Sửu", "Hợi", "Dậu"], ["Mùi", "Tỵ", "Mão"]],
  Ly: [["Mão", "Sửu", "Hợi"], ["Dậu", "Mùi", "Tỵ"]],
  Khôn: [["Mùi", "Tỵ", "Mão"], ["Sửu", "Hợi", "Dậu"]],
  Đoài: [["Tỵ", "Mão", "Sửu"], ["Hợi", "Dậu", "Mùi"]],
};

// 64 quẻ theo Bát Cung. Mỗi cung 8 quẻ theo thứ tự:
// Thuần, Nhất thế, Nhị thế, Tam thế, Tứ thế, Ngũ thế, Du hồn, Quy hồn
// Mỗi phần tử: [ngoại quái, nội quái, tên]
export const PALACES = ["Càn", "Khảm", "Cấn", "Chấn", "Tốn", "Ly", "Khôn", "Đoài"];
const THE_POS = [6, 1, 2, 3, 4, 5, 4, 3];
const STAGE = ["Bát thuần", "Nhất thế", "Nhị thế", "Tam thế", "Tứ thế", "Ngũ thế", "Du hồn", "Quy hồn"];
const GUA_LIST = [
  ["Càn", "Càn", "Thuần Càn"], ["Càn", "Tốn", "Thiên Phong Cấu"], ["Càn", "Cấn", "Thiên Sơn Độn"], ["Càn", "Khôn", "Thiên Địa Bĩ"],
  ["Tốn", "Khôn", "Phong Địa Quan"], ["Cấn", "Khôn", "Sơn Địa Bác"], ["Ly", "Khôn", "Hỏa Địa Tấn"], ["Ly", "Càn", "Hỏa Thiên Đại Hữu"],
  ["Khảm", "Khảm", "Thuần Khảm"], ["Khảm", "Đoài", "Thủy Trạch Tiết"], ["Khảm", "Chấn", "Thủy Lôi Truân"], ["Khảm", "Ly", "Thủy Hỏa Ký Tế"],
  ["Đoài", "Ly", "Trạch Hỏa Cách"], ["Chấn", "Ly", "Lôi Hỏa Phong"], ["Khôn", "Ly", "Địa Hỏa Minh Di"], ["Khôn", "Khảm", "Địa Thủy Sư"],
  ["Cấn", "Cấn", "Thuần Cấn"], ["Cấn", "Ly", "Sơn Hỏa Bí"], ["Cấn", "Càn", "Sơn Thiên Đại Súc"], ["Cấn", "Đoài", "Sơn Trạch Tổn"],
  ["Ly", "Đoài", "Hỏa Trạch Khuê"], ["Càn", "Đoài", "Thiên Trạch Lý"], ["Tốn", "Đoài", "Phong Trạch Trung Phu"], ["Tốn", "Cấn", "Phong Sơn Tiệm"],
  ["Chấn", "Chấn", "Thuần Chấn"], ["Chấn", "Khôn", "Lôi Địa Dự"], ["Chấn", "Khảm", "Lôi Thủy Giải"], ["Chấn", "Tốn", "Lôi Phong Hằng"],
  ["Khôn", "Tốn", "Địa Phong Thăng"], ["Khảm", "Tốn", "Thủy Phong Tỉnh"], ["Đoài", "Tốn", "Trạch Phong Đại Quá"], ["Đoài", "Chấn", "Trạch Lôi Tùy"],
  ["Tốn", "Tốn", "Thuần Tốn"], ["Tốn", "Càn", "Phong Thiên Tiểu Súc"], ["Tốn", "Ly", "Phong Hỏa Gia Nhân"], ["Tốn", "Chấn", "Phong Lôi Ích"],
  ["Càn", "Chấn", "Thiên Lôi Vô Vọng"], ["Ly", "Chấn", "Hỏa Lôi Phệ Hạp"], ["Cấn", "Chấn", "Sơn Lôi Di"], ["Cấn", "Tốn", "Sơn Phong Cổ"],
  ["Ly", "Ly", "Thuần Ly"], ["Ly", "Cấn", "Hỏa Sơn Lữ"], ["Ly", "Tốn", "Hỏa Phong Đỉnh"], ["Ly", "Khảm", "Hỏa Thủy Vị Tế"],
  ["Cấn", "Khảm", "Sơn Thủy Mông"], ["Tốn", "Khảm", "Phong Thủy Hoán"], ["Càn", "Khảm", "Thiên Thủy Tụng"], ["Càn", "Ly", "Thiên Hỏa Đồng Nhân"],
  ["Khôn", "Khôn", "Thuần Khôn"], ["Khôn", "Chấn", "Địa Lôi Phục"], ["Khôn", "Đoài", "Địa Trạch Lâm"], ["Khôn", "Càn", "Địa Thiên Thái"],
  ["Chấn", "Càn", "Lôi Thiên Đại Tráng"], ["Đoài", "Càn", "Trạch Thiên Quải"], ["Khảm", "Càn", "Thủy Thiên Nhu"], ["Khảm", "Khôn", "Thủy Địa Tỷ"],
  ["Đoài", "Đoài", "Thuần Đoài"], ["Đoài", "Khảm", "Trạch Thủy Khốn"], ["Đoài", "Khôn", "Trạch Địa Tụy"], ["Đoài", "Cấn", "Trạch Sơn Hàm"],
  ["Khảm", "Cấn", "Thủy Sơn Kiển"], ["Khôn", "Cấn", "Địa Sơn Khiêm"], ["Chấn", "Cấn", "Lôi Sơn Tiểu Quá"], ["Chấn", "Đoài", "Lôi Trạch Quy Muội"],
];

export const LUC_THU = ["Thanh Long", "Chu Tước", "Câu Trần", "Đằng Xà", "Bạch Hổ", "Huyền Vũ"];
// Hào 1 khởi theo can ngày: Giáp Ất→Thanh Long, Bính Đinh→Chu Tước, Mậu→Câu Trần, Kỷ→Đằng Xà, Canh Tân→Bạch Hổ, Nhâm Quý→Huyền Vũ
const LUC_THU_START = [0, 0, 1, 1, 2, 3, 4, 4, 5, 5];

// ───────────────────────── Tra quẻ ─────────────────────────
const linesOf = (upper, lower) => [...TRIGRAM[lower], ...TRIGRAM[upper]];
const key = (bits) => bits.join("");
const trigramOf = (b3) => Object.keys(TRIGRAM).find((k) => key(TRIGRAM[k]) === key(b3));

export const GUA = {}; // key "bbbbbb" (hào1..hào6) -> info
GUA_LIST.forEach(([upper, lower, name], i) => {
  const palace = PALACES[Math.floor(i / 8)];
  const the = THE_POS[i % 8];
  GUA[key(linesOf(upper, lower))] = {
    name, upper, lower, palace, palaceHanh: TRIGRAM_HANH[palace],
    stage: STAGE[i % 8], the, ung: the > 3 ? the - 3 : the + 3,
  };
});

export function lucThan(palaceHanh, hanh) {
  if (hanh === palaceHanh) return "Huynh Đệ";
  if (SINH[palaceHanh] === hanh) return "Tử Tôn";
  if (SINH[hanh] === palaceHanh) return "Phụ Mẫu";
  if (KHAC[palaceHanh] === hanh) return "Thê Tài";
  return "Quan Quỷ";
}

export function napGiap(upper, lower) {
  return [...NAP_GIAP[lower][0], ...NAP_GIAP[upper][1]]; // hào 1..6
}

const LUC_XUNG = (a, b) => (CHI.indexOf(a) + 6) % 12 === CHI.indexOf(b);
const HOP_PAIRS = ["Tý-Sửu", "Dần-Hợi", "Mão-Tuất", "Thìn-Dậu", "Tỵ-Thân", "Ngọ-Mùi"];
const LUC_HOP = (a, b) => HOP_PAIRS.includes(`${a}-${b}`) || HOP_PAIRS.includes(`${b}-${a}`);

export function quaiTinh(branches) {
  const pairs = [[0, 3], [1, 4], [2, 5]];
  if (pairs.every(([i, j]) => LUC_XUNG(branches[i], branches[j]))) return "Lục xung";
  if (pairs.every(([i, j]) => LUC_HOP(branches[i], branches[j]))) return "Lục hợp";
  return null;
}

// ───────────────────────── Lịch: can chi theo tiết khí ─────────────────────────
// Kinh độ Mặt Trời biểu kiến (Meeus, Astronomical Algorithms ch.25, độ chính xác ~0.01° ≈ 15 phút)
function sunLongitude(jdUT) {
  const jd = jdUT + 69 / 86400; // ΔT ≈ 69 s (2020–2030)
  const T = (jd - 2451545.0) / 36525;
  const rad = Math.PI / 180;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * rad;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
  const omega = (125.04 - 1934.136 * T) * rad;
  const lon = L0 + C - 0.00569 - 0.00478 * Math.sin(omega);
  return ((lon % 360) + 360) % 360;
}

// Ngày Julius (UT) từ giờ địa phương
function jdFromLocal({ y, m, d, h = 0, mi = 0 }, tz) {
  return Date.UTC(y, m - 1, d, h, mi) / 86400000 + 2440587.5 - tz / 24;
}
// Số ngày Julius (JDN) của NGÀY DƯƠNG LỊCH địa phương
function jdnLocal({ y, m, d }) {
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000 + 2440587.5 + 0.5);
}

const TIET = ["Lập Xuân", "Kinh Trập", "Thanh Minh", "Lập Hạ", "Mang Chủng", "Tiểu Thử",
  "Lập Thu", "Bạch Lộ", "Hàn Lộ", "Lập Đông", "Đại Tuyết", "Tiểu Hàn"]; // tiết bắt đầu tháng Dần..Sửu

// Thời điểm (JD UT) Mặt Trời đạt kinh độ `target`, tìm quanh `jdGuess` (±20 ngày)
export function solarTermJD(target, jdGuess) {
  const diff = (jd) => ((sunLongitude(jd) - target + 540) % 360) - 180;
  let a = jdGuess - 20, b = jdGuess + 20;
  for (let i = 0; i < 60; i++) {
    const mid = (a + b) / 2;
    if (diff(mid) < 0) a = mid; else b = mid;
  }
  return (a + b) / 2;
}

/**
 * Tứ trụ theo tiết khí.
 * @param dt {y,m,d,h,mi} giờ địa phương
 * @param opts.tz múi giờ (VN = 7)
 * @param opts.ziHourNextDay true: từ 23:00 tính sang ngày hôm sau (mặc định, như đa số app Lục hào VN)
 */
export function fourPillars(dt, { tz = 7, ziHourNextDay = true } = {}) {
  const jd = jdFromLocal(dt, tz);
  const lon = sunLongitude(jd);

  // Năm: đổi tại Lập Xuân (315°)
  let year = dt.y;
  if (dt.m <= 2 && !(lon >= 315 || lon < 270)) year -= 1; // trước Lập Xuân → năm trước
  const yStem = (((year - 4) % 10) + 10) % 10;
  const yBranch = (((year - 4) % 12) + 12) % 12;

  // Tháng: tiết bắt đầu tại 315° + 30°·k (k=0 → Dần)
  const k = Math.floor((((lon - 315) % 360) + 360) % 360 / 30);
  const mBranch = (2 + k) % 12;
  const mStem = ((yStem % 5) * 2 + 2 + k) % 10; // Ngũ Hổ Độn

  // Ngày
  let jdn = jdnLocal(dt);
  if (ziHourNextDay && dt.h >= 23) jdn += 1;
  const dayIdx = (((jdn + 49) % 60) + 60) % 60;
  const dStem = dayIdx % 10, dBranch = dayIdx % 12;

  // Giờ (Ngũ Thử Độn)
  const hBranch = Math.floor((dt.h + 1) / 2) % 12;
  const hStem = ((dStem % 5) * 2 + hBranch) % 10;

  // Tuần không theo ngày
  const tuanStart = dayIdx - dStem; // ngày Giáp đầu tuần
  const khong = [CHI[(tuanStart + 10) % 12], CHI[(tuanStart + 11) % 12]];

  // Tiết hiện tại + tiết kế tiếp (để hiển thị)
  const termStartLon = (315 + 30 * k) % 360;
  const termJD = solarTermJD(termStartLon, jd - ((lon - termStartLon + 360) % 360) / 0.9856);
  return {
    nam: { can: CAN[yStem], chi: CHI[yBranch] },
    thang: { can: CAN[mStem], chi: CHI[mBranch] },
    ngay: { can: CAN[dStem], chi: CHI[dBranch], index: dayIdx },
    gio: { can: CAN[hStem], chi: CHI[hBranch] },
    tuanKhong: khong,
    tiet: { ten: TIET[k], batDauJD: termJD },
    sunLongitude: lon,
  };
}

export function jdToLocalString(jd, tz = 7) {
  const ms = (jd - 2440587.5 + tz / 24) * 86400000;
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

// ───────────────────────── Lập lá quẻ ─────────────────────────
// lines: mảng 6 giá trị từ HÀO 1 (dưới) đến HÀO 6 (trên):
//   7 = Thiếu dương (—), 8 = Thiếu âm (- -), 9 = Lão dương động (O, dương→âm), 6 = Lão âm động (X, âm→dương)
export function castChart(lines, dt, opts = {}) {
  if (!Array.isArray(lines) || lines.length !== 6 || lines.some((v) => ![6, 7, 8, 9].includes(v))) {
    throw new Error("lines phải là 6 số thuộc {6,7,8,9}, thứ tự hào 1 → hào 6");
  }
  const mainBits = lines.map((v) => (v === 7 || v === 9 ? 1 : 0));
  const moving = lines.map((v) => v === 6 || v === 9);
  const changedBits = mainBits.map((b, i) => (moving[i] ? 1 - b : b));

  const main = GUA[key(mainBits)];
  const hasChange = moving.some(Boolean);
  const changed = hasChange ? GUA[key(changedBits)] : null;

  const pillars = dt ? fourPillars(dt, opts) : null;
  const pal = main.palaceHanh;

  const mainBranches = napGiap(main.upper, main.lower);
  const chBranches = changed ? napGiap(changed.upper, changed.lower) : null;

  // Phục thần: lục thân thiếu trong quẻ chủ → lấy từ quẻ Thuần của cung, cùng vị trí
  const present = new Set(mainBranches.map((c) => lucThan(pal, CHI_HANH[c])));
  const pure = GUA[key(linesOf(main.palace, main.palace))];
  const pureBranches = napGiap(pure.upper, pure.lower);
  const phuc = Array(6).fill(null);
  pureBranches.forEach((c, i) => {
    const lt = lucThan(pal, CHI_HANH[c]);
    if (!present.has(lt)) phuc[i] = { lucThan: lt, chi: c, hanh: CHI_HANH[c] };
  });

  const thuStart = pillars ? LUC_THU_START[CAN.indexOf(pillars.ngay.can)] : null;
  const khong = pillars ? pillars.tuanKhong : [];
  const monthChi = pillars ? pillars.thang.chi : null;
  const dayChi = pillars ? pillars.ngay.chi : null;

  const flags = (chi) => {
    const f = [];
    if (khong.includes(chi)) f.push("Không");
    if (monthChi && LUC_XUNG(chi, monthChi)) f.push("Nguyệt phá");
    if (dayChi && LUC_XUNG(chi, dayChi)) f.push("Nhật xung");
    return f;
  };

  const hao = mainBits.map((bit, i) => {
    const chi = mainBranches[i];
    const row = {
      viTri: i + 1,
      am_duong: bit ? "Dương" : "Âm",
      dong: moving[i],
      kyHieu: moving[i] ? (bit ? "O" : "X") : "",
      chi, hanh: CHI_HANH[chi], lucThan: lucThan(pal, CHI_HANH[chi]),
      the: main.the === i + 1, ung: main.ung === i + 1,
      lucThu: thuStart === null ? null : LUC_THU[(thuStart + i) % 6],
      flags: flags(chi),
      phucThan: phuc[i],
      bien: null,
    };
    if (moving[i]) {
      const c2 = chBranches[i];
      row.bien = {
        am_duong: changedBits[i] ? "Dương" : "Âm",
        chi: c2, hanh: CHI_HANH[c2],
        lucThan: lucThan(pal, CHI_HANH[c2]), // lục thân hào biến tính theo CUNG QUẺ CHỦ
        flags: flags(c2),
      };
    }
    return row;
  });

  return {
    chu: { ...main, quaiTinh: quaiTinh(mainBranches) },
    bien: changed ? { ...changed, quaiTinh: quaiTinh(chBranches) } : null,
    // Quẻ biến hiển thị đầy đủ 6 hào (nạp giáp riêng của quẻ biến, lục thân theo cung quẻ chủ)
    bienFull: changed ? changedBits.map((b, i) => ({
      viTri: i + 1, am_duong: b ? "Dương" : "Âm", chi: chBranches[i], hanh: CHI_HANH[chBranches[i]],
      lucThan: lucThan(pal, CHI_HANH[chBranches[i]]),
    })) : null,
    hao, // index 0 = hào 1
    pillars,
  };
}

// Tiện ích: chuyển ký hiệu người dùng → số
// "duong" | "am" | "duong_dong" | "am_dong"
export const INPUT_TO_NUM = { duong: 7, am: 8, duong_dong: 9, am_dong: 6 };
