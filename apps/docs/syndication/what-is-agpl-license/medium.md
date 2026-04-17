# What is AGPL? Why License Choice Matters When Picking Open-Source Libraries

### That npm package you just installed might require you to open-source your entire application

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-agpl-license)*

You found a JavaScript library that does exactly what you need. Good star count, active maintenance, clean API. You run `npm install` and move on.

Three months later, your legal team flags it. The license is AGPL-3.0, and your SaaS product just became subject to source code disclosure requirements you didn't plan for.

Of the roughly 2.7 million packages on npm, only around 4,200 use AGPL. But a single one in your dependency tree is enough to trigger obligations.

## What AGPL actually requires

The GNU Affero General Public License (AGPL-3.0) is a strong copyleft license published by the Free Software Foundation in 2007. It requires anyone who runs modified AGPL software over a network to make the complete source code available to users of that service. As of 2025, roughly 3% of open-source projects use AGPL, compared to 92% using permissive licenses like MIT.

AGPL was created to close a loophole in the GPL. SaaS companies could modify GPL code, run it on their servers, and never release changes because they weren't distributing anything. AGPL's Section 13 treats network interaction as distribution.

## The JavaScript problem

When you install an AGPL package into a React app, your bundler combines that code with yours into a single output. Whether that creates a "derivative work" under AGPL is a legal question nobody has definitively answered. Lawyers disagree on it. That uncertainty is the real problem.

JavaScript delivered to a browser is also effectively distributed code. The SaaS loophole that AGPL closes doesn't even apply to frontend code — your bundled JS ships to browsers, so you're distributing it in the traditional GPL sense too.

According to a 2025 Black Duck audit report, 30% of license compliance conflicts originate from hidden transitive dependencies.

## Real-world examples

Shepherd.js, a product tour library, uses AGPL-3.0 with dual licensing. It has around 13,000 GitHub stars and 120,000 weekly npm downloads. Compare that to React Joyride's 520,000+ weekly downloads under MIT. The license gap correlates with an adoption gap.

Google bans AGPL software company-wide — all 180,000+ employees. MongoDB used AGPL before switching to the even more restrictive SSPL in 2018. Other AGPL projects include Nextcloud, Mastodon, and Mattermost — all standalone services, not libraries bundled into other applications.

A 2024 Tidelift survey found that 62% of organizations have formal open-source license policies. AGPL consistently appears on the "do not use" list.

## Why most React libraries choose MIT

When we built Tour Kit (a headless product tour library for React), we chose MIT licensing deliberately. A product tour library gets bundled directly into your application's frontend. AGPL would mean every SaaS company using it might need to disclose their application source code. That's a non-starter.

MIT imposes zero restrictions. The entire license text is 21 lines. React, Next.js, Tailwind CSS, Radix UI, and shadcn/ui all use MIT. The libraries that form the modern React stack chose permissive licensing because they're designed to be embedded in commercial products.

The tradeoff: MIT doesn't prevent large companies from forking your code. AGPL would. But wider adoption mattered more to us than protection from theoretical competition.

## The bottom line

Before installing any npm package, check the license field in package.json. If you see AGPL-3.0 and you're building a commercial SaaS product, have a conversation with your legal team before proceeding. Or pick one of the many MIT-licensed alternatives that won't require that conversation at all.

---

*Suggest submitting to: JavaScript in Plain English, Better Programming, or Bits and Pieces on Medium*
