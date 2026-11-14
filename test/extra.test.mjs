// Kiểm thử Phản ngâm / Phục ngâm theo các ví dụ trong Tăng San Bốc Dịch Bình Thích, chương "Phản phục".
import assert from "node:assert/strict";
import { castChart, CHI } from "../assets/luchao-core.js";
import { phanPhucNgam } from "../assets/luchao-extra.js";

let pass = 0;
const ok = (name, fn) => { fn(); pass++; console.log("✔", name); };
const dt = { y: 2026, m: 11, d: 8, h: 14, mi: 18 };
const run = (lines) => { const c = castChart(lines, dt); return { c, n: phanPhucNgam(c) }; };

ok("Vô Vọng biến Đại Tráng: nội ngoại phục ngâm", () => {
  const { c, n } = run([7, 6, 6, 7, 9, 9]);
  assert.equal(c.chu.name, "Thiên Lôi Vô Vọng"); assert.equal(c.bien.name, "Lôi Thiên Đại Tráng");
  assert.deepEqual(n.tongKet, ["Nội ngoại đều phục ngâm"]);
  assert.deepEqual(n.hao, [null, "Phục ngâm", "Phục ngâm", null, "Phục ngâm", "Phục ngâm"]);
  assert.equal(n.hopXung, "Lục xung biến Lục xung");
});
ok("Thăng biến Quan: nội ngoại phản ngâm (hào biến xung)", () => {
  const { c, n } = run([8, 9, 9, 8, 6, 6]);
  assert.equal(c.chu.name, "Địa Phong Thăng"); assert.equal(c.bien.name, "Phong Địa Quan");
  assert.deepEqual(n.tongKet, ["Nội ngoại đều phản ngâm"]);
  assert.deepEqual(n.hao, [null, "Phản ngâm", "Phản ngâm", null, "Phản ngâm", "Phản ngâm"]);
});
ok("Quan biến Khôn: ngoại quái phản ngâm", () => {
  const { c, n } = run([8, 8, 8, 8, 9, 9]);
  assert.equal(c.bien.name, "Thuần Khôn");
  assert.deepEqual(n.tongKet, ["Ngoại quái phản ngâm"]);
});
ok("Thuần Tốn biến Quan: nội quái phản ngâm", () => {
  const { c, n } = run([8, 9, 9, 8, 7, 7]);
  assert.equal(c.chu.name, "Thuần Tốn"); assert.equal(c.bien.name, "Phong Địa Quan");
  assert.deepEqual(n.tongKet, ["Nội quái phản ngâm"]);
});
ok("Càn biến Khôn: không có hào động nào biến ra chi xung/trùng → không phản ngâm", () => {
  const { n } = run([9, 9, 9, 9, 9, 9]);
  assert.deepEqual(n.tongKet, []); assert.deepEqual(n.hao, Array(6).fill(null));
});
ok("Đại Hữu biến Hằng, Khôn biến Khiêm: không còn phản ngâm 'đối phương vị'", () => {
  const dh = run([9, 7, 7, 7, 8, 9]);
  assert.equal(dh.c.chu.name, "Hỏa Thiên Đại Hữu"); assert.equal(dh.c.bien.name, "Lôi Phong Hằng");
  assert.deepEqual(dh.n.tongKet, []);
  const kk = run([8, 8, 6, 8, 8, 8]);
  assert.equal(kk.c.chu.name, "Thuần Khôn"); assert.equal(kk.c.bien.name, "Địa Sơn Khiêm");
  assert.deepEqual(kk.n.tongKet, []);
});
ok("Toàn bộ 4.096 tổ hợp: chỉ báo ngâm khi có hào động, và mọi hào động trong quái ngâm đều biến ra chi xung (phản) hoặc trùng (phục)", () => {
  const xung = (a, b) => (CHI.indexOf(a) + 6) % 12 === CHI.indexOf(b);
  for (let base = 0; base < 64; base++) for (let mv = 0; mv < 64; mv++) {
    const lines = [0, 1, 2, 3, 4, 5].map((i) => ((base >> i) & 1 ? ((mv >> i) & 1 ? 9 : 7) : ((mv >> i) & 1 ? 6 : 8)));
    const c = castChart(lines, dt), n = phanPhucNgam(c);
    n.hao.forEach((x, i) => { if (x) assert.ok(c.hao[i].dong); });
    for (const q of n.quai) {
      const idx = q.vi === "Nội quái" ? [0, 1, 2] : [3, 4, 5];
      const dong = idx.filter((i) => c.hao[i].dong);
      assert.ok(dong.length > 0);
      for (const i of dong) {
        const h = c.hao[i];
        assert.ok(q.loai === "Phản ngâm" ? xung(h.chi, h.bien.chi) : h.chi === h.bien.chi, c.chu.name + " → " + c.bien.name);
      }
    }
  }
});
ok("Ca 1 (Thái biến Khiêm): không phản phục ngâm, Lục hợp biến quẻ thường", () => {
  const { n } = run([9, 9, 7, 8, 8, 8]);
  assert.deepEqual(n.tongKet, []); assert.deepEqual(n.hao, Array(6).fill(null));
  assert.equal(n.hopXung, "Lục hợp biến quẻ thường");
});
ok("Quẻ tĩnh: không có gì", () => {
  const { n } = run([7, 7, 7, 8, 8, 8]);
  assert.deepEqual(n, { hao: Array(6).fill(null), quai: [], tongKet: [], hopXung: null });
});

console.log(`\n${pass} kiểm thử bổ sung đạt.`);
