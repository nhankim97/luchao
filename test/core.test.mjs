// Chạy: npm test   (Node >= 18). Không cần cài gì.
// Các ca kiểm thử 1–5 là lá quẻ THẬT chụp từ app Lục hào (đã đối chiếu tay).
import assert from "node:assert/strict";
import { castChart, fourPillars, GUA, PALACES, napGiap, lucThan, quaiTinh, solarTermJD, jdToLocalString, TRIGRAM } from "../assets/luchao-core.js";

let pass = 0;
const ok = (name, fn) => { fn(); pass++; console.log("✔", name); };
const gz = (p) => `${p.can} ${p.chi}`;
const row = (c, i) => c.hao[i - 1];
const short = (r) => `${r.lucThan} ${r.chi}`;

// ── Bất biến của bảng 64 quẻ ──
ok("64 quẻ, không trùng", () => assert.equal(Object.keys(GUA).length, 64));
ok("Mỗi quẻ Thuần có đủ 5 lục thân", () => {
  for (const p of PALACES) {
    const g = GUA[[...TRIGRAM[p], ...TRIGRAM[p]].join("")];
    const s = new Set(napGiap(g.upper, g.lower).map((c) => lucThan(g.palaceHanh, { Tý: "Thủy", Hợi: "Thủy", Dần: "Mộc", Mão: "Mộc", Tỵ: "Hỏa", Ngọ: "Hỏa", Thân: "Kim", Dậu: "Kim", Thìn: "Thổ", Tuất: "Thổ", Sửu: "Thổ", Mùi: "Thổ" }[c])));
    assert.equal(s.size, 5, p);
  }
});
ok("Quẻ Lục xung = 8 quẻ Thuần + Vô Vọng + Đại Tráng", () => {
  const xs = Object.values(GUA).filter((g) => quaiTinh(napGiap(g.upper, g.lower)) === "Lục xung").map((g) => g.name).sort();
  assert.deepEqual(xs, ["Lôi Thiên Đại Tráng", "Thiên Lôi Vô Vọng", "Thuần Cấn", "Thuần Chấn", "Thuần Càn", "Thuần Khôn", "Thuần Khảm", "Thuần Ly", "Thuần Tốn", "Thuần Đoài"].sort());
});
ok("Quẻ Lục hợp = Bĩ, Thái, Phục, Dự, Tiết, Khốn, Lữ, Bí", () => {
  const hs = Object.values(GUA).filter((g) => quaiTinh(napGiap(g.upper, g.lower)) === "Lục hợp").map((g) => g.name).sort();
  assert.deepEqual(hs, ["Thiên Địa Bĩ", "Địa Thiên Thái", "Địa Lôi Phục", "Lôi Địa Dự", "Thủy Trạch Tiết", "Trạch Thủy Khốn", "Hỏa Sơn Lữ", "Sơn Hỏa Bí"].sort());
});

// ── Lịch ──
ok("12/11/2026 = ngày Canh Dần", () => assert.equal(gz(fourPillars({ y: 2026, m: 11, d: 12, h: 10 }).ngay), "Canh Dần"));
ok("Hàn Lộ 2026 ≈ 08/10/2026 13:2x (giờ VN)", () => {
  const s = jdToLocalString(solarTermJD(195, 2461322));
  assert.match(s, /^08\/10\/2026 13:/, s);
});
ok("Lập Xuân đổi năm: 03/02/2026 = Ất Tỵ / Sửu; 05/02/2026 = Bính Ngọ / Canh Dần", () => {
  const a = fourPillars({ y: 2026, m: 2, d: 3, h: 12 }), b = fourPillars({ y: 2026, m: 2, d: 5, h: 12 });
  assert.equal(gz(a.nam), "Ất Tỵ"); assert.equal(a.thang.chi, "Sửu");
  assert.equal(gz(b.nam), "Bính Ngọ"); assert.equal(gz(b.thang), "Canh Dần");
});
ok("23:00 tính sang ngày hôm sau (giờ Tý)", () => {
  const a = fourPillars({ y: 2026, m: 11, d: 11, h: 23, mi: 10 });
  assert.equal(gz(a.ngay), "Canh Dần"); assert.equal(a.gio.chi, "Tý");
  const b = fourPillars({ y: 2026, m: 11, d: 11, h: 23, mi: 10 }, { ziHourNextDay: false });
  assert.equal(gz(b.ngay), "Kỷ Sửu");
});

