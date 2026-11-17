/**
 * Gera ícones PWA 192 e 512 a partir de public/logo.png
 * Uso: node scripts/generate-pwa-icons.mjs
 */
import sharp from 'sharp'
import { mkdir, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'public', 'logo.png')
const outDir = path.join(root, 'public', 'pwa')

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

if (!(await exists(src))) {
  console.error('public/logo.png não encontrado')
  process.exit(1)
}

await mkdir(outDir, { recursive: true })

for (const size of [180, 192, 512]) {
  const out = path.join(outDir, size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`)
  await sharp(src)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 10, g: 10, b: 10, alpha: 1 },
    })
    .png()
    .toFile(out)
  console.log('Gerado', out)
}
