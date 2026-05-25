---
"@tour-kit/codemods": patch
---

Fix `tour-kit-migrate --help`/`-h` to exit 0 and print usage once to stdout.

Previously an explicit help request threw an internal `UsageError`, so the CLI
exited with code 2 (bad args) and printed the usage text twice — once to stdout
and again to stderr prefixed with `usage error: help requested`. Help is a
success: it now exits 0 and prints usage a single time to stdout, matching the
convention of `git`, `npm`, and `node`. Bad-args and exit codes 1/2/3 are
unchanged.
