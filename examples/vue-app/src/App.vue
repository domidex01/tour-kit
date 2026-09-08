<script setup lang="ts">
import { createVueRouterAdapter, provideTourKit } from '@tour-kit/vue'
import { useRouter } from 'vue-router'
import TourCard from './components/TourCard.vue'
import { tours } from './tours'

const router = useRouter()

// A Vue Router instance is an app-level singleton, so this adapter's identity is
// stable — unlike every React adapter, which is a `useMemo` over hook results.
const kit = provideTourKit({
  tours,
  router: createVueRouterAdapter(router),
  // `flowSession` takes a `storage`, not an `enabled` — it is what makes a
  // hard reload resume the active tour at its persisted step, and what makes
  // the `flow-restore` console timer fire at all.
  routePersistence: { enabled: true, flowSession: { storage: 'sessionStorage' } },
  enableTestBridge: true,
})

const start = () => {
  void kit.start('proof')
}
</script>

<template>
  <header>
    <h1>Tour Kit — Vue binding</h1>
    <p>
      Nothing on this page imports React. The tour engine, routing, persistence,
      focus and keyboard all come from <code>@tour-kit/core/engine</code>.
    </p>
    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/settings">Settings</RouterLink>
    </nav>
    <button id="start-tour" data-testid="start-tour" type="button" @click="start">
      Start tour
    </button>
  </header>

  <main>
    <RouterView />
  </main>

  <TourCard />
</template>
