#!/usr/bin/env node
// Check H1 and duplicate-H1 patterns across all reports.
const fs = require('fs');
const files = [
  'seo-landing-20260419-172701.json',
  'seo-compare-20260419-172708.json',
  'seo-docs-20260419-172706.json',
  'seo-blog-20260419-172707.json',
];
const base = '/home/domidex/projects/tour-kit/reports/';

for (const f of files) {
  const r = JSON.parse(fs.readFileSync(base + f, 'utf8'));
  const cats = Object.values(r.categoryResults || {});
  const core = cats.find(c => c.categoryId === 'core');
  const h1Rules = (core?.results || []).filter(res => res.ruleId.includes('h1'));
  const byRule = {};
  for (const res of h1Rules) {
    if (!byRule[res.ruleId]) byRule[res.ruleId] = { pass: 0, warn: 0, fail: 0, failUrls: [] };
    byRule[res.ruleId][res.status]++;
    if (res.status !== 'pass') {
      byRule[res.ruleId].failUrls.push({
        url: (res.details?.pageUrl || '').replace('https://usertourkit.com',''),
        msg: res.message,
        detail: res.details,
      });
    }
  }
  console.log(`\n=== ${f} ===`);
  for (const [rule, stats] of Object.entries(byRule)) {
    console.log(`  ${rule}: pass=${stats.pass} warn=${stats.warn} fail=${stats.fail}`);
    stats.failUrls.slice(0, 5).forEach(u => console.log(`    - ${u.url}  |  ${u.msg}`));
  }
}
