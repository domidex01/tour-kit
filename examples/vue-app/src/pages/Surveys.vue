<script setup lang="ts">
import { computed, ref } from 'vue'
import { provideSurveysEngine } from '../composables/useSurveysEngine'

/**
 * A survey rendered from `@tour-kit/surveys/engine` alone.
 *
 * No React is installed. The engine owns the queue, the six fatigue gates, the
 * audience, the schedule, persistence and the NPS scoring; this page owns the
 * markup and decides what a "question" looks like.
 *
 * NOTE: the engine path carries no licence gate, exactly as on the
 * announcements page. See that file's note.
 */
// The ENGINE computes this — the page never scores anything itself.
const score = ref<number | null>(null)

const { handle, state } = provideSurveysEngine(
  [
    { id: 'nps-q3', type: 'nps', displayMode: 'modal' },
    { id: 'csat-docs', type: 'csat', displayMode: 'banner' },
  ],
  (_id, _type, result) => {
    score.value = result.score
  }
)

const active = computed(() => state.value.activeSurvey)
const current = computed(() => state.value.surveys.get(active.value ?? ''))
const answered = computed(() => [...(current.value?.responses.values() ?? [])])

const engine = () => handle.ensure()

function rate(value: number) {
  if (!active.value) return
  engine().answer(active.value, `q${current.value?.currentStep ?? 0}`, value)
  engine().nextQuestion(active.value)
}

function finish() {
  if (!active.value) return
  engine().complete(active.value)
}
</script>

<template>
  <section class="page">
    <h1>Surveys, from the engine alone</h1>
    <p class="muted">
      No React in this app. Queueing, fatigue gates, persistence and NPS/CSAT scoring all run in
      <code>@tour-kit/surveys/engine</code>.
    </p>

    <div v-if="active" data-testid="survey" class="card">
      <h2 data-testid="survey-id">{{ active }}</h2>
      <p>
        Question <span data-testid="step">{{ current?.currentStep ?? 0 }}</span> — how likely are you
        to recommend us?
      </p>
      <div class="row">
        <button
          v-for="n in [0, 5, 9, 10]"
          :key="n"
          :data-testid="`rate-${n}`"
          @click="rate(n)"
        >
          {{ n }}
        </button>
      </div>
      <p>
        Answered so far: <span data-testid="answers">{{ answered.join(', ') || 'nothing' }}</span>
      </p>
      <div class="row">
        <button data-testid="finish" @click="finish">Submit</button>
        <button data-testid="snooze" @click="engine().snooze(active)">Later</button>
        <button data-testid="dismiss" @click="engine().dismiss(active, 'close_button')">
          No thanks
        </button>
      </div>
    </div>
    <p v-else data-testid="nothing-active" class="muted">No survey showing.</p>

    <p>
      Queued: <span data-testid="queue">{{ state.queue.join(', ') || 'none' }}</span>
    </p>
    <p v-if="score !== null">
      Score: <span data-testid="score">{{ score }}</span>
    </p>

    <div class="row">
      <button data-testid="show-nps" @click="engine().show('nps-q3')">Show the NPS survey</button>
      <button data-testid="show-csat" @click="engine().show('csat-docs')">Show CSAT</button>
    </div>
  </section>
</template>
