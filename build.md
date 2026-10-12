# build.md — Reproductor del build (apcautomatizacion.site)

Guía para regenerar los artefactos estáticos del sitio. El sitio es HTML/CSS/JS puro
servido por **GitHub Pages legacy desde la raíz de `main`** (repo
`serviciosapcsoporte-create/apcautomatizacion`). No hay pipeline de build automatizado:
estos pasos son **manuales** y el resultado debe commitearse.

## Requisitos

- Node.js + npm (probado con Node v24, npm 11).
- ffmpeg/ffprobe (Gyan essentials) para optimizar medios.

## Gotcha principal (Windows)

**CMD/npm no soportan un directorio de trabajo UNC** (`\\DESKTOP-BB2QBQ3\...`).
El build de Tailwind hay que correrlo desde una **carpeta local**, no desde el repo en la red.

---

## 1) Tailwind CSS estático

El sitio usa utilidades Tailwind, pero **sin CDN runtime**. Se compila a un único
`tailwind.generated.css` y se sirve estático.

- Entrada versionada: `tailwind.input.css` → contiene solo `@import "tailwindcss";`
- Salida versionada: `tailwind.generated.css` (≈43 KB minificado)
- El HTML de las páginas carga `<link rel="stylesheet" href="tailwind.generated.css">`
  **después** de `estilos.css` (para preservar la cascada original).

### Recompilar (cada vez que cambien clases)

```powershell
# 1. Copiar el repo a una carpeta LOCAL (evita el problema de UNC en CMD)
$repo = "\\DESKTOP-BB2QBQ3\D-Portatil\APC\Hosting APC\apcautomatizacion.site"
$b    = "C:\Users\pc\AppData\Local\Temp\opencode\tw-build"
if (Test-Path $b) { Remove-Item $b -Recurse -Force }
robocopy $repo $b /E /XD .git node_modules /R:1 /W:1 /NFL /NDL /NJH /NJS | Out-Null
Get-ChildItem $repo -Directory | Where-Object { $_.Name -notin @('.git','node_modules') } |
  ForEach-Object { robocopy $_.FullName (Join-Path $b $_.Name) /E /R:1 /W:1 /NFL /NDL /NJH /NJS | Out-Null }

# 2. Instalar Tailwind (v4) localmente
Push-Location $b
npm init -y | Out-Null
npm i -D tailwindcss@4.1.11 @tailwindcss/cli@4.1.11

# 3. Compilar (auto-detección de clases escanea los .html del directorio)
npx tailwindcss -i "tailwind.input.css" -o "tailwind.generated.css" --minify

# 4. Copiar la salida de vuelta al repo
Copy-Item "$b\tailwind.generated.css" "$repo\tailwind.generated.css" -Force
Pop-Location
```

### Verificación de cobertura

Antes de commitear, confirmar que ninguna clase del HTML quedó por fuera.
Extraer los tokens de `class="..."` de cada página y comprobar que el selector
escapado existe en `tailwind.generated.css`. Las páginas del sitio deben dar **0 faltantes**;
las clases custom definidas en `estilos.css` (p. ej. `card-glow`, `reveal`, `material`,
`grid-bg`, `whatsapp-float`) y las del `<style>` propio de `calculadora-ahorro.html`
(p. ej. `page`, `card`, `slider-row`) se ignoran porque no son Tailwind.

---

## 2) Iconos lucide inline (sin CDN runtime)

Los iconos ya **no** se cargan con `<script src="https://unpkg.com/lucide@latest">`.
Están horneados como `<svg>` inline (conservando la clase del `<i>` original y
`aria-hidden="true"`).

- Fuente: paquete `lucide-static` (`node_modules/lucide-static/icons/<name>.svg`).
- Nota: los `.svg` de lucide-static traen un **comentario de licencia antes de `<svg`**;
  hay que removerlo antes de inyectar la clase.

### Regenerar (cuando se agreguen/cambien iconos o sus clases)

Instalar y ejecutar el script (guárdalo como `inline_lucide.js`):

```powershell
Push-Location "C:\Users\pc\AppData\Local\Temp\opencode\tw-build"
npm i -D lucide-static@latest
node inline_lucide.js "\\DESKTOP-BB2QBQ3\D-Portatil\APC\Hosting APC\apcautomatizacion.site"
Pop-Location
```

