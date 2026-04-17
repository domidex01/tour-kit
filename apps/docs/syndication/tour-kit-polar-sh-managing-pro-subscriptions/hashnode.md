---
title: "Tour Kit + Polar.sh: managing Pro subscriptions with license keys"
slug: "tour-kit-polar-sh-managing-pro-subscriptions"
canonical: https://usertourkit.com/blog/tour-kit-polar-sh-managing-pro-subscriptions
tags: react, typescript, open-source, web-development
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-polar-sh-managing-pro-subscriptions)*

# Tour Kit + Polar.sh: managing Pro subscriptions with license keys

Polar.sh handles the part of selling open-source software that nobody wants to build: payment processing, tax compliance across 100+ countries, and license key delivery. We picked it for Tour Kit's Pro tier because it auto-generates license keys on purchase and exposes a validation endpoint you can call directly from a React component. No backend required on your side.

This article walks through the working integration. We'll set up Polar, validate keys client-side with the `@polar-sh/sdk`, cache results in localStorage, and gate Tour Kit's 8 Pro packages behind the response. We hit gotchas around activation limits, international fees, and the snake_case API that the SDK docs don't warn you about.

Full article with all code examples: [usertourkit.com/blog/tour-kit-polar-sh-managing-pro-subscriptions](https://usertourkit.com/blog/tour-kit-polar-sh-managing-pro-subscriptions)
