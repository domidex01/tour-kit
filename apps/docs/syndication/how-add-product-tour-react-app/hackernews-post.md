## Title: Most React product tour libraries don't work with React 19

## URL: https://usertourkit.com/blog/how-add-product-tour-react-app

## Comment to post immediately after:

I compared every major React product tour library and the React 19 compatibility situation is surprisingly bad.

React Joyride (400K+ weekly npm downloads) hasn't been updated in 9+ months and breaks on React 19. The react-shepherd wrapper is also incompatible. Intro.js has documented accessibility issues — no focus trap, wrong ARIA roles on buttons. Driver.js works (vanilla JS) but requires manual React lifecycle management.

Sentry's engineering team wrote about building their own tour system from scratch using React Context + useReducer because nothing off the shelf was flexible enough. Their writeup at sentry.engineering is worth reading for the architectural decisions.

The article covers five approaches (dedicated library, vanilla JS wrapper, headless library, build-it-yourself, and experimental CSS anchor positioning) with a comparison table and working code. I built Tour Kit so there's obvious bias — I note its limitations including no visual builder and a smaller community.
