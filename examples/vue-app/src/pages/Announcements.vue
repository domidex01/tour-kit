<script setup lang="ts">
import { computed } from 'vue'
import { provideAnnouncementsEngine } from '../composables/useAnnouncementsEngine'

/**
 * An announcement rendered from `@tour-kit/announcements/engine` alone.
 *
 * No React is installed in this app, and no `@tour-kit/announcements`
 * component is imported — the markup below is ordinary Vue. The engine owns
 * the queue, the priority ordering, the frequency rules, the audience and the
 * schedule; this page owns every pixel.
 *
 * NOTE: the engine path carries no licence gate. `<AnnouncementsProvider>`
 * wraps its tree in `<LicenseGate require="pro">`; the engine does not, and
 * whether non-React consumers should be gated is still an open commercial
 * question. This page is a demonstration of the runtime, not a statement that
 * the Pro tier is free through this door.
 */
const { handle, state } = provideAnnouncementsEngine(
  [
    { id: 'welcome', variant: 'modal', priority: 'high', autoShow: true },
    { id: 'changelog', variant: 'banner', priority: 'normal', autoShow: true },
    // Fails CLOSED until `setSegments` admits it — see the two buttons below.
    { id: 'admin-only', variant: 'modal', audience: { segment: 'admins' }, autoShow: true },
  ],
  // React reads this from <SegmentationProvider>; Vue has no equivalent yet, so
  // the page passes a literal. `admins: false` is the interesting default.
  { admins: false }
)

const active = computed(() => state.value.activeAnnouncement)
const queue = computed(() => state.value.queue)
const viewCount = computed(
  () => state.value.announcements.get(active.value ?? '')?.viewCount ?? 0
)
const adminEligible = computed(() => state.value.configs.has('admin-only'))
// Read from the SNAPSHOT, not by calling `canShow()` in the template. The
// engine reports eligibility as state precisely so a consumer can render it
// reactively — a template call would be re-evaluated only when some OTHER part
// of the state changed identity, which is a stale answer waiting to happen.
const canShowAdmin = computed(() => state.value.eligibleIds.has('admin-only'))

const engine = () => handle.ensure()
</script>

<template>
  <section class="page">
    <h1>Announcements, from the engine alone</h1>
    <p class="muted">
      No React in this app. The queue, priorities, audience and schedule all run in
      <code>@tour-kit/announcements/engine</code>; every pixel below is plain Vue.
    </p>

    <div v-if="active" data-testid="announcement" class="card">
      <h2 data-testid="announcement-id">{{ active }}</h2>
      <p>Shown <span data-testid="view-count">{{ viewCount }}</span> time(s).</p>
      <div class="row">
        <button data-testid="dismiss" @click="engine().dismiss(active, 'close_button')">
          Dismiss
        </button>
        <button data-testid="complete" @click="engine().complete(active)">Got it</button>
      </div>
    </div>
    <p v-else data-testid="nothing-active" class="muted">Nothing showing.</p>

    <p>
      Queued: <span data-testid="queue">{{ queue.join(', ') || 'none' }}</span>
    </p>

    <fieldset>
      <legend>Segment gating</legend>
      <p class="muted">
        <code>admin-only</code> has <code>audience: {{ '{' }} segment: 'admins' {{ '}' }}</code>. It is
        registered — <span data-testid="admin-registered">{{ adminEligible }}</span> — but the engine
        refuses to show it until the segment map admits it.
      </p>
      <p>
        Can show it now:
        <span data-testid="can-show-admin">{{ canShowAdmin }}</span>
      </p>
      <div class="row">
        <button data-testid="admit-admins" @click="engine().setSegments({ admins: true })">
          I am an admin
        </button>
        <button data-testid="revoke-admins" @click="engine().setSegments({ admins: false })">
          I am not
        </button>
      </div>
    </fieldset>
  </section>
</template>
