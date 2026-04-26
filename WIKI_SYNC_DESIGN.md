# Claude Code Hook System for Wiki-Tech Sync

## TL;DR

1. **PostToolUse hook** (lightweight, auto) detects edits to `packages/*/src/**`, `packages/*/CLAUDE.md`, `packages/*/package.json`; compares wiki frontmatter `updated:` date vs source file mtime; enqueues packages needing review to `.claude/wiki-tech.queue`.

2. **SessionEnd hook** (reminder-only) checks if queue is non-empty and surfaces a one-line message suggesting `/wiki-review`.

3. **Off-load heavy work** to on-demand skill (`/wiki-review`) that processes queue, ingests changed sources, updates wiki pages — no auto-edits on file change, just queueing.

---

## Hook Events Used

| Event | Justification |
|-------|---------------|
| **PostToolUse** | Fires after `Write`/`Edit` tools complete. Lightweight matcher filters to package source files (not wiki). Queues affected packages, non-blocking. |
| **SessionEnd** | Fires when session closes. Checks if queue non-empty, reminds user. Non-blocking. |

---

## settings.json Snippet

Merge into `.claude/settings.json` (project-level):

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/wiki-drift-detect.sh\"",
            "timeout": 5,
            "statusMessage": "Checking wiki drift..."
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/wiki-queue-reminder.sh\"",
            "timeout": 3
          }
        ]
      }
    ]
  }
}
```

**Note:** Hook runs after `safe-ship-gate`. No conflict.

---

## Hook Scripts

### 1. Wiki Drift Detection (PostToolUse)

**File:** `.claude/hooks/wiki-drift-detect.sh`

```bash
#!/bin/bash
# wiki-drift-detect.sh — PostToolUse hook
# Detects which packages had source changes, compares to wiki frontmatter.
# Enqueues packages to .claude/wiki-tech.queue if drift detected.
# Non-blocking; does not edit wiki, only queues.

set -e

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Exit silently if not a file
if [ -z "$FILE" ]; then
  exit 0
fi

# Exclude wiki-tech itself (prevent loop)
if [[ "$FILE" =~ wiki-tech/ ]]; then
  exit 0
fi

# Exclude build artifacts
if [[ "$FILE" =~ (node_modules|dist|__tests__|\.turbo) ]]; then
  exit 0
fi

# Match patterns: packages/*/src/**, packages/*/CLAUDE.md, packages/*/package.json
if ! [[ "$FILE" =~ ^packages/[^/]+/(src/.*\.ts|CLAUDE\.md|package\.json)$ ]]; then
  exit 0
fi

# Extract package name
PACKAGE=$(echo "$FILE" | grep -oP 'packages/\K[^/]+')
if [ -z "$PACKAGE" ]; then
  exit 0
fi

QUEUE_FILE="$CLAUDE_PROJECT_DIR/.claude/wiki-tech.queue"

# Check if wiki page exists
WIKI_PAGE="$CLAUDE_PROJECT_DIR/wiki-tech/packages/${PACKAGE}.md"
if [ ! -f "$WIKI_PAGE" ]; then
  echo "${PACKAGE} (no wiki page)" >> "$QUEUE_FILE"
  exit 0
fi

# Extract updated date from wiki frontmatter
WIKI_UPDATED=$(grep -A 20 "^---" "$WIKI_PAGE" | grep "^updated:" | head -1 | awk '{print $2}')
if [ -z "$WIKI_UPDATED" ]; then
  echo "${PACKAGE} (no updated date in frontmatter)" >> "$QUEUE_FILE"
  exit 0
fi

# Convert wiki date to epoch seconds
WIKI_EPOCH=$(date -d "$WIKI_UPDATED" +%s 2>/dev/null || echo 0)

# Get mtime of the edited source file (epoch seconds)
SOURCE_EPOCH=$(stat -c %Y "$CLAUDE_PROJECT_DIR/$FILE" 2>/dev/null || echo 0)

