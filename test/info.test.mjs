// Kiểm thử thông tin bổ sung, đối chiếu lá quẻ chụp từ simkinhdich:
// Thuần Khảm biến Sơn Phong Cổ, 01/08/2026 08:39 (âm lịch giờ Thìn 19/6/2026).
import assert from "node:assert/strict";
import { castChart } from "../assets/luchao-core.js";
import { chiTietHao, amLich, tietKhi24, napCan, canChiNam, canChiThangAm } from "../assets/luchao-info.js";

let pass = 0;
const ok = (name, fn) => { fn(); pass++; console.log("✔", name); };

const c = castChart([8, 7, 6, 8, 9, 6], { y: 2026, m: 8, d: 1, h: 8, mi: 39 });
const t = chiTietHao(c);
const col = (side, key) => [5, 4, 3, 2, 1, 0].map((i) => t[i][side][key]); // hào 6 → 1

ok("Quẻ và tứ trụ khớp ảnh", () => {
  assert.equal(c.chu.name, "Thuần Khảm"); assert.equal(c.bien.name, "Sơn Phong Cổ");
  const p = c.pillars;
  assert.deepEqual([p.gio, p.ngay, p.thang, p.nam].map((x) => `${x.can} ${x.chi}`), ["Giáp Thìn", "Đinh Mùi", "Ất Mùi", "Bính Ngọ"]);
  assert.deepEqual(p.tuanKhong, ["Dần", "Mão"]);
});
ok("Âm lịch 01/08/2026 = 19/6/2026; Tết 2026 = 17/02/2026; tháng 6 nhuận 2025", () => {
  assert.deepEqual(amLich(1, 8, 2026), { ngay: 19, thang: 6, nam: 2026, nhuan: false });
  assert.deepEqual(amLich(17, 2, 2026), { ngay: 1, thang: 1, nam: 2026, nhuan: false });
  assert.deepEqual(amLich(16, 2, 2026), { ngay: 29, thang: 12, nam: 2025, nhuan: false });
  assert.deepEqual(amLich(25, 7, 2025), { ngay: 1, thang: 6, nam: 2025, nhuan: true });
  assert.equal(canChiNam(2026), "Bính Ngọ");
});
ok("Can chi tháng âm lịch (Ngũ Hổ Độn theo năm âm)", () => {
  assert.equal(canChiThangAm(6, 2026), "Ất Mùi");   // ảnh simkinhdich 19/6/2026
  assert.equal(canChiThangAm(9, 2026), "Mậu Tuất");  // ca 1: 30/9/2026
  assert.equal(canChiThangAm(1, 2026), "Canh Dần");
  assert.equal(canChiThangAm(12, 2025), "Kỷ Sửu");   // Ất Tỵ
  assert.equal(canChiThangAm(6, 2025), "Quý Mùi");   // tháng 6 nhuận cùng can chi tháng 6
});
ok("Tiết khí 24: Đại Thử", () => assert.equal(tietKhi24(c.pillars.sunLongitude), "Đại Thử"));
ok("Nạp can: Khảm toàn Mậu; Cổ ngoại Bính, nội Tân", () => {
  assert.deepEqual(napCan("Khảm", "Khảm"), Array(6).fill("Mậu"));
  assert.deepEqual(col("bien", "can"), ["Bính", "Bính", "Bính", "Tân", "Tân", "Tân"]);
});
ok("Vượng suy theo tháng Mùi (quẻ chủ và quẻ biến)", () => {
  assert.deepEqual(col("chu", "vuongSuy"), ["Tử", "Vượng", "Tướng", "Hưu", "Vượng", "Tù"]);
  assert.deepEqual(col("bien", "vuongSuy"), ["Tù", "Tử", "Vượng", "Tướng", "Tử", "Vượng"]);
});
ok("Trường sinh theo ngày Mùi", () => {
  assert.deepEqual(col("chu", "tsNgay"), ["Dưỡng", "Dưỡng", "Quan đới", "Suy", "Dưỡng", "Mộ"]);
  assert.deepEqual(col("bien", "tsNgay"), ["Mộ", "Dưỡng", "Dưỡng", "Quan đới", "Dưỡng", "Dưỡng"]);
});
ok("Đào hoa (ngày Mùi → Tý), Dịch mã (ngày Mùi → Tỵ, không có trong quẻ)", () => {
  assert.deepEqual(t[5].chu.sao, ["Đào hoa"]);   // hào 6 Tý
  assert.deepEqual(t[4].bien.sao, ["Đào hoa"]);  // biến hào 5 Tý
  assert.ok(t.every((x) => !x.chu.sao.includes("Dịch mã") && !x.bien.sao.includes("Dịch mã")));
});
ok("Tuần không ở Dần (chủ hào 1, biến hào 6)", () => {
  assert.ok(t[0].chu.trangThai.includes("Tuần không"));
  assert.ok(t[5].bien.trangThai.includes("Tuần không"));
});
ok("Hào tĩnh bị Nhật xung: vượng → Ám động, suy → Nhật phá", () => {
  // Ngày Mùi xung Sửu. Ca 1 (ngày Bính Tuất, tháng Hợi): hào 3 Thìn Thổ tĩnh, Thổ ở tháng Hợi là Tù → Nhật phá
  const c1 = castChart([9, 9, 7, 8, 8, 8], { y: 2026, m: 11, d: 8, h: 14, mi: 18 });
  assert.ok(chiTietHao(c1)[2].chu.trangThai.includes("Nhật xung · Nhật phá"));
  // Ca 5 (ngày Mậu Dần, tháng Tuất): hào 3 Thân Kim tĩnh, Kim ở tháng Tuất là Tướng → Ám động
  const c5 = castChart([6, 8, 7, 7, 9, 6], { y: 2026, m: 10, d: 31, h: 7, mi: 30 });
  assert.ok(chiTietHao(c5)[2].chu.trangThai.includes("Nhật xung · Ám động"));
});

console.log(`\n${pass} kiểm thử thông tin bổ sung đạt.`);
