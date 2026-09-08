<script lang="ts">
  import { provideTourKit, type TourKitOptions } from '../../provide-tour-kit'
  import Child from './Child.svelte'

  let { options, tourId }: { options: TourKitOptions; tourId: string } = $props()

  provideTourKit(options)
</script>

<Child {tourId} />