# If source is newer than wiki, queue the package
if [ "$SOURCE_EPOCH" -gt "$WIKI_EPOCH" ]; then
  echo "${PACKAGE} (source changed)" >> "$QUEUE_FILE"
fi

exit 0
```

**Run:** `chmod +x .claude/hooks/wiki-drift-detect.sh`

---

### 2. Queue Reminder (SessionEnd)

**File:** `.claude/hooks/wiki-queue-reminder.sh`

```bash
#!/bin/bash
# wiki-queue-reminder.sh — SessionEnd hook
# Checks if wiki-tech.queue is non-empty.
# Surfaces a reminder if maintenance is pending.

QUEUE_FILE="$CLAUDE_PROJECT_DIR/.claude/wiki-tech.queue"

if [ ! -f "$QUEUE_FILE" ]; then
  exit 0
fi

LINE_COUNT=$(wc -l < "$QUEUE_FILE")
if [ "$LINE_COUNT" -eq 0 ]; then
  exit 0
fi

# Non-blocking reminder
echo ""
echo "─────────────────────────────────────────"
echo "  Wiki Maintenance Pending"
echo "─────────────────────────────────────────"
echo ""
echo "Packages needing wiki updates:"
echo ""

head -10 "$QUEUE_FILE" | sed 's/^/  • /'

if [ "$LINE_COUNT" -gt 10 ]; then
  REMAINING=$((LINE_COUNT - 10))
  echo "  ... and $REMAINING more"
fi

echo ""
echo "Run /wiki-review to process queue and update wiki pages."
echo ""
echo "─────────────────────────────────────────"

exit 0
```

**Run:** `chmod +x .claude/hooks/wiki-queue-reminder.sh`

---

## Trigger Contract

The PostToolUse hook does **not** inject `additionalContext` because it is lightweight and non-blocking. It only queues. The reminder hook outputs plain text to stdout (exit code 0), which Claude shows in transcript.

**Why no `additionalContext`?**
- Lightweight hook meant to be silent (user may edit 10 files; 10 context injections = noise).
- Context injection reserved for on-demand `/wiki-review` skill that processes queue and asks Claude to actually edit wiki.

---

## Edge Cases

| Scenario | Hook Behavior | Claude Action |
|----------|---------------|---------------|
| **User edits wiki-tech file** | Matcher excludes `wiki-tech/` path. Hook exits silently. No queue entry. | None. Prevents loop. |
| **User edits `packages/core/src/index.ts`** | Drift detect compares `wiki-tech/packages/core.md` frontmatter `updated:` vs file mtime. Enqueues if source newer. | Session end: reminder lists "core (source changed)". User runs `/wiki-review core` to ingest. |
| **Multiple files in one Edit call** | Hook runs once per tool call, reads single `file_path`. For true multi-file edits, hook may only see one path. | Queue may miss packages. Recommend manual queue addition or git-diff approach (see Caveats). |
| **New package added** | Drift detect checks for `wiki-tech/packages/<name>.md`, finds none, enqueues as "(no wiki page)". | Reminder shows entry. User runs `/wiki-review <name>`, skill scaffolds page. |
| **Package deleted** | No drift detect (no source files to edit). Orphan detection deferred to on-demand `/wiki-lint`. | User manually removes page or runs lint skill. |
| **Pending changes across multiple files** | Each Edit/Write triggers hook. Queue grows. | Session end: all pending packages listed. Single `/wiki-review` call processes all. |
| **Queue file stale (days old)** | Hook appends; doesn't deduplicate. | User should clear queue before running `/wiki-review`, or skill deduplicates. |

---

## Recommended On-Demand: `/wiki-review` Skill

**Trigger:** "run wiki review", "update wiki", "sync wiki", "/wiki-review", or "/wiki-review core"

**Spec (Python or bash implementation):**

```yaml
name: wiki-review
description: |
  Process wiki-tech queue and update wiki pages from source changes.
  Ingests changed packages, detects drifts (version, signatures, refs),
  updates frontmatter and content, appends log entry.
  Reads from .claude/wiki-tech.queue; deduplicates before processing.
