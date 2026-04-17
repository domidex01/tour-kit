## Thread (6 tweets)

**1/** SaaS onboarding tools at 10K MAU cost $115K-$160K+ over three years.

An MIT-licensed React library costs one sprint and $0/month.

Here's the pitch framework that gets CTOs to approve the switch:

**2/** The biggest mistake: framing it as "build vs buy."

Building from scratch costs $60K-$3M. Nobody's suggesting that.

Adopting a library is a third path. You get the positioning engine, state machine, and a11y layer pre-built. Ship it like React Router.

**3/** The argument that lands hardest isn't cost. It's security.

SaaS tools inject third-party JS from an external CDN. You can't audit it, pin it, or control updates.

A bundled library goes through your lockfile, CI pipeline, and code review. No external network requests.

**4/** Seven CTO objections and the short answers:

"Not free" → Library, not custom build
"Maintenance risk" → MIT = forkable
"Need SLAs" → SLAs cover uptime, not your logic
"Security" → Favors OSS
"No-code editor" → Acknowledge honestly
"License risk" → MIT is permissive
"Painful switch" → Lock-in grows monthly

**5/** The one tactical move that makes the pitch work:

Don't ask for migration.

Ask for a one-sprint spike to rebuild 3 existing flows. Low risk, measurable result.

If it fails, you renew. If it succeeds, your CTO has evidence, not just your opinion.

**6/** Full framework with the TCO table, objection responses, common mistakes, and a one-page pitch template:

https://usertourkit.com/blog/pitch-cto-open-source-onboarding

(Disclosure: I built Tour Kit, but the framework is library-agnostic)
