#!/usr/bin/env node
/**
 * BLUF audit detection script — Phase 7/8.
 *
 * Globs MDX files under a content root, extracts the first narrative paragraph
 * of each file's body, applies weak-opening heuristics, and emits a CSV row
 * per file. Designed to be reusable across docs (Phase 7) and blog (Phase 8).
 *
 * Usage:
 *   node apps/docs/scripts/bluf-audit.mjs                                    # docs default
 *   node apps/docs/scripts/bluf-audit.mjs --root apps/docs/content/blog \
 *        --out plan/phase-8-bluf-audit.csv
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..', '..', '..');

function parseArgs(argv) {
  const args = {
    root: 'apps/docs/content/docs',
    out: 'plan/phase-7-bluf-audit.csv',
  };
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    if (key === '--root') args.root = argv[++i];
    else if (key === '--out') args.out = argv[++i];
  }
  return args;
}

function walkMdx(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walkMdx(full, acc);
    else if (entry.endsWith('.mdx')) acc.push(full);
  }
  return acc;
}

function parseFrontmatter(src) {
  const fm = { raw: '', data: {} };
  if (!src.startsWith('---')) return { fm, body: src };
  const end = src.indexOf('\n---', 3);
  if (end === -1) return { fm, body: src };
  fm.raw = src.slice(3, end).trim();
  // minimal key/value parse — handles quoted, unquoted, and block scalar (`>-`)
  const lines = fm.raw.split('\n');
  let currentKey = null;
  let blockMode = null; // '>-' | '|' etc.
  let buffer = [];
  const flush = () => {
    if (currentKey !== null) {
      const value = blockMode ? buffer.join(' ').trim() : buffer.join('\n').trim();
      fm.data[currentKey] = stripQuotes(value);
    }
    currentKey = null;
    blockMode = null;
    buffer = [];
  };
  for (const line of lines) {
    const topLevel = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (topLevel && !line.startsWith('  ')) {
      flush();
      currentKey = topLevel[1];
      const rest = topLevel[2];
      if (rest === '>-' || rest === '>' || rest === '|' || rest === '|-') {
        blockMode = rest;
      } else {
        buffer = rest ? [rest] : [];
      }
    } else {
      buffer.push(line.replace(/^\s+/, ''));
    }
  }
  flush();
  const body = src.slice(end + 4).replace(/^\n+/, '');
  return { fm, body };
}

function stripQuotes(v) {
  if (!v) return v;
  const t = v.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

function extractFirstParagraph(body) {
  // Strip leading imports, headings, jsx-component blocks, callouts, code fences
  const lines = body.split('\n');
  let i = 0;
  let inFence = false;
  let inJsxBlock = 0;
  const skipPrefixes = [
    /^import\s/,
    /^export\s/,
    /^#{1,6}\s/,
    /^\s*$/,
    /^<!--/, // html comment
  ];
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      inFence = !inFence;
      i++;
      continue;
    }
    if (inFence) { i++; continue; }
    // JSX-only line: <Component> or </Component> that opens/closes a block
    const openJsx = /^<([A-Z][A-Za-z0-9]*)(\s|>|\/)/.exec(line);
    const selfClosing = /\/>\s*$/.test(line);
    if (openJsx && !selfClosing && !line.includes('</')) { inJsxBlock++; i++; continue; }
    if (/^<\/[A-Z]/.test(line)) { inJsxBlock = Math.max(0, inJsxBlock - 1); i++; continue; }
    if (inJsxBlock > 0) { i++; continue; }
    if (selfClosing && openJsx) { i++; continue; }
    if (skipPrefixes.some(r => r.test(line))) { i++; continue; }

    // This should be prose. Accumulate until blank line.
    const paragraph = [];
    while (i < lines.length && lines[i].trim() !== '' && !/^#{1,6}\s/.test(lines[i])) {
      paragraph.push(lines[i]);
      i++;
    }
    const text = paragraph.join(' ').trim();
    if (text) return text;
  }
  return '';
}

function firstSentence(paragraph) {
  if (!paragraph) return '';
  // Strip markdown emphasis/backticks for scoring purposes only
  const match = paragraph.match(/^(.+?[.!?])(\s|$)/);
  return (match ? match[1] : paragraph).trim();
}

function detectWeakReasons(paragraph, title, sentence) {
  const reasons = [];
  if (!paragraph) {
    reasons.push('NO_PROSE_BEFORE_HEADING');
    return reasons;
  }
  const firstWords = paragraph.trim().slice(0, 80);

  if (/^in this (guide|page|section|article|tutorial|example)/i.test(firstWords)) reasons.push('STARTS_IN_THIS_X');
  if (/^this (page|guide|section|article|tutorial|example) (describes|covers|explains|shows|walks)/i.test(firstWords)) reasons.push('STARTS_THIS_PAGE_X');
  if (/^welcome to/i.test(firstWords)) reasons.push('STARTS_WELCOME_TO');
  if (/^let's\b/i.test(firstWords)) reasons.push('STARTS_LETS');
  if (/^(we'll|you'll|we will|you will) (explore|learn|cover|see|discover|walk)/i.test(firstWords)) reasons.push('FUTURE_TENSE_FRAMING');
  if (/^the (following|next|above|below)\b/i.test(firstWords)) reasons.push('VAGUE_THE_NOUN');

  // Subject presence — does the first sentence mention the page title?
  if (title) {
    const tNorm = title.replace(/[`_*]/g, '').trim();
    const bare = tNorm.replace(/[^A-Za-z0-9]/g, '');
    const sentNorm = sentence.replace(/[`_*]/g, '');
    const sentBare = sentNorm.replace(/[^A-Za-z0-9]/g, '');
    const present = sentNorm.toLowerCase().includes(tNorm.toLowerCase()) ||
                    (bare.length > 3 && sentBare.toLowerCase().includes(bare.toLowerCase()));
    if (!present) reasons.push('SUBJECT_ABSENT');
  }

  // Purpose verb — is there an "is a / is the / provides / renders / manages / returns / exposes / wraps / ships / handles" verb?
  const hasPurposeVerb = /\b(is (a|an|the)|provides|renders|manages|returns|exposes|wraps|ships|handles|tracks|controls|supplies|describes|defines|schedules|triggers|emits)\b/i.test(sentence);
  if (!hasPurposeVerb) reasons.push('NO_PURPOSE_VERB');

  return reasons;
}

function suggestPattern(relativePath) {
  const p = relativePath.replace(/\\/g, '/');
  if (/\/hooks\//.test(p)) return 'Hook';
  if (/\/components\//.test(p)) return 'Component';
  if (/\/providers\//.test(p)) return 'Provider';
  if (/\/utilities\//.test(p)) return 'Utility';
  if (/\/types\//.test(p)) return 'Type';
  if (/\/headless\//.test(p)) return 'Component';
  if (/\/adapters\//.test(p)) return 'Utility';
  if (/\/styling\//.test(p)) return 'Conceptual';
  if (/\/plugins\//.test(p)) return 'Utility';
  if (/\/dashboard\//.test(p)) return 'Component';
  if (/\/configuration\//.test(p)) return 'Conceptual';
  if (/\/analytics\//.test(p)) return 'Conceptual';
  if (/\/api\//.test(p)) return 'Conceptual';
  if (/\/guides\//.test(p)) return 'Conceptual';
  if (/\/getting-started\//.test(p)) return 'Conceptual';
  if (/\/examples\//.test(p)) return 'Conceptual';
  if (/\/licensing\//.test(p)) return 'Conceptual';
  if (/\/ai-assistants\//.test(p)) return 'Conceptual';
  if (/\/ai\//.test(p)) return 'Conceptual';
  if (/\/use-cases\//.test(p)) return 'Conceptual';
  if (/\/hints\//.test(p)) return 'Conceptual';
  if (/\/scheduling\//.test(p)) return 'Conceptual';
  if (/\/media\//.test(p)) return 'Conceptual';
  if (/\/adoption\//.test(p)) return 'Conceptual';
  if (/\/checklists\//.test(p)) return 'Conceptual';
  if (/\/announcements\//.test(p)) return 'Conceptual';
  return 'Conceptual';
}

function sectionOf(relativePath) {
  const parts = relativePath.replace(/\\/g, '/').split('/');
  // content/docs/<section>/...
  const idx = parts.indexOf('docs');
  if (idx >= 0 && parts.length > idx + 1) return parts[idx + 1].endsWith('.mdx') ? 'root' : parts[idx + 1];
  return 'root';
}

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const PHASE_6_HANDLED = new Set([
  'apps/docs/content/docs/index.mdx',
  'apps/docs/content/docs/getting-started/installation.mdx',
  'apps/docs/content/docs/getting-started/quick-start.mdx',
  'apps/docs/content/docs/core/hooks/use-tour.mdx',
  'apps/docs/content/docs/react/components/tour.mdx',
  'apps/docs/content/docs/hints/components.mdx',
  'apps/docs/content/docs/react/headless/index.mdx',
  'apps/docs/content/docs/guides/accessibility.mdx',
]);

function main() {
  const args = parseArgs(process.argv);
  const rootAbs = join(REPO_ROOT, args.root);
  if (!existsSync(rootAbs)) {
    console.error(`Content root not found: ${rootAbs}`);
    process.exit(1);
  }
  const files = walkMdx(rootAbs).sort();
  const rows = [];
  for (const abs of files) {
    const rel = relative(REPO_ROOT, abs).split(sep).join('/');
    const src = readFileSync(abs, 'utf8');
    const { fm, body } = parseFrontmatter(src);
    const paragraph = extractFirstParagraph(body);
    const sentence = firstSentence(paragraph);
    const title = fm.data.title || '';
    const reasons = detectWeakReasons(paragraph, title, sentence);
    const pattern = suggestPattern(rel);
    const phase6 = PHASE_6_HANDLED.has(rel) ? 'true' : '';
    const status = phase6 ? 'PHASE-6' : (reasons.length === 0 ? 'SKIP-STRONG' : '');
    rows.push({
      path: rel,
      title,
      section: sectionOf(rel),
      current_first_sentence: sentence,
      weak_reasons: reasons.join('|'),
      suggested_pattern: pattern,
      phase_6_handled: phase6,
      status,
    });
  }
  const header = ['path','title','section','current_first_sentence','weak_reasons','suggested_pattern','phase_6_handled','status'];
  const csv = [header.join(','), ...rows.map(r => header.map(h => csvEscape(r[h])).join(','))].join('\n') + '\n';
  const outAbs = join(REPO_ROOT, args.out);
  mkdirSync(dirname(outAbs), { recursive: true });
  writeFileSync(outAbs, csv, 'utf8');

  const weak = rows.filter(r => r.status === '').length;
  const strong = rows.filter(r => r.status === 'SKIP-STRONG').length;
  const phase6Count = rows.filter(r => r.phase_6_handled === 'true').length;
  console.log(`Wrote ${rows.length} rows to ${args.out}`);
  console.log(`  Weak (action needed): ${weak}`);
  console.log(`  Strong (SKIP-STRONG): ${strong}`);
  console.log(`  Phase-6 handled:       ${phase6Count}`);
}

main();
