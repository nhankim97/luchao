// Đóng gói trang thành MỘT file HTML tự chứa (CSS + JS gộp vào trong), để đăng ở nơi
// không tải được file JS riêng (ví dụ Artifact trên claude.ai).
// Dùng: node scripts/build-embed.mjs  →  dist/luchao-embed.html
import { readFile, writeFile, mkdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (p) => readFile(new URL(p, root), "utf8");

// Gói một ES module thành hàm trả về object các export; import → lấy từ __m.
function wrapModule(path, src) {
  const exported = [];
  let body = src.replace(/^import\s*\{([^}]+)\}\s*from\s*"([^"]+)";?\s*$/gm, (_, names, from) =>
    `const {${names}} = __m[${JSON.stringify(from.replace(/^\.\//, ""))}];`);
  body = body.replace(/^export\s+(const|let|function)\s+([A-Za-z_$][\w$]*)/gm, (_, kw, name) => {
    exported.push(name);
    return `${kw} ${name}`;
  });
  if (/^export\s/m.test(body)) throw new Error(`${path}: còn cú pháp export chưa hỗ trợ`);
  return `__m[${JSON.stringify(path)}] = (() => {\n${body}\nreturn { ${exported.join(", ")} };\n})();`;
}

const html = await read("index.html");
const css = await read("assets/style.css");
const js = [
  wrapModule("luchao-core.js", await read("assets/luchao-core.js")),
  wrapModule("luchao-extra.js", await read("assets/luchao-extra.js")),
  wrapModule("app.js", await read("assets/app.js")),
].join("\n\n");

const title = /<title>[\s\S]*?<\/title>/.exec(html)[0].replace(/<title>[^<]*<\/title>/, "<title>Lập Quẻ Lục Hào</title>");
const body = /<body>([\s\S]*)<\/body>/.exec(html)[1];

const out = `${title}
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${css}
</style>
${body.trim()}
<script>
window.__LUCHAO_EMBED__ = true;
(() => {
const __m = {};
${js}
})();
</script>
`;

await mkdir(new URL("dist/", root), { recursive: true });
await writeFile(new URL("dist/luchao-embed.html", root), out);
console.log(`dist/luchao-embed.html: ${(out.length / 1024).toFixed(1)} KB`);
