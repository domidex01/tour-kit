<script setup lang="ts">
/**
 * The consumer's own card — the headless half of the proof. `@tour-kit/vue`
 * ships no component and no `@floating-ui/*`; positioning lives here, with the
 * exact middleware stack `packages/react/src/components/card/tour-card.tsx`
 * uses, so the two cards position identically.
 */
import {
  type Placement as FloatingPlacement,
  arrow,
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from '@floating-ui/dom'
import {
  getDocumentDirection,
  mirrorPlacementForRTL,
  useFocusTrap,
  useSpotlight,
  useTour,
} from '@tour-kit/vue'
import { computed, nextTick, onScopeDispose, shallowRef, watch } from 'vue'

/**
 * Core's `Placement` has a `-center` alignment; floating-ui's does not (it
 * spells the same thing as the bare side). Strip it on the way out.
 */
function toFloatingPlacement(placement: string): FloatingPlacement {
  return placement.replace(/-center$/, '') as FloatingPlacement
}

const tour = useTour()
const spotlight = useSpotlight()

const isActive = computed(() => tour.state.value.isActive)
const step = computed(() => tour.state.value.currentStep)
const isFirst = computed(() => tour.state.value.currentStepIndex === 0)

const { containerRef, activate, deactivate } = useFocusTrap(isActive)
const arrowRef = shallowRef<HTMLElement | null>(null)

let cleanupPosition: (() => void) | null = null

const stopPositioning = () => {
  cleanupPosition?.()
  cleanupPosition = null
}

function position(reference: HTMLElement, floating: HTMLElement) {
  stopPositioning()
  const placement = toFloatingPlacement(
    mirrorPlacementForRTL(step.value?.placement ?? 'bottom', getDocumentDirection() === 'rtl')
  )
  cleanupPosition = autoUpdate(reference, floating, () => {
    void computePosition(reference, floating, {
      placement,
      middleware: [
        offset(12),
        flip({ fallbackAxisSideDirection: 'start' }),
        shift({ padding: 8 }),
        ...(arrowRef.value ? [arrow({ element: arrowRef.value })] : []),
      ],
    }).then(({ x, y, middlewareData }) => {
      Object.assign(floating.style, { left: `${x}px`, top: `${y}px` })
      const a = middlewareData.arrow
      if (arrowRef.value && a) {
        Object.assign(arrowRef.value.style, {
          left: a.x != null ? `${a.x}px` : '',
          top: a.y != null ? `${a.y}px` : '',
        })
      }
    })
  })
}

watch(
  [isActive, step],
  async ([active, current]) => {
    if (!active || !current || !('target' in current)) {
      stopPositioning()
      spotlight.hide()
      // The CARD owns the focus restore, not the binding — `useFocusTrap`'s
      // `enabled` gate only decides whether `activate()` does anything, exactly
      // like the React hook. `<TourCard>` (React) calls `deactivate()` from its
      // effect cleanup; this is the same call at the same moment.
      deactivate()
      return
    }
    await nextTick()
    const reference = document.querySelector<HTMLElement>(String(current.target))
    const floating = containerRef.value
    if (!reference || !floating) return
    spotlight.show(reference)
    position(reference, floating)
    activate()
  },
  { immediate: true }
)

onScopeDispose(stopPositioning)
</script>

<template>
  <div
    v-if="isActive && step"
    ref="containerRef"
    class="tk-card"
    data-testid="tour-card"
    role="dialog"
    aria-modal="true"
    :aria-label="String(step.title ?? 'Tour step')"
  >
    <h2 data-testid="tour-card-title">{{ step.title }}</h2>
    <p data-testid="tour-card-content">{{ step.content }}</p>

    <!--
      `.stop` is load-bearing, not cosmetic. Step 2 is document-bound and
      `bindStepAdvance` has no card guard, so without it clicking Back would
      ALSO advance the tour. It lives on each button rather than on a wrapper
      div because a click handler on a non-interactive element is an a11y
      failure.
    -->
    <div class="tk-actions">
      <button
        v-if="!isFirst"
        data-testid="tour-back"
        type="button"
        @click.stop="tour.prev()"
      >
        Back
      </button>
      <button data-testid="tour-next" type="button" @click.stop="tour.next()">Next</button>
      <button data-testid="tour-skip" type="button" @click.stop="tour.skip()">Skip</button>
    </div>

    <div ref="arrowRef" class="tk-arrow" />
  </div>
</template>
