## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote up the full timeline of Shepherd.js's React 19 compatibility gap — it was broken for 13 months because the wrapper depended on a React internal that got renamed. The fix landed in March 2026 but it was just a peerDep relaxation, not an architectural fix.

Includes a comparison table with React-native alternatives and a decision framework if you're picking a tour library today: https://usertourkit.com/blog/does-shepherd-js-work-with-react-19

Curious if anyone else hit this during their React 19 upgrade — what did you switch to?
