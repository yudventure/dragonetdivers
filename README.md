# Dragonet Divers Raja Ampat

Website dive center Dragonet Divers, Raja Ampat. Tahap saat ini: **identitas brand**. Website dibangun setelah branding disetujui.

- Pedoman brand: [BRANDING.md](./BRANDING.md)
- Brand book visual: `brand/brand-guide.html` (buka di browser; tangkapan layar di `brand/preview/`)
- Token desain untuk website: `brand/tokens.css`, `brand/tokens.json`, komponen referensi `brand/components.css`
- Template media sosial: `brand/social/templates.html`, PNG di `brand/social/preview/` dan `brand/social/highlights/`

Render ulang PNG setelah mengubah template atau brand book:

```sh
npm i -D playwright   # sekali saja
node brand/social/export.mjs
```
