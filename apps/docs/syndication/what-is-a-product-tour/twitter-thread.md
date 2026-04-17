## Thread (6 tweets)

**1/** Every "what is a product tour" article is written by marketing teams selling SaaS tools. So I wrote one for developers — covering state machines, DOM positioning, and why most libraries break WCAG compliance.

**2/** A product tour runs through 4 stages on every step:
1. Target resolution (find the DOM element)
2. Positioning (anchor tooltip to viewport)
3. Overlay rendering (spotlight cutout)
4. Focus management (keyboard trapping)

Most libraries skip #4 entirely.

**3/** Chameleon analyzed 15M tour interactions:
- 3-step tours: 72% completion
- 7-step tours: 16%
- User-initiated: 67%
- Auto-triggered: 31%

Short + opt-in wins. Every time.

**4/** There are 4 product tour patterns:
- Action-driven tooltips (task to advance)
- Passive walkthroughs (click Next)
- Hotspots (non-blocking dots)
- Announcement modals (one-shot)

Picking the wrong pattern is the #1 reason tours get dismissed.

**5/** The accessibility gap is wild. Most tour libraries produce overlays that trap visual attention but let keyboard focus wander freely behind the overlay. That violates WCAG 2.1 SC 2.4.3.

Focus management isn't optional.

**6/** Full article with code examples, comparison table, and FAQ:

https://usertourkit.com/blog/what-is-a-product-tour
