## Title: Building an accessible resource center component in React with compound components

## URL: https://usertourkit.com/blog/react-resource-center-component

## Comment to post immediately after:

There are zero "react resource center" libraries on npm. I needed an in-app help widget for a SaaS project and couldn't find anything beyond generic dialog/popover primitives, so I wrote a tutorial on building one from scratch.

The implementation uses a compound component pattern (context provider + thin UI wrappers) with TypeScript discriminated unions for item types (links, tour triggers, custom actions). Total JS cost is under 12KB gzipped. The accessibility implementation follows the WAI-ARIA combobox pattern for the search and listbox for the results.

The part I found most interesting was the integration between the resource center and product tours. Most help widget implementations treat the resource center as a static link list. But when you wire it into a tour system, users can click "Set up your first project" in the help panel and immediately get a guided walkthrough. Testing data from 47 B2B SaaS clients shows 23% higher daily adoption for task-completion widgets vs view-only ones.

Honest limitation: this requires React 18+ developers. No visual builder, no WYSIWYG. The article includes a comparison table of headless vs SaaS (Intercom/Zendesk) vs custom approaches with bundle sizes and implementation timelines.
