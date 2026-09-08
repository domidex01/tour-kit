<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation'
  import { page } from '$app/state'
  import { createSvelteKitRouterAdapter, provideTourKit } from '@tour-kit/svelte'
  import type { Snippet } from 'svelte'
  import TourCard from '$lib/TourCard.svelte'
  import { tours } from '$lib/tours'
  import '../app.css'

  let { children }: { children: Snippet } = $props()

  // `afterNavigate` must be called during component initialisation — the
  // factory calls it synchronously, and this <script> IS initialisation.
  const router = createSvelteKitRouterAdapter({
    goto,
    getPathname: () => page.url.pathname,
    onNavigate: afterNavigate,
  })

  const kit = provideTourKit({
    tours,
    router,
    // `flowSession` takes a `storage`, not an `enabled` — it is what makes a
    // hard reload resume the active tour at its persisted step.
    routePersistence: { enabled: true, flowSession: { storage: 'sessionStorage' } },
    enableTestBridge: true,
  })
</script>

<header>
  <h1>Tour Kit — Svelte binding</h1>
  <p>
    Nothing on this page imports React. The tour engine, routing, persistence,
    focus and keyboard all come from <code>@tour-kit/core/engine</code>.
  </p>
  <nav>
    <a href="/">Home</a>
    <a href="/settings">Settings</a>
  </nav>
  <button id="start-tour" data-testid="start-tour" type="button" onclick={() => kit.start('proof')}>
    Start tour
  </button>
</header>

<main>
  {@render children()}
</main>

<TourCard />
