<script lang="ts">
  import { onMount } from 'svelte'
  import { getTour } from '../../provide-tour-kit'

  let { tourId }: { tourId: string } = $props()

  const tour = getTour()

  // A child's onMount fires BEFORE the parent's — the handle's lazy ensure()
  // is what makes this work without the provider constructing during init.
  onMount(() => {
    void tour.start(tourId)
  })
</script>

<div data-testid="child">{tour.state.isActive}</div>
