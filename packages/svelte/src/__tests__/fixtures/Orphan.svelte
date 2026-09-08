<script lang="ts">
  import { getTour } from '../../provide-tour-kit'

  const tour = getTour()
</script>

<div>{tour.state.isActive}</div>
