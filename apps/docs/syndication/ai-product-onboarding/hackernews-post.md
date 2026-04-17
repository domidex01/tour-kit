## Title: Onboarding for AI Products: Teaching Users to Prompt

## URL: https://usertourkit.com/blog/ai-product-onboarding

## Comment to post immediately after:

I researched how 150+ AI products handle onboarding and found a consistent pattern: the ones with the best activation rates all use some form of template activation loop rather than traditional tooltip-driven onboarding.

The core problem is the "blank canvas" issue. Traditional SaaS products have buttons and menus that afford specific actions. AI products present an empty text input and expect users to know how to prompt. The average B2B SaaS activation rate is 37.5%, and for AI products without good prompt guidance, it can be worse.

Three approaches consistently work: template activation (show a working example, let users remix it, then bridge to freeform), the 60-seconds-to-value framework from ProductLed, and guided prompt tours that teach prompting concepts at each step rather than just pointing at UI elements.

One finding I didn't expect: Uberto Barbini's research shows AI-assisted onboarding that does too much actually slows skill development. Users get faster initial results but don't close the knowledge gap. There's a real tension between "do it for them" and "teach them to do it."

I work on Tour Kit (a headless React tour library), so I included code examples. But the patterns apply regardless of what tooling you use.
