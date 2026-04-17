## Title: Persona-based onboarding in React with TypeScript discriminated unions

## URL: https://usertourkit.com/blog/persona-based-onboarding

## Comment to post immediately after:

I wrote this after struggling with onboarding flows for a B2B dashboard where admins, developers, and analysts each need completely different product tours. The generic approach was causing 90% of users to abandon the tour before step 5.

The core idea: model user personas as a TypeScript discriminated union, resolve them from auth data + an onboarding survey at signup, then render persona-specific tour steps conditionally. The discriminated union gives you exhaustive checking so adding a new persona type at compile time forces you to handle it everywhere.

Two things I found that weren't covered elsewhere: (1) the accessibility implications of persona-conditional tours, where screen reader progress announcements need to count only active steps, not total possible steps; and (2) the bundle size story, where dynamic imports per persona reduced onboarding JS from 14KB to 4-6KB per user.

The data case is strong: personalized onboarding increases retention by 52% and feature adoption by 42% vs generic flows (UserGuiding 2026 stats). ProdPad cut activation from 6 weeks to 10 days with persona segmentation.

Fair disclosure: I built Tour Kit, the library used in the examples. But the pattern works with any tour library that supports conditional step rendering.
