You know those pulsing dots in SaaS apps that highlight new features? Most React implementations of them completely skip keyboard accessibility.

WCAG 1.4.13 requires content triggered by hover or focus to be dismissable via Escape, hoverable (pointer can move into the tooltip), and persistent until the user acts. I couldn't find a single React hotspot tutorial that addresses all three.

So I wrote one. It covers building accessible hotspot components with Floating UI positioning, independent state per hotspot, and prefers-reduced-motion support. Bundle impact is under 10KB gzipped — compared to ~37KB for React Joyride's full library.

The comparison table in the article breaks down Tour Kit Hints vs React Joyride beacon vs CSS-only approaches across six criteria.

Full tutorial: https://usertourkit.com/blog/react-hotspot-component

#react #javascript #accessibility #webdevelopment #opensource
