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

`scripts/og-image.html` là nguồn của `og-image.png` (chụp bằng Chrome headless 1200×630).
