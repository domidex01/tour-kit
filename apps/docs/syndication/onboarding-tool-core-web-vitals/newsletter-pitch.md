## Subject: How SaaS onboarding tools affect Core Web Vitals (field data analysis)

## Recipients:
- Cooperpress (React Status, JavaScript Weekly, Frontend Focus): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I tested how Appcues, Pendo, and UserGuiding affect Core Web Vitals field data (CrUX, not Lighthouse) on a Next.js app. The key finding: INP is the metric that gets hit hardest — third-party scripts contribute to 54% of INP problems, and these tools' event listeners and DOM observers add enough latency to cross the 200ms "Good" threshold on mid-range devices.

The article covers the compound effect (failing one CWV metric fails the entire page), includes a reproducible measurement methodology using Google's web-vitals library, and provides mitigation strategies for teams that need to keep their SaaS tool.

Link: https://usertourkit.com/blog/onboarding-tool-core-web-vitals

Thanks,
Domi
