## Title: Product tours for web3 apps — handling async blockchain steps, wallet branching, and compliance

## URL: https://usertourkit.com/blog/web3-app-onboarding

## Comment to post immediately after:

ConsenSys reports 55% of users abandon during wallet setup and sub-1% 30-day retention is common across web3 projects. The wallet infrastructure side (embedded wallets, account abstraction) has improved a lot in the past two years, but there's almost zero structured in-app guidance after wallet connection.

I wrote up five patterns for building wallet-aware product tours: delayed wallet connection (don't gate on wallet first), async-safe tour steps that pause during pending transactions, wallet-type branching (MetaMask popup vs WalletConnect QR vs embedded), contextual jargon hints, and network-switching guards.

The interesting technical challenge is that blockchain transactions are async (15 seconds to minutes) and wallet interactions happen in external UI (MetaMask popup, WalletConnect QR). Standard tour libraries assume your target elements are in the DOM and actions complete synchronously. The code examples use wagmi's useWaitForTransactionReceipt for event-driven step advancement instead of polling.

Also covered: compliance constraints on web3 tour copy (financial risk disclaimers, securities law for DeFi, GDPR implications of logging wallet addresses alongside behavioral data). This part is underappreciated — your onboarding copy carries legal weight in crypto that it doesn't in standard SaaS.
