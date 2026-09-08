<script lang="ts">
  /**
   * The consumer's own card — the headless half of the proof. `@tour-kit/svelte`
   * ships no component and no `@floating-ui/*`; positioning lives here, with the
   * exact middleware stack the React card uses, so the two position identically.
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
    createSpotlight,
    focusTrap,
    getDocumentDirection,
    mirrorPlacementForRTL,
    getTour,
  } from '@tour-kit/svelte'
  import { onDestroy, tick } from 'svelte'

  const tour = getTour()
  const spotlight = createSpotlight()

  const isActive = $derived(tour.state.isActive)
  const step = $derived(tour.state.currentStep)
  const isFirst = $derived(tour.state.currentStepIndex === 0)

  let cardEl = $state<HTMLElement | null>(null)
  let arrowEl = $state<HTMLElement | null>(null)
  let cleanupPosition: (() => void) | null = null

  /**
   * Core's `Placement` has a `-center` alignment; floating-ui's does not (it
   * spells the same thing as the bare side). Strip it on the way out.
   */
  function toFloatingPlacement(placement: string): FloatingPlacement {
    return placement.replace(/-center$/, '') as FloatingPlacement
  }

  function stopPositioning() {
    cleanupPosition?.()
    cleanupPosition = null
  }

  $effect(() => {
    const current = step
    if (!isActive || !current || !('target' in current)) {
      stopPositioning()
      spotlight.hide()
      return
    }

    let cancelled = false
    void tick().then(() => {
      if (cancelled) return
      const reference = document.querySelector<HTMLElement>(String(current.target))
      if (!reference || !cardEl) return

      spotlight.show(reference)
      stopPositioning()

      const placement = toFloatingPlacement(
        mirrorPlacementForRTL(current.placement ?? 'bottom', getDocumentDirection() === 'rtl')
      )
      const floating = cardEl
      cleanupPosition = autoUpdate(reference, floating, () => {
        void computePosition(reference, floating, {
          placement,
          middleware: [
            offset(12),
            flip({ fallbackAxisSideDirection: 'start' }),
            shift({ padding: 8 }),
            ...(arrowEl ? [arrow({ element: arrowEl })] : []),
          ],
        }).then(({ x, y, middlewareData }) => {
          Object.assign(floating.style, { left: `${x}px`, top: `${y}px` })
          const a = middlewareData.arrow
          if (arrowEl && a) {
            Object.assign(arrowEl.style, {
              left: a.x != null ? `${a.x}px` : '',
              top: a.y != null ? `${a.y}px` : '',
            })
          }
        })
      })
    })

    return () => {
      cancelled = true
    }
  })

  onDestroy(() => {
    stopPositioning()
    spotlight.destroy()
  })
</script>

{#if isActive && step}
  <div
    bind:this={cardEl}
    use:focusTrap={{ enabled: true }}
    class="tk-card"
    data-testid="tour-card"
    role="dialog"
    aria-modal="true"
    aria-label={String(step.title ?? 'Tour step')}
  >
    <h2 data-testid="tour-card-title">{step.title}</h2>
    <p data-testid="tour-card-content">{step.content}</p>

    <!--
      `stopPropagation` is load-bearing, not cosmetic. Step 2 is document-bound
      and `bindStepAdvance` has no card guard, so without it clicking Back would
      ALSO advance the tour. It lives on each button rather than on a wrapper
      div because a click handler on a non-interactive element is an a11y
      failure (`svelte-check` says so, and it is right).
    -->
    <div class="tk-actions">
      {#if !isFirst}
        <button data-testid="tour-back" type="button" onclick={(e) => { e.stopPropagation(); tour.prev() }}>
          Back
        </button>
      {/if}
      <button data-testid="tour-next" type="button" onclick={(e) => { e.stopPropagation(); tour.next() }}>
        Next
      </button>
      <button data-testid="tour-skip" type="button" onclick={(e) => { e.stopPropagation(); tour.skip() }}>
        Skip
      </button>
    </div>

    <div bind:this={arrowEl} class="tk-arrow"></div>
  </div>
{/if}
