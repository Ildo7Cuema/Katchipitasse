/**
 * Gera ícones PWA a partir de public/logo.png
 * - Fundo branco (legível no ecrã principal iOS/Android)
 * - Recorte do monograma KE (sem texto miúdo)
 * - Preto de fundo removido só por flood-fill das bordas (preserva o gradiente do E)
 *
 * Uso: node scripts/generate-pwa-icons.mjs
 */
import sharp from 'sharp'
import { mkdir, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcPath = path.join(root, 'public', 'logo.png')
const outDir = path.join(root, 'public', 'pwa')

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

if (!(await exists(srcPath))) {
  console.error('public/logo.png não encontrado')
  process.exit(1)
}

await mkdir(outDir, { recursive: true })

const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: w, height: h, channels } = info
const idx = (x, y) => (y * w + x) * channels

function isBgPixel(i) {
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]
  return r + g + b < 42 && r < 55 && g < 55 && b < 55
}

// Flood-fill near-black from image edges → background mask
const bg = new Uint8Array(w * h)
const queue = []
const push = (x, y) => {
  const p = y * w + x
  if (bg[p]) return
  if (!isBgPixel(idx(x, y))) return
  bg[p] = 1
  queue.push(p)
}

for (let x = 0; x < w; x++) {
  push(x, 0)
  push(x, h - 1)
}
for (let y = 0; y < h; y++) {
  push(0, y)
  push(w - 1, y)
}

while (queue.length) {
  const p = queue.pop()
  const x = p % w
  const y = (p - x) / w
  if (x > 0) push(x - 1, y)
  if (x + 1 < w) push(x + 1, y)
  if (y > 0) push(x, y - 1)
  if (y + 1 < h) push(x, y + 1)
}

// Flat RGBA: background → white, keep artwork
const flat = Buffer.alloc(w * h * 4)
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const p = y * w + x
    const o = p * 4
    const i = idx(x, y)
    if (bg[p]) {
      flat[o] = 255
      flat[o + 1] = 255
      flat[o + 2] = 255
      flat[o + 3] = 255
    } else {
      flat[o] = data[i]
      flat[o + 1] = data[i + 1]
      flat[o + 2] = data[i + 2]
      flat[o + 3] = 255
    }
  }
}

function contentBounds(buf, width, height, x0 = 0, y0 = 0, x1 = width - 1, y1 = height - 1) {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const o = (y * width + x) * 4
      if (buf[o] > 250 && buf[o + 1] > 250 && buf[o + 2] > 250) continue
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
  if (maxX < 0) return null
  return { minX, minY, maxX, maxY }
}

const full = contentBounds(flat, w, h)
if (!full) {
  console.error('Não foi possível detectar o conteúdo do logo')
  process.exit(1)
}

const contentH = full.maxY - full.minY + 1
const monoRatio = 0.58
const monoMaxY = full.minY + Math.floor(contentH * monoRatio)
const region = contentBounds(flat, w, h, full.minX, full.minY, full.maxX, monoMaxY)
const pad = 16
const left = Math.max(0, region.minX - pad)
const top = Math.max(0, region.minY - pad)
const right = Math.min(w - 1, region.maxX + pad)
const bottom = Math.min(h - 1, region.maxY + pad)
const cropW = right - left + 1
const cropH = bottom - top + 1

const cropped = Buffer.alloc(cropW * cropH * 4)
for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    const si = ((top + y) * w + (left + x)) * 4
    const di = (y * cropW + x) * 4
    cropped[di] = flat[si]
    cropped[di + 1] = flat[si + 1]
    cropped[di + 2] = flat[si + 2]
    cropped[di + 3] = 255
  }
}

async function writeIcon(fileName, size, safeScale) {
  const box = Math.floor(size * safeScale)
  const scale = Math.min(box / cropW, box / cropH)
  const dw = Math.max(1, Math.round(cropW * scale))
  const dh = Math.max(1, Math.round(cropH * scale))
  const leftPad = Math.floor((size - dw) / 2)
  const topPad = Math.floor((size - dh) / 2)

  const emblem = await sharp(cropped, { raw: { width: cropW, height: cropH, channels: 4 } })
    .resize(dw, dh, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer()

  const out = path.join(outDir, fileName)
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{ input: emblem, left: leftPad, top: topPad }])
    .png()
    .toFile(out)

  console.log('Gerado', out, `(emblem ${cropW}x${cropH} → ${dw}x${dh})`)
}

await writeIcon('apple-touch-icon.png', 180, 0.96)
await writeIcon('icon-192.png', 192, 0.96)
await writeIcon('icon-512.png', 512, 0.94)
await writeIcon('icon-512-maskable.png', 512, 0.72)
