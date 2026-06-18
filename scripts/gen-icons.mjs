// Génère les icônes PNG de la PWA à partir des sources SVG.
// Usage : node scripts/gen-icons.mjs
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pub = (p) => resolve(root, 'public', p)

const jobs = [
  { src: 'icon.svg', out: 'pwa-192x192.png', size: 192 },
  { src: 'icon.svg', out: 'pwa-512x512.png', size: 512 },
  { src: 'icon.svg', out: 'apple-touch-icon.png', size: 180 },
  { src: 'icon-maskable.svg', out: 'pwa-maskable-512x512.png', size: 512 },
]

for (const job of jobs) {
  await sharp(pub(job.src), { density: 384 })
    .resize(job.size, job.size, { fit: 'cover' })
    .png()
    .toFile(pub(job.out))
  console.log(`✓ ${job.out} (${job.size}px)`)
}
