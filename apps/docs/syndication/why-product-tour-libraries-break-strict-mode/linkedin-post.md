React Strict Mode breaks most product tour libraries. Not in subtle ways — overlays flash twice, scroll locks freeze permanently, keyboard shortcuts fire double.

I tested React Joyride, Shepherd.js, Driver.js, and Intro.js under Strict Mode in a clean React 19 project. All four have patterns that don't survive the mount-unmount-remount cycle React uses to stress-test effects.

The most surprising finding: React has an unresolved bug (#24670, open since April 2024) where Strict Mode's simulated unmount doesn't clear ref.current. Even libraries with proper cleanup functions leak event listeners through this gap. No existing tour library comparison tests for this.

Atlassian hit the same wall — their atlaskit onboarding spotlights broke visibly after upgrading to React 18.

I put together a 5-point audit checklist any team can run in 2 minutes to test their tour library's Strict Mode compliance: https://usertourkit.com/blog/why-product-tour-libraries-break-strict-mode

#react #javascript #webdevelopment #frontend #opensource
