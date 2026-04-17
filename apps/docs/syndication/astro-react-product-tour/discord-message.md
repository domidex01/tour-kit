## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote a tutorial on adding product tours to Astro sites using React islands. Covers the cross-island state problem (React Context doesn't span island boundaries) and how to solve it with Nanostores. Also has the `client:only="react"` vs `client:load` hydration gotcha that caught me off guard.

https://usertourkit.com/blog/astro-react-product-tour

If anyone's using Astro with React islands, curious if you've hit similar hydration issues with other interactive components.
