## Title: What is a product tour? A technical definition covering state machines, positioning engines, and accessibility

## URL: https://usertourkit.com/blog/what-is-a-product-tour

## Comment to post immediately after:

I wrote this because every existing "what is a product tour" article is written for product managers evaluating SaaS tools. None of them cover the technical implementation: how tours resolve DOM targets, calculate tooltip positioning during scroll/resize, render overlay cutouts, or manage keyboard focus.

The accessibility angle is what surprised me most during research. Of the major tour libraries, most skip focus management entirely — meaning their tours violate WCAG 2.1 SC 2.4.3 (focus order). The four-stage pipeline (target resolution → positioning → overlay → focus trapping) is a useful mental model for evaluating any tour implementation.

Chameleon's data from 15 million tour interactions is interesting: 3-step tours complete at 72%, but 7-step tours drop to 16%. User-initiated tours hit 67% while auto-triggered ones manage only 31%. The architecture implications are clear — tours should default to short and opt-in.

I built Tour Kit (headless React tour library), which is mentioned in the article. Happy to answer questions about tour implementation specifics.
