#!/usr/bin/env bash
# tasks/sprint-1-stop-the-bleeding/verify-phase-5.sh
# Run before opening the Phase 5 PR.
set -u
fails=0
gate() { if eval "$1"; then echo "✓ $2"; else echo "✗ $2 — $(eval "$3")"; fails=$((fails+1)); fi; }

DOCS_ROOT="apps/docs/content/docs"

# US-2: 4 new pages exist
for f in index from-shepherd from-driver from-joyride; do
  gate "[ -f $DOCS_ROOT/codemods/$f.mdx ]" "US-2: $f.mdx exists" "echo missing"
done

# US-2 (each has frontmatter)
for f in index from-shepherd from-driver from-joyride; do
  gate "head -5 $DOCS_ROOT/codemods/$f.mdx | grep -q '^title:'" "US-2: $f.mdx has frontmatter title" "head -5 $DOCS_ROOT/codemods/$f.mdx"
done

# US-2 (transform pages have a run codeblock)
for lib in shepherd driver joyride; do
  gate "grep -q 'tour-kit-migrate --from $lib' $DOCS_ROOT/codemods/from-$lib.mdx" \
       "US-2: from-$lib.mdx includes run command" "echo missing"
done

# US-2 (meta.json present)
gate "[ -f $DOCS_ROOT/codemods/meta.json ]" 'US-2: codemods/meta.json exists' "echo missing"
gate 'node -e "const m=require(\"./apps/docs/content/docs/codemods/meta.json\"); process.exit(m.pages?.includes(\"index\") && m.pages?.includes(\"from-shepherd\") ? 0 : 1)"' \
     'US-2: meta.json lists index + transform pages' "cat $DOCS_ROOT/codemods/meta.json"

# US-1: root meta.json includes "codemods" under Resources
gate 'node -e "const m=require(\"./apps/docs/content/docs/meta.json\"); const idx=m.pages.indexOf(\"---Resources---\"); const end=m.pages.findIndex((p,i)=>i>idx && p.startsWith(\"---\")); const slice=m.pages.slice(idx, end>=0?end:undefined); process.exit(slice.includes(\"codemods\") ? 0 : 1)"' \
     'US-1: root meta.json lists codemods under Resources' "cat $DOCS_ROOT/meta.json | grep -A 10 Resources"

# US-3: tour-kit-migrate bin works
if [ ! -f packages/codemods/dist/bin/tour-kit-migrate.cjs ]; then
  echo "Building codemods first…"
  pnpm --filter @tour-kit/codemods build >/dev/null 2>&1
fi
gate '[ -f packages/codemods/dist/bin/tour-kit-migrate.cjs ]' \
     'US-3: tour-kit-migrate bin built' "echo missing — run pnpm --filter @tour-kit/codemods build"
gate 'node packages/codemods/dist/bin/tour-kit-migrate.cjs --help >/dev/null 2>&1' \
     'US-3: tour-kit-migrate --help exits 0' "node packages/codemods/dist/bin/tour-kit-migrate.cjs --help 2>&1 | tail -5"

# US-4: existing migration pages link to the codemod pages
for lib in shepherd driver joyride; do
  gate "grep -q '/docs/codemods/from-$lib' $DOCS_ROOT/migration/$lib.mdx" \
       "US-4: migration/$lib.mdx links to codemod" "echo missing callout"
done

# US-6: no package code touched
n=$(git diff --name-only -- packages/ | wc -l | tr -d ' ')
gate "[ $n -eq 0 ]" "US-6: zero files under packages/ changed" "git diff --name-only -- packages/"

# US-7: internal link integrity (cheap pass — only check /docs/... refs)
# Extracts every (/docs/...) link target from the new pages.
missing_links=0
while read -r link; do
  # Strip anchor + leading slash
  target=$(echo "$link" | sed 's|#.*||' | sed 's|^/||')
  # Map /docs/foo → apps/docs/content/docs/foo (with .mdx or /index.mdx).
  # $target already starts with "docs/", so the content root prefix is
  # apps/docs/content/ (not apps/ — that dropped the content/docs segment).
  if [ -f "apps/docs/content/$target.mdx" ] || [ -f "apps/docs/content/$target/index.mdx" ]; then
    : # OK
  else
    echo "  ✗ broken link: $link"
    missing_links=$((missing_links+1))
  fi
done < <(grep -hoE '\(/docs/[a-z0-9-]+(/[a-z0-9-]+)*\)' $DOCS_ROOT/codemods/*.mdx | tr -d '()' | sort -u)

gate "[ $missing_links -eq 0 ]" "US-7: all internal /docs/ links resolve" "echo $missing_links broken"

# US-5: docs build
gate 'pnpm --filter @tour-kit/docs build >/tmp/phase-5-build.log 2>&1' \
     'US-5: apps/docs builds' "tail -n10 /tmp/phase-5-build.log"

[ "$fails" -eq 0 ] || { echo "Phase 5 FAILED gates: $fails"; exit 1; }
echo "Phase 5 all gates green."
