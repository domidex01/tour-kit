#!/usr/bin/env node
import { runMigrate } from '../cli'

runMigrate(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (e) => {
    console.error(e)
    process.exit(1)
  }
)
