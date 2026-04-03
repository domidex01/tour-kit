/**
 * Screenshot tools mentioned in a blog article using Puppeteer.
 *
 * Usage:
 *   npx tsx scripts/screenshot-article-tools.ts \
 *     --article "content/blog/best-product-tour-tools-react.mdx" \
 *     --output "public/screenshots"
 */
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import path from 'node:path'

// ── Tool name → URL registry ──
const TOOL_URLS: Record<string, string> = {
  'usertourkit': 'https://usertourkit.com',
  'react joyride': 'https://react-joyride.com',
  'shepherd.js': 'https://shepherdjs.dev',
  'shepherd': 'https://shepherdjs.dev',
  'driver.js': 'https://driverjs.com',
  'reactour': 'https://docs.reactour.dev',
  'onboardjs': 'https://onboardjs.com',
  'onborda': 'https://onborda.dev',
  'intro.js': 'https://introjs.com',
  'appcues': 'https://www.appcues.com',
  'userpilot': 'https://userpilot.com',
  'pendo': 'https://www.pendo.io',
  'chameleon': 'https://www.chameleon.io',
  'walkme': 'https://www.walkme.com',
  'userflow': 'https://userflow.com',
  'userguiding': 'https://userguiding.com',
  'whatfix': 'https://www.whatfix.com',
  'frigade': 'https://frigade.com',
  'radix primitives': 'https://www.radix-ui.com/primitives',
  'radix': 'https://www.radix-ui.com/primitives',
  'react aria': 'https://react-spectrum.adobe.com/react-aria/',
  'base ui': 'https://base-ui.com',
  'ark ui': 'https://ark-ui.com',
  'headless ui': 'https://headlessui.com',
}

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--') && i + 1 < args.length) {
      result[args[i].slice(2)] = args[i + 1]
      i++
    }
  }
  return result
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').replace(/^-+/, '')
}

function extractToolMentions(content: string): { name: string; slug: string; url: string }[] {
  const found: { name: string; slug: string; url: string }[] = []
  const seen = new Set<string>()

  for (const [toolName, url] of Object.entries(TOOL_URLS)) {
    const regex = new RegExp(toolName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    if (regex.test(content)) {
      const slug = slugify(toolName)
      if (!seen.has(url)) {
        seen.add(url)
        found.push({ name: toolName, slug, url })
      }
    }
  }

  return found
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (!args.article) {
    console.error('Usage: npx tsx scripts/screenshot-article-tools.ts --article "path/to/article.mdx" [--output "public/screenshots"] [--width 1280] [--delay 4000]')
    process.exit(1)
  }

  const articlePath = args.article
  const outputDir = args.output || 'public/screenshots'
  const width = parseInt(args.width || '1280', 10)
  const delay = parseInt(args.delay || '4000', 10)

  if (!fs.existsSync(articlePath)) {
    console.error(`Article not found: ${articlePath}`)
    process.exit(1)
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const content = fs.readFileSync(articlePath, 'utf-8')
  const tools = extractToolMentions(content)

  if (tools.length === 0) {
    console.log('No known tools found in article.')
    process.exit(0)
  }

  console.log(`Found ${tools.length} tools in article:\n`)
  for (const t of tools) {
    console.log(`  - ${t.name} → ${t.url}`)
  }
  console.log()

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const results: { name: string; slug: string; path: string; alt: string }[] = []

  for (const tool of tools) {
    const outPath = path.join(outputDir, `${tool.slug}.avif`)
    console.log(`Capturing ${tool.name} (${tool.url})...`)

    try {
      const page = await browser.newPage()
      await page.setViewport({ width, height: 720, deviceScaleFactor: 2 })
      await page.goto(tool.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await new Promise((r) => setTimeout(r, delay))

      // Try to dismiss cookie banners
      try {
        const dismissSelectors = [
          'button:has-text("Accept")',
          'button:has-text("Got it")',
          'button:has-text("Close")',
          '[aria-label="Close"]',
        ]
        for (const sel of dismissSelectors) {
          const btn = await page.$(sel)
          if (btn) {
            const visible = await btn.boundingBox()
            if (visible) {
              await btn.click()
              await new Promise((r) => setTimeout(r, 500))
              break
            }
          }
        }
      } catch {
        // Ignore
      }

      // Screenshot as PNG first, then convert to AVIF with Sharp
      const pngBuffer = await page.screenshot({ type: 'png' })
      const sharp = (await import('sharp')).default
      const avifBuffer = await sharp(pngBuffer)
        .resize(1280, 720, { fit: 'cover' })
        .avif({ quality: 60 })
        .toBuffer()
      fs.writeFileSync(outPath, avifBuffer)

      // Grab page title for alt text
      const pageTitle = await page.title()
      const alt = pageTitle
        ? `Screenshot of ${pageTitle}`
        : `Screenshot of ${tool.name} homepage`
      await page.close()

      results.push({ name: tool.name, slug: tool.slug, path: outPath, alt })
      console.log(`  ✓ Saved to ${outPath} (alt: "${alt}")`)
    } catch (err) {
      console.error(`  ✗ Failed: ${(err as Error).message}`)
    }
  }

  await browser.close()

  console.log('\n── MDX image embeds (copy into article) ──\n')
  for (const r of results) {
    const relativePath = `/screenshots/${r.slug}.avif`
    console.log(`![${r.alt}](${relativePath})`)
  }
  console.log()
  console.log(`Done! ${results.length}/${tools.length} screenshots captured.`)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
