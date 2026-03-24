/**
 * Audit script for MDX meta descriptions.
 * Run: npx tsx scripts/audit-descriptions.ts
 */
import { globSync } from 'glob'
import matter from 'gray-matter'
import { readFileSync } from 'fs'

const files = globSync('content/docs/**/*.mdx')
const descriptions = new Map<string, string[]>()

let missing = 0
let tooShort = 0
let tooLong = 0
let ok = 0

for (const file of files) {
  const { data } = matter(readFileSync(file, 'utf-8'))
  const desc: string = data.description ?? ''

  if (desc.length === 0) {
    console.warn(`❌ MISSING: ${file}`)
    missing++
  } else if (desc.length > 160) {
    console.warn(`⚠️  TOO LONG (${desc.length} chars): ${file}`)
    console.warn(`   "${desc}"`)
    tooLong++
  } else if (desc.length < 80) {
    console.warn(`📏 TOO SHORT (${desc.length} chars): ${file}`)
    console.warn(`   "${desc}"`)
    tooShort++
  } else {
    ok++
  }

  const existing = descriptions.get(desc) ?? []
  existing.push(file)
  descriptions.set(desc, existing)
}

console.log('\n--- Duplicate Check ---')
let dupes = 0
for (const [desc, dupFiles] of descriptions) {
  if (dupFiles.length > 1) {
    console.warn(`🔁 DUPLICATE: "${desc}"`)
    for (const f of dupFiles) console.warn(`   - ${f}`)
    dupes++
  }
}

console.log('\n--- Summary ---')
console.log(`Total pages: ${files.length}`)
console.log(`✅ OK (80-160 chars): ${ok}`)
console.log(`📏 Too short (<80): ${tooShort}`)
console.log(`⚠️  Too long (>160): ${tooLong}`)
console.log(`❌ Missing: ${missing}`)
console.log(`🔁 Duplicate descriptions: ${dupes}`)
