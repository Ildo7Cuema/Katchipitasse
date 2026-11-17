import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const input = path.join(root, 'public', 'logo.png')
const outputs = [
  path.join(root, 'public', 'logo.png'),
  path.join(root, 'src', 'assets', 'logo.png'),
]

const WHITE_THRESHOLD = 245

const image = sharp(input)
const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width, height, channels } = info
const pixels = new Uint8ClampedArray(data)
const visited = new Uint8Array(width * height)

function isNearWhite(i) {
  const r = pixels[i]
  const g = pixels[i + 1]
  const b = pixels[i + 2]
  return r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD
}

function idx(x, y) {
  return (y * width + x) * channels
}

const queue = []

function enqueue(x, y) {
  if (x < 0 || y < 0 || x >= width || y >= height) return
  const p = y * width + x
  if (visited[p]) return
  const i = idx(x, y)
  if (!isNearWhite(i)) return
  visited[p] = 1
  queue.push(x, y)
}

// Flood-fill from edges so the white "K" inside the black circle is preserved
for (let x = 0; x < width; x += 1) {
  enqueue(x, 0)
  enqueue(x, height - 1)
}
for (let y = 0; y < height; y += 1) {
  enqueue(0, y)
  enqueue(width - 1, y)
}

while (queue.length) {
  const y = queue.pop()
  const x = queue.pop()
  const i = idx(x, y)
  pixels[i + 3] = 0
  enqueue(x + 1, y)
  enqueue(x - 1, y)
  enqueue(x, y + 1)
  enqueue(x, y - 1)
}

// Remove thin vertical edge artifacts (1–2 px lines on left/right)
function clearSolidEdgeColumns() {
  for (const x of [0, 1, width - 1, width - 2]) {
    if (x < 0 || x >= width) continue
    let opaque = 0
    for (let y = 0; y < height; y += 1) {
      if (pixels[idx(x, y) + 3] > 20) opaque += 1
    }
    if (opaque / height > 0.85) {
      for (let y = 0; y < height; y += 1) {
        const i = idx(x, y)
        pixels[i] = 0
        pixels[i + 1] = 0
        pixels[i + 2] = 0
        pixels[i + 3] = 0
      }
    }
  }
}

clearSolidEdgeColumns()

const transparent = Buffer.from(pixels)
const png = await sharp(transparent, {
  raw: { width, height, channels },
})
  .png()
  .toBuffer()

for (const out of outputs) {
  await sharp(png).toFile(out)
  console.log('Wrote', out)
}
