<script setup lang="ts">
import { getHotspotPosition, type HotspotPosition } from '@tour-kit/hints/engine'
import { type RectTracker, trackRect } from '@tour-kit/vue'
import { computed, onMounted, onScopeDispose, shallowRef, watch } from 'vue'
import { useHintsKit } from '../composables/useHintsEngine'

const props = withDefaults(
  defineProps<{ id: string; target: string; position?: HotspotPosition }>(),
  { position: 'top-right' }
)

const { handle, state } = useHintsKit()

const hint = computed(() => state.value.hints.get(props.id))
const isOpen = computed(() => hint.value?.isOpen ?? false)
const isDismissed = computed(() => hint.value?.isDismissed ?? false)

const rect = shallowRef<DOMRect | null>(null)
let tracker: RectTracker | null = null

/**
 * Start tracking only once the ENGINE knows the hint, and only once this
 * component's DOM neighbours exist. The first state the dot sees is then the
 * hydrated one, so a persisted dismissal never flashes a dot before
 * suppressing it.
 *
 * Both triggers below are needed, and neither alone is enough:
 *
 * - `onMounted`, because the engine is usually ALREADY registered by the time
 *   this component sets up. `<App>` mounts and boots before vue-router
 *   resolves the initial route, so `<HintDot>`'s setup runs after the seed. An
 *   `{ immediate: true }` watch therefore fires exactly once, during setup,
 *   when `#hint-target` is not in the document yet — and never again, because
 *   its source never changes. That is a silent no-dot.
 * - the watch, because on a route where the config arrives later (or a hint
 *   added to `setHints` after mount) registration is the later of the two.
 *
 * `startTracking` is idempotent, so whichever fires second is a no-op.
 */
function startTracking(): void {
  if (tracker || hint.value === undefined) return
  const el = document.querySelector<HTMLElement>(props.target)
  if (!el) return
  tracker = trackRect(
    el,
    (r) => {
      rect.value = r
    },
    { observeResize: true }
  )
  tracker.update()
}

onMounted(startTracking)
watch(() => hint.value !== undefined, startTracking)

onScopeDispose(() => tracker?.stop())

const pos = computed(() => (rect.value ? getHotspotPosition(props.position, rect.value) : null))
</script>

<template>
  <button
    v-if="!isDismissed && pos"
    :data-testid="`hint-dot-${id}`"
    type="button"
    class="hint-dot"
    :style="{ top: `${pos.top}px`, left: `${pos.left}px` }"
    :aria-label="isOpen ? 'Hide hint' : 'Show hint'"
    :aria-expanded="isOpen"
    @click="isOpen ? handle.hideHint(id) : handle.showHint(id)"
  />
  <div
    v-if="!isDismissed && pos && isOpen"
    role="tooltip"
    :data-testid="`hint-tooltip-${id}`"
    class="hint-tooltip"
    :style="{ top: `${pos.top + 16}px`, left: `${pos.left}px` }"
  >
    <slot>Export your data from here.</slot>
    <button :data-testid="`hint-dismiss-${id}`" type="button" @click="handle.dismissHint(id)">
      Dismiss
    </button>
  </div>
</template>

<style scoped>
.hint-dot {
  position: fixed;
  width: 12px;
  height: 12px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #2563eb;
  cursor: pointer;
  z-index: 40;
}
.hint-tooltip {
  position: fixed;
  z-index: 41;
  max-width: 220px;
  padding: 8px 10px;
  border-radius: 6px;
  background: #111827;
  color: #f9fafb;
  font-size: 13px;
}
.hint-tooltip button {
  display: block;
  margin-top: 6px;
}
</style>