trigger:
  - "wiki review"
  - "update wiki"
  - "sync wiki"
  - "/wiki-review"
options:
  package: Optional package name filter (e.g., "core" for @tour-kit/core only)
  dry_run: Report drift without making edits
behavior:
  - Read .claude/wiki-tech.queue (or --package argument)
  - For each enqueued package:
    - Read packages/<name>/package.json (version), src/index.ts (exports), CLAUDE.md
    - Load wiki-tech/packages/<name>.md frontmatter and content
    - Detect drifts: version mismatch, signature changes, broken refs
    - Update frontmatter: bump version if changed, update sources list, set updated: today
    - Update content: patch code fences for exports, refresh links, update metadata
    - If --dry-run, report findings; otherwise write to .md files
  - Clear .claude/wiki-tech.queue
  - Append entry to wiki-tech/log.md with timestamp, packages updated, drifts fixed
  - Emit summary: "Updated 3 packages, 2 drifts fixed, 1 gap found"
  - Exit cleanly or prompt for commit if git is configured
```

The skill would be implemented as a separate script (Python or bash) in `.claude/skills/wiki-review/` and registered in `settings.json` as a slash command or custom skill.

---

## Caveats & Limitations

1. **PostToolUse sees only `tool_input.file_path`** — if a single tool call edits multiple files (rare), hook only sees one. Workaround: use `git diff`. Acceptable limitation.

2. **Date format assumption** — script assumes wiki frontmatter `updated: YYYY-MM-DD`. If format differs, `date -d` fails; defaults to queuing (safer). Test with: `date -d "2026-04-26" +%s`

3. **No queue deduplication** — same package edited twice = two queue entries. Acceptable; skill should deduplicate before processing.

4. **Exit code 0 always** — hook never blocks (`exit 2`), only queues. This is intentional (wiki updates informational, not critical). To enforce wiki edits on every change, use `exit 2` + inject `additionalContext` asking Claude to run `/wiki-review` (noisier).

5. **SessionEnd timing** — fires at end of session. If user quits after edit, they see reminder in transcript but not terminal. Queue persists; next session also reminds.

6. **No automatic wiki edits** — hook only queues. Auto-edits would require either:
   - Hook running Python/bash to edit YAML directly (fragile, corruption risk).
   - Hook injecting `additionalContext` asking Claude to run `/wiki-review` (noisy if many files).
   Queueing + on-demand skill is safest.

7. **Matcher specificity** — regex `packages/[^/]+/(src/.*\.ts|CLAUDE\.md|package\.json)` is strict. Will NOT match:
   - `packages/core/README.md` (not a source file)
   - `packages/core/tsup.config.ts` (not in src/)
   - `packages/core/__tests__/hooks.test.ts` (excluded earlier)
   This is correct — only API/docs/version changes trigger updates.

8. **Concurrency** — if Claude runs two Edit tools in parallel (subagent mode), queue file has race condition. Mitigate: append with `>>` (atomic on POSIX), accept duplicates (skill deduplicates).

---

## Summary: What to Copy

1. Merge into `.claude/settings.json` the `hooks` block (PostToolUse + SessionEnd).
2. Create `.claude/hooks/wiki-drift-detect.sh` (60 lines) and `chmod +x`.
3. Create `.claude/hooks/wiki-queue-reminder.sh` (35 lines) and `chmod +x`.
4. Build `/wiki-review` skill separately (heavy tier) using spec above.
5. **Test:** Edit `packages/core/src/index.ts`, end session, check that reminder appears and `.claude/wiki-tech.queue` is populated.

---

## Files to Create/Modify

| Path | Action | Approx. Lines |
|------|--------|---------------|
| `.claude/settings.json` | Merge `hooks` block | 15 lines |
| `.claude/hooks/wiki-drift-detect.sh` | Create (new) | 60 lines |
| `.claude/hooks/wiki-queue-reminder.sh` | Create (new) | 35 lines |
| `.claude/skills/wiki-review/` | Create (separate task) | TBD |

---

