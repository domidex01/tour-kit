# Product tours in Remix: setup, routing, and best practices

## A step-by-step guide to building multi-route product tours that survive navigation

*Originally published at [usertourkit.com](https://usertourkit.com/blog/remix-product-tour)*

Remix apps handle data through loaders and actions at the route level. That makes most product tour libraries awkward to integrate because they assume component-level state management.

I spent a week testing different approaches to building a product tour in Remix. The solution that worked: placing a headless tour provider in the root layout so it survives route transitions, using `data-tour` attributes as CSS selectors for step targeting, and persisting completion through Remix resource routes.

Here's what I learned.

## The core challenge: route-level data, component-level UI

Most React tour tutorials target Next.js or plain Create React App. They skip Remix patterns like nested route persistence and loader-driven configuration. When you navigate between routes in Remix, the Outlet swaps, which unmounts any tour state living inside a child route.

The fix is placing your `TourProvider` in `app/root.tsx`, above the Outlet. The provider stays mounted while child routes change. Tour progress persists across every navigation.

## Server-side persistence through actions

localStorage handles single-device state. For production, create a resource route:

```
// app/routes/api.tour-complete.tsx
export async function action({ request }) {
  const formData = await request.formData()
  const tourId = formData.get('tourId')
  // Save to your database
  return json({ success: true })
}
```

Fire it with `useFetcher().submit()` when the tour completes. No full-page navigation, no state loss.

## Route-aware steps

Some steps target elements on different pages. Pass `useNavigate` to the tour provider's `onNavigate` callback. When a step has a `route` field that doesn't match the current URL, the library navigates first, waits for the DOM element to appear, then positions the tooltip.

The gotcha: `useNavigate` must be called inside Remix's router context. In `root.tsx`, you're already there. Extract the provider to a separate file and you might break it.

## Focus management across transitions

Remix doesn't manage focus on route changes. Their docs call this out directly. For keyboard users navigating through a multi-route tour, focus can get lost between the route transition and tooltip render.

The solution: a `FocusManager` component that moves focus to a `main` landmark on every route change. The tour library's built-in focus trap takes over once the tooltip mounts.

## React Router v7 compatibility

Remix merged into React Router v7 as of December 2024. Every pattern in this approach works identically in both. Just change your imports from `@remix-run/react` to `react-router`.

React Router is used by 7.8 million GitHub projects. Shopify runs a 5-million-line app on it.

## What didn't work

A few things I tried that failed:

- Putting the tour provider inside a nested layout route. State reset on every navigation.
- Auto-starting the tour before hydration completed. Spotlight positions were wrong.
- Using `navigate()` outside the router context. Silent failure, no error message.

## The full tutorial

The complete walkthrough with all code examples, troubleshooting section, and FAQ is on the Tour Kit blog:

[Product tours in Remix: setup, routing, and best practices](https://usertourkit.com/blog/remix-product-tour)

---

**Suggested Medium publications to submit to:**
- JavaScript in Plain English
- Better Programming
- Bits and Pieces
