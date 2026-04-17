## Subject: How SaaS onboarding tools inject their code — performance and security analysis

## Recipients:
- Cooperpress (React Status, JavaScript Weekly, Frontend Focus): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I profiled five SaaS onboarding platforms running on a Next.js app and documented exactly how they inject code — the five-step runtime sequence, the performance cost (180-340ms main thread blocking even with zero active flows), and the security implications (supply chain risk, CSP incompatibility, document-level DOM access). The Chrome Aurora team's finding that GTM with 18 tags increases TBT ~20x provides context for how third-party scripts compound.

The article includes a comparison table (CDN-injected vs npm-installed), code examples, and Chrome DevTools audit instructions for measuring third-party script cost.

Link: https://usertourkit.com/blog/how-onboarding-tools-inject-code

Thanks,
Domi
