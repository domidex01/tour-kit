#!/usr/bin/env node
// Summarize a seomator JSON report.
const fs = require('fs');
const path = process.argv[2];
if (!path) { console.error('usage: analyze.js <report.json>'); process.exit(1); }
const r = JSON.parse(fs.readFileSync(path, 'utf8'));

console.log(`\n=== ${path.split('/').pop()} ===`);
console.log(`URL: ${r.url}`);
console.log(`Overall: ${r.overallScore}  Pages crawled: ${r.crawledPages}`);

const cats = Object.values(r.categoryResults || {});
console.log('\nCategory scores (sorted low->high):');
cats
  .map(c => ({ id: c.categoryId, score: c.score, pass: c.passCount, warn: c.warnCount, fail: c.failCount }))
  .sort((a,b) => a.score - b.score)
  .forEach(c => console.log(`  ${c.score.toString().padStart(3)}  ${c.id.padEnd(22)} pass:${c.pass} warn:${c.warn} fail:${c.fail}`));

// Collect failing rules with URL counts
const failByRule = new Map();
const warnByRule = new Map();
for (const c of cats) {
  for (const res of (c.results || [])) {
    const bucket = res.status === 'fail' ? failByRule : res.status === 'warn' ? warnByRule : null;
    if (!bucket) continue;
    const key = `${c.categoryId}/${res.ruleId}`;
    const entry = bucket.get(key) || { count: 0, sampleMsg: res.message, sampleUrls: new Set() };
    entry.count++;
    const url = res.details?.pageUrl || res.details?.url;
    if (url) entry.sampleUrls.add(url);
    bucket.set(key, entry);
  }
}

const printTop = (map, label, limit = 15) => {
  console.log(`\nTop ${label}:`);
  [...map.entries()]
    .sort((a,b) => b[1].count - a[1].count)
    .slice(0, limit)
    .forEach(([rule, e]) => {
      console.log(`  [${e.count.toString().padStart(3)}]  ${rule}`);
      console.log(`         ${e.sampleMsg}`);
      const urls = [...e.sampleUrls].slice(0, 2).map(u => u.replace('https://usertourkit.com','')).join(', ');
      if (urls) console.log(`         e.g. ${urls}`);
    });
};

printTop(failByRule, 'FAILURES', 20);
printTop(warnByRule, 'WARNINGS', 15);
