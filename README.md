# Lập quẻ Lục Hào online

Trang web tĩnh (HTML + CSS + JS module, không framework) để lập lá quẻ Lục Hào: chỉnh từng hào, nhập giờ gieo, ra Nạp Giáp, Thế Ứng, Lục thân, Lục thú, Phục thần, Tuần không, can chi theo tiết khí.

- Lõi tính quẻ: `assets/luchao-core.js` (không sửa logic).
- Giao diện: `assets/app.js`, `assets/style.css`, `index.html`.
- Chia sẻ bằng URL: `?h=997888&t=2026-11-08T14:18` (`h` = hào 1 → 6, 7/8/9/6; `&z=0` = đổi ngày lúc 0h).

## Chạy thử

```bash
npm test                     # 13 kiểm thử lõi
node scripts/serve.mjs 8080  # mở http://localhost:8080/
```

## Trước khi deploy

Thay `YOUR-DOMAIN` (canonical, OG, JSON-LD, robots.txt, sitemap.xml):

```bash
node scripts/set-domain.mjs luchao.pages.dev
```

Deploy: Cloudflare Pages hoặc GitHub Pages, build command để trống, output directory là thư mục gốc.

Bản một file (để đăng ở nơi không tải được JS riêng, ví dụ Artifact): `node scripts/build-embed.mjs` → `dist/luchao-embed.html`. Bản này dùng link `#q-997888-202611081418`.

`scripts/og-image.html` là nguồn của `og-image.png` (chụp bằng Chrome headless 1200×630).

## 64 trang quẻ

`node scripts/build-64.mjs` sinh `que/<slug>/index.html` cho 64 quẻ, trang danh mục `que/index.html`, khối liên kết trên trang chủ (giữa hai dấu `<!-- 64-que:… -->`) và `sitemap.xml`. Bảng nạp giáp, lục thân, phục thần lấy từ lõi; phần giới thiệu từng quẻ ở `scripts/que-data.mjs`; lời quẻ, lời Tượng, hào từ (âm Hán Việt) và phần giảng ở `scripts/que-kinh-1..4.mjs` (tự soạn, đã đối chiếu nghĩa tên quẻ với Kinh Dịch bản Ngô Tất Tố, không trích nguyên văn). Domain lấy từ thẻ canonical của `index.html`, nên sau khi đổi domain chỉ cần chạy lại script này.
