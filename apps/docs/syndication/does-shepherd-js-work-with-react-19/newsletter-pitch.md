## Subject: Shepherd.js React 19 compatibility timeline (13-month gap)

## Recipients:
- Cooperpress (React Status, JavaScript Weekly): peter@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote up the full compatibility timeline for Shepherd.js and React 19. The library was broken for 13 months (Jan 2025 - Mar 2026) due to a dependency on `ReactCurrentDispatcher`, a React internal that React 19 renamed. The fix shipped in March 2026 via a peerDependency relaxation.

The article includes the GitHub issue timeline, a comparison table of React-native alternatives with download stats, and a decision framework for teams choosing a tour library today. Your readers evaluating tour libraries or planning React 19 upgrades would find the AGPL licensing angle particularly relevant.

Link: https://usertourkit.com/blog/does-shepherd-js-work-with-react-19

Thanks,
Domi
