## Subreddit: r/reactjs (primary), r/web3 (secondary)

**Title:** I wrote up patterns for building wallet-aware product tours in React — handling async transactions, wallet-type branching, and jargon hints

**Body:**

I've been working on product tour patterns for web3/crypto apps and ran into a bunch of problems that standard tour libraries don't handle well. Figured I'd share what I found.

The core issue: blockchain transactions are async (15 seconds to minutes for confirmation), wallets open external popups outside your DOM, and different wallet types (MetaMask vs WalletConnect vs embedded) need completely different tour instructions. Standard tour libraries assume synchronous, predictable UI.

Five patterns that helped:

1. **Delayed wallet connection** — Don't gate the tour on wallet connection. Let users explore first. Formo.so's funnel data shows 30% drop-off at wallet connection alone.

2. **Async-safe steps** — Use wagmi's `useWaitForTransactionReceipt` to subscribe to chain events instead of polling. Tour pauses on pending tx, advances on confirmation.

3. **Wallet-type branching** — Detect connector type (injected/walletConnect/embedded) and show different instructions per wallet.

4. **Jargon hints at point of need** — Instead of a glossary tour, place contextual hint beacons next to terms like "gas fee" and "slippage" that users can tap when confused.

5. **Network context awareness** — Detect wrong-chain state and show a switch prompt before the user hits a cryptic error.

Some stats that motivated this: ConsenSys reports 55% wallet setup abandonment, 65% dApp abandonment during first transaction, and sub-1% 30-day retention is common across web3 projects.

I wrote the full guide with code examples using Tour Kit + wagmi: https://usertourkit.com/blog/web3-app-onboarding

Curious if anyone else has tackled async tour steps in a crypto context — the transaction confirmation timing makes it really different from standard web app tours.
