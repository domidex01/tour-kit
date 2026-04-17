## Thread (6 tweets)

**1/** 78% of users abandon product tours by step three.

I analyzed data from 550M interactions and found 10 structural mistakes that kill activation rates. Here's what the numbers actually say:

**2/** The firehose kills everything.

3-step tours: 72% completion
4-step tours: 74% (sweet spot)
7-step tours: 16%

Adding ONE step to a 3-step tour drops completion to 45%.

Your 15-step "product overview" is a slideshow nobody reads.

**3/** Timing matters more than content.

Click-triggered tours (user starts it): 67% completion
Auto-fire on page load: 31%

"It's like blaring an overhead speaker in an airport. You will get attention. But people will start tuning it out." — Harrison Johnson, Chameleon

**4/** The skip button paradox.

~40% of users skip at step one when forced into a tour.

But giving users full control over staying or leaving makes them MORE likely to read the content.

A skip button is a trust signal, not a failure indicator.

**5/** The most underreported antipattern: accessibility.

Most tour libraries ship without:
- ARIA attributes on tooltips
- Keyboard navigation between steps
- Escape key to dismiss
- prefers-reduced-motion support

15% of users have some disability. That's not an edge case.

**6/** Full breakdown with code examples, a diagnostic audit table, and fixes for all 10 antipatterns:

https://usertourkit.com/blog/product-tour-antipatterns-kill-activation

Data from Chameleon, UserGuiding, SaaSFactor, and Design Revision.
