## Title: Touch-friendly patterns for mobile product tours (thumb zones, WCAG targets, bottom sheets)

## URL: https://usertourkit.com/blog/product-tours-mobile-first-web-apps

## Comment to post immediately after:

I've been building product tour components in React and noticed most tour libraries were designed entirely for desktop viewports. When you open them on a phone, tooltips overflow, dismiss buttons are unreachable, and the whole experience falls apart.

This guide covers the specific patterns that fix mobile tours: thumb zone positioning (49% of users hold their phone one-handed), bottom sheets instead of anchored tooltips, WCAG 2.2 touch target requirements (44px AAA vs 24px AA), and performance strategies to avoid tanking Core Web Vitals.

The most surprising finding from the research: Chameleon analyzed 15 million product tour interactions and found three-step tours achieve 72% completion — the highest of any length. On mobile where attention is split, shorter really does win.

I built Tour Kit (the library in the examples), but the patterns are library-agnostic. The WCAG touch target table and thumb zone layout approach apply to any interactive overlay on mobile.
