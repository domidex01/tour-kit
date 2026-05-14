#!/usr/bin/env node
// One-off helper: run a transform across every .input.tsx in a fixtures dir
// and print the actual output to stdout. Used to seed .expected.tsx files,
// then deleted from the working tree.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import jscodeshift from 'jscodeshift'

const [, , transformName, dirArg, mode = 'print'] = process.argv
if (!transformName || !dirArg) {
  console.error('usage: node scripts/dump-fixtures.mjs <transform> <fixtures-dir> [print|write]')
  process.exit(2)
}

const transformPath = resolve(`./src/transforms/${transformName}.ts`)
const { default: transform } = await import(transformPath)
const j = jscodeshift.withParser('tsx')

for (const file of readdirSync(dirArg).sort()) {
  if (!file.endsWith('.input.tsx')) continue
  const inputPath = join(dirArg, file)
  const source = readFileSync(inputPath, 'utf8')
  const api = { jscodeshift: j, j, stats: () => undefined, report: () => undefined }
  const out = transform({ source, path: inputPath }, api, {})
  if (mode === 'write') {
    const expectedPath = inputPath.replace(/\.input\.tsx$/, '.expected.tsx')
    writeFileSync(expectedPath, out, 'utf8')
    console.error(`wrote ${expectedPath}`)
  } else {
    process.stdout.write(`===== ${file} =====\n${out}\n`)
  }
}
