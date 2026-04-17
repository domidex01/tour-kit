## Thread (6 tweets)

**1/** Web3 apps lose 55% of users during wallet setup. But the real problem isn't wallet connection — it's what happens after. Most dApps drop users into complex dashboards with zero guidance. Here's how to fix it with wallet-aware product tours:

**2/** The core challenge: blockchain transactions are async (15s to minutes), wallet interactions happen in external popups outside your DOM, and different wallets need completely different instructions. Standard tour libraries assume none of this.

**3/** Pattern that works: delayed wallet connection. Don't gate your tour on "connect wallet" first. Let users explore in read-only mode. Formo.so's funnel data shows 30% drop-off at wallet connection alone. Push it to when users actually need it.

**4/** The async trick: use wagmi's useWaitForTransactionReceipt to subscribe to chain events. Tour pauses on pending tx, advances on confirmation. No polling, no setTimeout. Event-driven step advancement.

**5/** Don't forget compliance: web3 tour copy carries legal weight. Financial risk disclaimers, securities law for DeFi, GDPR on wallet address logging. Your onboarding copy isn't just UX — it's potentially a financial disclosure.

**6/** Full guide with code examples for all 5 patterns (delayed connection, async steps, wallet branching, jargon hints, network guards): https://usertourkit.com/blog/web3-app-onboarding
