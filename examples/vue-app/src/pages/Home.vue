<script setup lang="ts">
import HintDot from '../components/HintDot.vue'
</script>

<template>
  <section>
    <h2>Home</h2>
    <p>Step one of the tour points at the button below.</p>
    <button id="start-here" data-testid="start-here" type="button">Start here</button>

    <p>
      The dot beside <em>Export</em> is a hint, rendered from
      <code>@tour-kit/hints/engine</code> alone — no React, no
      <code>@tour-kit/hints</code> components. Dismissing it is sticky: the
      hint's frequency rule is <code>once</code>, so it stays gone after a
      reload.
    </p>
    <button id="hint-target" data-testid="hint-target" type="button">Export</button>
    <HintDot id="export" target="#hint-target" position="top-right" />
  </section>
</template>
