// Kiểm thử Phản ngâm / Phục ngâm theo các ví dụ trong Tăng San Bốc Dịch Bình Thích, chương "Phản phục".
import assert from "node:assert/strict";
import { castChart } from "../assets/luchao-core.js";
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
ok("Càn biến Khôn: phản ngâm theo phương vị tiên thiên", () => {
  const { n } = run([9, 9, 9, 9, 9, 9]);
  assert.deepEqual(n.tongKet, ["Nội ngoại đều phản ngâm"]);
  assert.match(n.quai[0].lyDo, /tiên thiên/);
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
