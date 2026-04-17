Shipping license key validation for an open-source library taught me more about payment processing than I expected.

Polar.sh advertises 4% + $0.40 per transaction. After international card surcharges (+1.5%), subscription surcharges (+0.5%), and payout fees, the effective rate for international customers is ~7.3%.

We went with Polar anyway. The client-side validation endpoint requires no authentication, which means our library users don't need to set up a backend just to validate a license key. That mattered more than saving 2-3% on fees.

The other non-obvious lesson: activation limits are lifetime, not concurrent. Deactivating a device doesn't free up a slot. We almost shipped a UI that would have confused every customer.

Full technical guide with the React integration code: https://usertourkit.com/blog/tour-kit-polar-sh-managing-pro-subscriptions

#react #typescript #opensource #devtools #polarsh
