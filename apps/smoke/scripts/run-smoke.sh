#!/usr/bin/env bash
# Boot `next dev`, probe the smoke page, tear down. Used in CI post-publish.
# `next build` is avoided for now because of a Next.js 16.2.4 prerender regression
# on the auto-generated /_global-error page (unrelated to tour-kit).
set -euo pipefail

cd "$(dirname "$0")/.."

log() { echo "[smoke] $*"; }

cleanup() {
  if [[ -n "${DEV_PID:-}" ]] && kill -0 "$DEV_PID" 2>/dev/null; then
    log "stopping dev server (pid $DEV_PID)"
    kill "$DEV_PID" 2>/dev/null || true
    wait "$DEV_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

log "booting next dev on :3100"
pnpm dev > /tmp/tour-kit-smoke-dev.log 2>&1 &
DEV_PID=$!

log "waiting for 'Ready' signal (up to 60s)"
for _ in $(seq 1 60); do
  if grep -q 'Ready' /tmp/tour-kit-smoke-dev.log 2>/dev/null; then
    log "dev server ready"
    break
  fi
  if ! kill -0 "$DEV_PID" 2>/dev/null; then
    log "FAIL — dev server exited before becoming ready"
    tail -n 80 /tmp/tour-kit-smoke-dev.log || true
    exit 1
  fi
  sleep 1
done

log "probing http://localhost:3100/"
if pnpm probe; then
  log "OK — smoke page rendered with data-smoke-ok marker"
  exit 0
else
  log "FAIL — smoke probe could not find data-smoke-ok marker"
  log "---- last 80 lines of dev log ----"
  tail -n 80 /tmp/tour-kit-smoke-dev.log || true
  exit 1
fi