```javascript
// inline_lucide.js
const fs = require('fs');
const path = require('path');
const repo = process.argv[2];
const iconsDir = path.join(__dirname, 'node_modules', 'lucide-static', 'icons');
const files = ['index.html', 'servicios.html', 'panel-taller.html', 'calculadora-ahorro.html'];

function svgFor(name, cls) {
  const f = path.join(iconsDir, name + '.svg');
  if (!fs.existsSync(f)) return null;
  let svg = fs.readFileSync(f, 'utf8').replace(/<!--[\s\S]*?-->/g, '').trim();
  svg = svg.replace('<svg', '<svg aria-hidden="true" focusable="false"');
  if (cls) {
    if (/class="[^"]*"/.test(svg)) svg = svg.replace(/class="[^"]*"/, 'class="' + cls + '"');
    else svg = svg.replace('<svg', '<svg class="' + cls + '"');
  }
  return svg.replace(/\s+/g, ' ');
}

for (const file of files) {
  const full = path.join(repo, file);
  let html = fs.readFileSync(full, 'utf8');
  let count = 0, missing = [];
  html = html.replace(/<i\s+data-lucide="([^"]+)"([^>]*)><\/i>/g, (m, name, rest) => {
    const cls = (rest.match(/class="([^"]*)"/) || [])[1] || '';
    const svg = svgFor(name, cls);
    if (!svg) { missing.push(name); return m; }
    count++;
    return svg;
  });
  html = html.replace(/<script src="https:\/\/unpkg\.com\/lucide@latest"><\/script>\s*/g, '');
  html = html.replace(/<script>\s*lucide\.createIcons\(\);?\s*<\/script>\s*/g, '');
  fs.writeFileSync(full, html);
  console.log(`${file}: reemplazados=${count} faltantes=${missing.length}`);
}
```

Iconos usados actualmente (nombres kebab de lucide): `alert-triangle, arrow-left, bot,
calculator, check, chevron-down, clipboard-check, clock, cpu, database, file-text,
git-branch, grid-3x3, layers, layout-dashboard, mail, map-pin, map-pinned, menu,
message-circle, monitor-smartphone, package, phone, refresh-cw, server, shuffle, signal,
sparkles, trending-down, trending-up, user-plus, users, wallet, wand-2, wrench, zap`.

---

## 3) Optimización de medios

### Video de fondo (autoplay muted loop)

```powershell
$img = "\\DESKTOP-BB2QBQ3\D-Portatil\APC\Hosting APC\apcautomatizacion.site\imagenes"
ffmpeg -y -i "$img\Servicios APC.mp4" -vf "scale=854:480" -c:v libx264 -preset slow `
  -crf 31 -pix_fmt yuv420p -movflags +faststart -an "$img\Servicios APC.mp4"
```

Objetivo: < 800 KB (1280×720/2.4 MB → 854×480/≈705 KB). `-an` quita audio (el video es mudo).

### Imágenes WebP de tarjetas (1920×1280)

```powershell
ffmpeg -y -i "entrada.webp" -vf "scale=1100:-1" -quality 82 -compression_level 6 "salida.webp"
```

Objetivo: ~70 KB por imagen (antes 300–360 KB).

Regla: eliminar duplicados y huérfanos (no subir variantes sin referenciar; el repo
completo alimenta cada build de Pages).

---

## 4) Publicar

GitHub Pages **legacy** publica al hacer **push a `main`** (build desde la raíz).

```powershell
$repo = "\\DESKTOP-BB2QBQ3\D-Portatil\APC\Hosting APC\apcautomatizacion.site"
git -C $repo add -A
git -C $repo commit -m "build: <descripcion>"
git -C $repo push origin main
```

Tras el push, validar en vivo (tarda ~1–2 min):

- `https://apcautomatizacion.site/tailwind.generated.css` → 200 `text/css`
- Cada página → 200 y con `href="tailwind.generated.css"` y SVG inline
- Sin referencias a `cdn.tailwindcss.com`, `@tailwindcss/browser` ni `unpkg.com/lucide`

## Invariantes a no romper

- **GA4 `G-EWFDLTCM8R`** debe permanecer en todas las páginas.
- **Cascada:** `estilos.css` primero, `tailwind.generated.css` después.
- `tailwind.input.css` y `tailwind.generated.css` van versionados; `node_modules/` está en `.gitignore`.
