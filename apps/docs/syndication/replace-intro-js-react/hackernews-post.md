## Title: Replacing Intro.js in a React project: a migration guide

## URL: https://usertourkit.com/blog/replace-intro-js-react

## Comment to post immediately after:

Intro.js has been around for years and earned its 23K GitHub stars. But its React wrapper hasn't been updated in over three years, and the core library manipulates the DOM directly — which creates real problems in React 19 codebases with concurrent rendering.

I wrote this because I kept running into the same issues: positioning breaks when elements use CSS transforms (GitHub issue #833, open since 2020), callback race conditions on cleanup (issue #1162), and the AGPL license that many teams don't realize requires source disclosure for commercial apps.

The guide covers converting step definitions, replacing the imperative API with React components, and migrating callbacks. Disclosure: the replacement library (Tour Kit) is mine. I tried to be fair — Intro.js is better for non-React projects and teams that want pre-built UI.

I'd be interested in hearing from anyone who's dealt with the AGPL compliance angle. That seems to be the most common surprise.
