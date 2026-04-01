/**
 * CLI script to generate OG images using Sharp.
 *
 * Usage:
 *   npx tsx scripts/generate-og-image.ts \
 *     --title "Article Title" \
 *     --subtitle "Optional description" \
 *     --category "LISTICLE" \
 *     --bg "coral-reef" \
 *     --output "public/og-images/my-article.png"
 */
import fs from 'node:fs'
import path from 'node:path'
import { generateOGImage, listBackgrounds } from '../lib/og-image'

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

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (!args.title) {
    console.error('Usage: npx tsx scripts/generate-og-image.ts --title "Title" [--subtitle "..."] [--category "..."] [--bg "name"] [--output "path"]')
    console.error('\nAvailable backgrounds:', listBackgrounds().join(', '))
    process.exit(1)
  }

  const outputPath = args.output || path.join('public', 'og-images', `${args.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}.png`)

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  console.log(`Generating OG image...`)
  console.log(`  Title: ${args.title}`)
  if (args.subtitle) console.log(`  Subtitle: ${args.subtitle}`)
  if (args.category) console.log(`  Category: ${args.category}`)
  console.log(`  Background: ${args.bg || '(auto-pick from title hash)'}`)
  console.log(`  Output: ${outputPath}`)

  const buffer = await generateOGImage({
    title: args.title,
    subtitle: args.subtitle,
    category: args.category,
    background: args.bg,
  })

  fs.writeFileSync(outputPath, buffer)
  console.log(`\nDone! ${(buffer.length / 1024).toFixed(0)}KB written to ${outputPath}`)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
