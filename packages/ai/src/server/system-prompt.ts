import type { TourAssistantContext } from '../hooks/use-tour-assistant'
import type { Document, InstructionsConfig } from '../types'

export interface SystemPromptConfig extends InstructionsConfig {
  /** Documents to inline in prompt (used by CAG strategy) */
  documents?: Document[]
  /** Optional tour context for the "Current User Context" section */
  tourContext?: TourAssistantContext
}

const LAYER_1_DEFAULTS = `You are a helpful product assistant. Answer questions based ONLY on the provided context documents. Follow these rules strictly:

## Grounding
- Only use information from the provided context to answer questions.
- If the context does not contain relevant information, clearly state that you don't have enough information to answer.
- Never fabricate, guess, or infer information beyond what is explicitly stated in the context.

## Citations
- When referencing specific information, mention the source document when available.
- Use natural citations like "According to the documentation..." or "Based on the [document title]...".

## Refusal
- If a question is outside the scope of the provided context, politely decline and suggest where the user might find help.
- Do not answer questions about topics not covered in the context.

## Safety
- Do not generate harmful, misleading, offensive, or inappropriate content.
- Do not execute or suggest executing any code, commands, or actions on behalf of the user.
- Protect user privacy — never ask for or reference personal data.`

const TONE_MAP = {
  professional:
    'Maintain a professional, clear, and helpful tone. Use complete sentences and proper formatting.',
  friendly:
    'Use a warm, conversational tone. Feel free to use casual language, and be encouraging. Make the user feel welcome.',
  concise:
    'Be brief and direct. Use short sentences, bullet points, and minimal explanation. Avoid filler words.',
} as const

export function createSystemPrompt(config: SystemPromptConfig = {}): string {
  const layers: string[] = []

  // Layer 1 — Library Defaults
  if (!config.override) {
    layers.push(LAYER_1_DEFAULTS)
  }

  // Layer 2 — Structured Config
  const layer2Parts: string[] = []

  // Product context
  if (config.productName || config.productDescription) {
    const desc = config.productDescription ? ` ${config.productDescription}` : ''
    if (config.productName) {
      layer2Parts.push(
        `## Product Context\nYou are assisting users of ${config.productName}.${desc}`
      )
    } else {
      layer2Parts.push(`## Product Context\n${desc.trim()}`)
    }
  }

  // Tone
  if (config.tone) {
    layer2Parts.push(`## Tone\n${TONE_MAP[config.tone]}`)
  }

  // Boundaries
  if (config.boundaries && config.boundaries.length > 0) {
    const items = config.boundaries.map((b) => `- ${b}`).join('\n')
    layer2Parts.push(`## Boundaries\nYou must stay within these topic boundaries:\n${items}`)
  }

  // Document inlining
  if (config.documents && config.documents.length > 0) {
    const docs = config.documents
      .map((doc) => {
        const attrs: string[] = [`id="${doc.id}"`]
        if (doc.metadata?.source) attrs.push(`source="${doc.metadata.source}"`)
        if (doc.metadata?.title) attrs.push(`title="${doc.metadata.title}"`)
        return `<document ${attrs.join(' ')}>\n${doc.content}\n</document>`
      })
      .join('\n\n')
    layer2Parts.push(`## Reference Documents\n\n${docs}`)
  }

  if (layer2Parts.length > 0) {
    layers.push(layer2Parts.join('\n\n'))
  }

  // Layer 3 — Custom Instructions
  if (config.custom) {
    layers.push(`## Additional Instructions\n${config.custom}`)
  }

  // Layer 4 — Tour Context (optional)
  if (config.tourContext?.activeTour) {
    const { activeTour, activeStep, completedTours } = config.tourContext
    const tourParts: string[] = [
      `## Current User Context`,
      `The user is currently on step ${activeTour.currentStep + 1} of ${activeTour.totalSteps} in the "${activeTour.name}" tour.`,
    ]
    if (activeStep) {
      tourParts.push(
        `Step title: "${activeStep.title}"\nStep content: "${activeStep.content}"`
      )
    }
    tourParts.push(
      completedTours.length > 0
        ? `Previously completed tours: ${completedTours.join(', ')}`
        : 'No tours completed yet.'
    )
    layers.push(tourParts.join('\n'))
  }

  return layers.join('\n\n').trimEnd()
}
