import path from 'node:path'
import sharp from 'sharp'
import fs from 'node:fs'

const OG_WIDTH = 1200
const OG_HEIGHT = 630
const BG_DIR = path.join(process.cwd(), 'og-backgrounds')

export interface OGImageOptions {
  title: string
  subtitle?: string
  category?: string
  /** Background image name (without extension) or full path */
  background?: string
}

/** List available background image names */
export function listBackgrounds(): string[] {
  if (!fs.existsSync(BG_DIR)) return []
  return fs
    .readdirSync(BG_DIR)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .map((f) => f.replace(/\.[^.]+$/, ''))
}

/** Pick a background deterministically from a string (slug hash) */
function pickBackground(seed: string): string {
  const bgs = listBackgrounds()
  if (bgs.length === 0) return ''
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  }
  return bgs[Math.abs(hash) % bgs.length]
}

function resolveBackgroundPath(bg?: string): string | null {
  if (!bg) return null
  // Full path
  if (path.isAbsolute(bg) && fs.existsSync(bg)) return bg
  // Name lookup
  const dir = BG_DIR
  for (const ext of ['.png', '.jpg', '.jpeg', '.webp', '']) {
    const p = path.join(dir, bg + ext)
    if (fs.existsSync(p)) return p
  }
  return null
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if (current.length + word.length + 1 > maxCharsPerLine && current) {
      lines.push(current)
      current = word
    } else {
      current = current ? `${current} ${word}` : word
    }
  }
  if (current) lines.push(current)
  return lines
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildTextSvg(options: OGImageOptions): Buffer {
  const { title, category } = options

  // Title: wrap at ~32 chars for large text
  const titleLines = wrapText(title, 32)
  const titleFontSize = titleLines.length > 2 ? 44 : 52
  const titleLineHeight = titleFontSize * 1.2

  // Vertically center title between badge area (top ~100px) and branding bar (bottom ~80px)
  const topBound = category ? 110 : 80
  const bottomBound = OG_HEIGHT - 80
  const totalTitleHeight = titleLines.length * titleLineHeight
  const titleStartY = topBound + (bottomBound - topBound - totalTitleHeight) / 2 + titleFontSize

  // Category badge
  const categorySvg = category
    ? `
    <rect x="72" y="52" width="${category.length * 12 + 32}" height="36" rx="6" fill="#0197f6"/>
    <text x="88" y="76" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="15" font-weight="700" fill="#fff" letter-spacing="0.08em">${escapeXml(category.toUpperCase())}</text>
  `
    : ''

  // Title lines
  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="72" y="${titleStartY + i * titleLineHeight}" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="${titleFontSize}" font-weight="800" fill="#ffffff" letter-spacing="-0.02em">${escapeXml(line)}</text>`,
    )
    .join('\n')

  // Branding bar with userTourKit logo
  const brandY = OG_HEIGHT - 48
  const logoRenderWidth = 36
  const logoX = 68
  // Scale factor: logo viewBox is 926x1342, render at 36px wide (~52px tall)
  const logoScale = logoRenderWidth / 926
  const logoRenderHeight = 1342 * logoScale
  const logoY = brandY - logoRenderHeight + 20
  const brandSvg = `
    <g transform="translate(${logoX}, ${logoY}) scale(${logoScale.toFixed(5)})">
      <path d="M637.387 360.13C637.387 374.436 625.773 386.063 611.467 386.063H314.227C299.933 386.063 288.307 374.436 288.307 360.13C288.307 345.85 299.933 334.223 314.227 334.223H611.467C625.773 334.223 637.387 345.85 637.387 360.13Z" fill="#FFE20A"/>
      <path d="M552.533 205.048V280.568H373.16V205.048C373.16 155.595 413.387 115.355 462.853 115.355C512.307 115.355 552.533 155.595 552.533 205.048Z" fill="#FFE20A"/>
      <path d="M309.12 528.716L268.013 828.143C242.453 830.89 217.32 838.05 194.227 849.237C147.24 872.01 93.3601 872.01 46.3734 849.237L0 826.743V564.53C0 544.756 16.0267 528.716 35.8 528.716H309.12Z" fill="#0197F6"/>
      <path d="M925.707 564.53V826.743L879.333 849.237C832.64 871.85 779.16 872.01 732.4 849.677L731.453 849.223C708.373 838.037 683.24 830.89 657.68 828.143L616.573 528.717H889.907C909.68 528.717 925.707 544.757 925.707 564.53Z" fill="#0197F6"/>
      <path d="M813.68 1181.04C726.36 1282.76 599.44 1341.85 462.853 1341.85C326.253 1341.85 199.347 1282.76 112.027 1181.04C148.187 1182.36 184.56 1174.93 217.64 1158.89C240.56 1147.8 266.12 1141.92 291.573 1141.92C316.573 1141.92 341.68 1147.57 364.267 1158.3L365.507 1158.89C395.667 1173.52 429.32 1181.25 462.853 1181.25C496.333 1181.25 529.96 1173.53 560.08 1158.94L560.187 1158.89C606.867 1136.26 660.36 1136.12 707.12 1158.44L708.067 1158.89C741.147 1174.93 777.52 1182.36 813.68 1181.04Z" fill="#0197F6"/>
      <path d="M925.64 886.41C924.333 968.836 901.293 1048.9 858.707 1118.98C817.36 1132.68 771.84 1129.89 732.373 1111.06L731.453 1110.62C701.307 1096 667.64 1088.26 634.12 1088.26C600.627 1088.26 566.973 1096 536.84 1110.58L536.773 1110.62C490.24 1133.2 436.893 1133.38 390.213 1111.25L388.907 1110.61C358.747 1096 325.08 1088.26 291.574 1088.26C258.054 1088.26 224.4 1096 194.227 1110.62C154.56 1129.85 108.667 1132.78 67.0001 1118.98C24.4134 1048.9 1.36013 968.836 0.0534668 886.41L22.9602 897.517C53.1336 912.143 86.7869 919.863 120.294 919.863C153.827 919.863 187.48 912.143 217.64 897.517C240.534 886.41 266.107 880.543 291.574 880.543C317.04 880.543 342.613 886.41 365.52 897.517C395.68 912.143 429.333 919.863 462.853 919.863C496.32 919.863 529.933 912.157 560.067 897.57L560.187 897.503C606.867 874.89 660.36 874.717 707.133 897.063L708.067 897.517C738.213 912.143 771.88 919.863 805.4 919.863C838.92 919.863 872.573 912.143 902.733 897.517L925.64 886.41Z" fill="#0197F6"/>
      <path d="M798.72 280.568H625.974C611.16 280.568 599.16 268.554 599.16 253.741C599.16 238.928 611.16 226.915 625.974 226.915H798.72C813.534 226.915 825.534 238.928 825.534 253.741C825.534 268.554 813.534 280.568 798.72 280.568Z" fill="#0197F6"/>
      <path d="M582.947 135.515C574.987 123.021 578.64 106.434 591.133 98.4744L738.853 4.20775C751.347 -3.75225 767.933 -0.085535 775.893 12.3945C783.867 24.8878 780.2 41.4745 767.707 49.4478L620 143.701C607.507 151.661 590.92 148.008 582.947 135.515Z" fill="#0197F6"/>
      <path d="M299.72 280.568H126.987C112.173 280.568 100.173 268.554 100.173 253.741C100.173 238.928 112.173 226.915 126.987 226.915H299.72C314.547 226.915 326.547 238.928 326.547 253.741C326.547 268.554 314.547 280.568 299.72 280.568Z" fill="#0197F6"/>
      <path d="M305.707 143.701L158 49.4478C145.507 41.4745 141.84 24.8878 149.813 12.3945C157.773 -0.085535 174.36 -3.75225 186.853 4.20775L334.574 98.4744C347.067 106.434 350.72 123.021 342.76 135.515C334.787 148.008 318.2 151.661 305.707 143.701Z" fill="#0197F6"/>
      <path d="M503.213 638.796C503.213 643.29 499.573 646.93 495.093 646.93H430.613C426.133 646.93 422.493 643.29 422.493 638.796V596.583C422.493 574.29 440.56 556.223 462.853 556.223C474 556.223 484.093 560.73 491.387 568.036C498.693 575.343 503.213 585.436 503.213 596.583V638.796ZM550.2 439.703H375.507L322.04 829.01C345.213 832.223 367.907 839.05 388.92 849.236C411.827 860.343 437.4 866.21 462.853 866.21C488.307 866.21 513.867 860.343 536.773 849.236L536.787 849.223C536.787 849.223 536.787 849.223 536.8 849.223L536.867 849.196C557.853 839.023 580.52 832.196 603.653 828.996L550.2 439.703Z" fill="#FFE20A"/>
    </g>
    <text x="${logoX + Math.round(logoRenderWidth) + 10}" y="${brandY + 3}" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="20" font-weight="700" fill="#fafafa">userTourKit</text>
    <text x="${OG_WIDTH - 72}" y="${brandY + 3}" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="17" fill="#a1a1aa" text-anchor="end">usertourkit.com</text>
  `

  const svg = `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  ${categorySvg}
  ${titleSvg}
  ${brandSvg}
</svg>`

  return Buffer.from(svg)
}

function buildGradientOverlay(): Buffer {
  // Dark gradient: transparent top → dark bottom for text legibility
  const svg = `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.35"/>
      <stop offset="40%" stop-color="#000" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.8"/>
    </linearGradient>
  </defs>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#g)"/>
</svg>`
  return Buffer.from(svg)
}

export async function generateOGImage(options: OGImageOptions): Promise<Buffer> {
  const bgName = options.background || pickBackground(options.title)
  const bgPath = resolveBackgroundPath(bgName)

  let base: sharp.Sharp

  if (bgPath) {
    // Resize + crop background to OG dimensions
    base = sharp(bgPath).resize(OG_WIDTH, OG_HEIGHT, {
      fit: 'cover',
      position: 'center',
    })
  } else {
    // Fallback: solid dark background
    base = sharp({
      create: {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        channels: 4,
        background: { r: 9, g: 9, b: 11, alpha: 1 },
      },
    })
  }

  const gradientOverlay = buildGradientOverlay()
  const textLayer = buildTextSvg(options)

  return base
    .composite([
      { input: gradientOverlay, blend: 'over' },
      { input: textLayer, blend: 'over' },
    ])
    .png({ quality: 90 })
    .toBuffer()
}
