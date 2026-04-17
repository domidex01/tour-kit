Every product tour library claims "lightweight." None publish benchmarks.

I installed React Joyride, Shepherd.js, Tour Kit, Driver.js, and Intro.js into the same Vite 6 + React 19 project and measured what actually happens to your bundle and Core Web Vitals.

The accessibility gap was the biggest surprise: 3 of 5 libraries ship ARIA violations that would fail a WCAG 2.1 AA audit. If your product sells to government, healthcare, or enterprise, that's not optional.

React 19 compatibility was the other differentiator. React Joyride v2 broke. Shepherd's React wrapper had issues. Teams upgrading to React 19 should verify their tour library before migrating.

Full benchmark with comparison table and methodology: https://usertourkit.com/blog/react-tour-library-benchmark-2026

#react #javascript #webdevelopment #accessibility #opensource
