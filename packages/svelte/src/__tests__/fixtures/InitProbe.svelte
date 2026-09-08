<script lang="ts">
  import { provideTourKit, type TourKitOptions } from '../../provide-tour-kit'

  let { options, onInit }: { options: TourKitOptions; onInit: () => void } = $props()

  provideTourKit(options)
  // Still inside component initialisation — `onMount` has not run yet.
  onInit()
</script>

<div data-testid="init-probe"></div>