// ── 5 lá quẻ thật ──
ok("Ca 1: Địa Thiên Thái → Địa Sơn Khiêm, 08/11/2026 14:18", () => {
  const c = castChart([9, 9, 7, 8, 8, 8], { y: 2026, m: 11, d: 8, h: 14, mi: 18 });
  assert.equal(c.chu.name, "Địa Thiên Thái"); assert.equal(c.bien.name, "Địa Sơn Khiêm");
  assert.equal(c.chu.palace, "Khôn");
  assert.equal(gz(c.pillars.nam), "Bính Ngọ"); assert.equal(gz(c.pillars.thang), "Kỷ Hợi"); assert.equal(gz(c.pillars.ngay), "Bính Tuất");
  assert.deepEqual(c.pillars.tuanKhong, ["Ngọ", "Mùi"]);
  assert.ok(row(c, 3).the); assert.equal(short(row(c, 3)), "Huynh Đệ Thìn");
  assert.ok(row(c, 6).ung); assert.equal(short(row(c, 6)), "Tử Tôn Dậu");
  assert.equal(short(row(c, 1)), "Thê Tài Tý"); assert.equal(short(row(c, 1).bien), "Huynh Đệ Thìn");
  assert.equal(short(row(c, 2)), "Quan Quỷ Dần"); assert.equal(short(row(c, 2).bien), "Phụ Mẫu Ngọ");
  assert.deepEqual(row(c, 2).phucThan && [row(c, 2).phucThan.lucThan, row(c, 2).phucThan.chi], ["Phụ Mẫu", "Tỵ"]);
  assert.equal(row(c, 1).lucThu, "Chu Tước");
});
ok("Ca 2: Sơn Thủy Mông → Thuần Càn, 19/09/2026 21:31", () => {
  const c = castChart([6, 7, 6, 6, 6, 7], { y: 2026, m: 9, d: 19, h: 21, mi: 31 });
  assert.equal(c.chu.name, "Sơn Thủy Mông"); assert.equal(c.bien.name, "Thuần Càn");
  assert.equal(c.chu.palace, "Ly");
  assert.equal(gz(c.pillars.ngay), "Bính Thân"); assert.equal(gz(c.pillars.thang), "Đinh Dậu");
  assert.deepEqual(c.pillars.tuanKhong, ["Thìn", "Tỵ"]);
  assert.ok(row(c, 4).the); assert.equal(short(row(c, 4)), "Tử Tôn Tuất");
  assert.ok(row(c, 1).ung); assert.equal(short(row(c, 1)), "Phụ Mẫu Dần");
  assert.deepEqual([1, 3, 4, 5].map((i) => row(c, i).dong), [true, true, true, true]);
  assert.equal(row(c, 4).phucThan.lucThan + " " + row(c, 4).phucThan.chi, "Thê Tài Dậu");
});
ok("Ca 3: Thiên Lôi Vô Vọng → Thiên Trạch Lý, 18/09/2026 18:54", () => {
  const c = castChart([7, 6, 8, 7, 7, 7], { y: 2026, m: 9, d: 18, h: 18, mi: 54 });
  assert.equal(c.chu.name, "Thiên Lôi Vô Vọng"); assert.equal(c.bien.name, "Thiên Trạch Lý");
  assert.equal(c.chu.palace, "Tốn"); assert.equal(c.chu.quaiTinh, "Lục xung");
  assert.equal(gz(c.pillars.ngay), "Ất Mùi"); assert.deepEqual(c.pillars.tuanKhong, ["Thìn", "Tỵ"]);
  assert.ok(row(c, 4).the); assert.equal(short(row(c, 4)), "Tử Tôn Ngọ");
  assert.ok(row(c, 1).ung); assert.equal(short(row(c, 1)), "Phụ Mẫu Tý");
  assert.equal(short(row(c, 2)), "Huynh Đệ Dần"); assert.equal(short(row(c, 2).bien), "Huynh Đệ Mão");
});
ok("Ca 4: Lôi Phong Hằng → Địa Thiên Thái, 16/09/2026 19:28", () => {
  const c = castChart([6, 7, 7, 9, 8, 8], { y: 2026, m: 9, d: 16, h: 19, mi: 28 });
  assert.equal(c.chu.name, "Lôi Phong Hằng"); assert.equal(c.bien.name, "Địa Thiên Thái");
  assert.equal(c.chu.palace, "Chấn");
  assert.equal(gz(c.pillars.ngay), "Quý Tỵ"); assert.deepEqual(c.pillars.tuanKhong, ["Ngọ", "Mùi"]);
  assert.ok(row(c, 3).the); assert.equal(short(row(c, 3)), "Quan Quỷ Dậu");
  assert.ok(row(c, 6).ung); assert.equal(short(row(c, 6)), "Thê Tài Tuất");
  assert.equal(short(row(c, 1)), "Thê Tài Sửu"); assert.equal(short(row(c, 1).bien), "Phụ Mẫu Tý");
  assert.equal(short(row(c, 4)), "Tử Tôn Ngọ"); assert.ok(row(c, 4).flags.includes("Không"));
  assert.equal(short(row(c, 4).bien), "Thê Tài Sửu");
  assert.equal(row(c, 2).phucThan.lucThan + " " + row(c, 2).phucThan.chi, "Huynh Đệ Dần");
});
ok("Ca 5: Trạch Sơn Hàm → Thuần Ly, 31/10/2026 07:30", () => {
  const c = castChart([6, 8, 7, 7, 9, 6], { y: 2026, m: 10, d: 31, h: 7, mi: 30 });
  assert.equal(c.chu.name, "Trạch Sơn Hàm"); assert.equal(c.bien.name, "Thuần Ly");
  assert.equal(c.chu.palace, "Đoài");
  assert.equal(gz(c.pillars.ngay), "Mậu Dần"); assert.equal(gz(c.pillars.thang), "Mậu Tuất");
  assert.deepEqual(c.pillars.tuanKhong, ["Thân", "Dậu"]);
  assert.ok(row(c, 3).the); assert.equal(short(row(c, 3)), "Huynh Đệ Thân"); assert.ok(row(c, 3).flags.includes("Không"));
  assert.ok(row(c, 6).ung); assert.equal(short(row(c, 6)), "Phụ Mẫu Mùi");
  assert.equal(short(row(c, 1).bien), "Thê Tài Mão");
  assert.equal(short(row(c, 5)), "Huynh Đệ Dậu"); assert.equal(short(row(c, 5).bien), "Phụ Mẫu Mùi");
  assert.equal(short(row(c, 6).bien), "Quan Quỷ Tỵ");
  assert.equal(row(c, 2).phucThan.lucThan + " " + row(c, 2).phucThan.chi, "Thê Tài Mão");
});

console.log(`\n${pass} kiểm thử đạt.`);
