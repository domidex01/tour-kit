<script lang="ts">
  import type { Snippet } from 'svelte'
  import { provideTourKit, type TourKitOptions } from '../../provide-tour-kit'

  let { options, children }: { options: TourKitOptions; children?: Snippet } = $props()

  const kit = provideTourKit(options)
</script>

<div data-testid="provider">{kit.state.isActive}</div>
{@render children?.()}
