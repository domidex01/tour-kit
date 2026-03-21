import { generateText } from 'ai'
import type { LanguageModel } from 'ai'

// NOTE: This file is server-only. It uses generateText which requires server-side execution.

export interface GenerateSuggestionsOptions {
  /** Recent messages for context */
  messages: Array<{ role: string; content: string }>
  /** AI SDK model instance */
  model: LanguageModel
  /** Product name for context in the prompt */
  productName?: string
  /** Number of suggestions to generate (default: 3) */
  count?: number
}

export async function generateSuggestions(options: GenerateSuggestionsOptions): Promise<string[]> {
  const { messages, model, productName, count = 3 } = options

  if (messages.length === 0) {
    return []
  }

  // Build conversation summary from recent messages (last 6 messages max)
  const recentMessages = messages.slice(-6)
  const conversationContext = recentMessages.map((m) => `${m.role}: ${m.content}`).join('\n')

  const productContext = productName ? ` about ${productName}` : ''

  const prompt = [
    `Based on this conversation${productContext}, suggest exactly ${count} natural follow-up questions the user might want to ask next.`,
    '',
    'Conversation:',
    conversationContext,
    '',
    'Rules:',
    '- Return ONLY the questions, one per line',
    '- Do NOT number them or add bullet points',
    '- Keep questions concise (under 60 characters)',
    '- Questions should be diverse and relevant',
    '- Do NOT repeat topics already covered in the conversation',
  ].join('\n')

  try {
    const { text } = await generateText({
      model,
      prompt,
    })

    return parseSuggestions(text, count)
  } catch {
    return []
  }
}

/** Parse LLM response into clean suggestion strings */
export function parseSuggestions(text: string, count: number): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .map((line) => line.replace(/^\d+[.)]\s*/, '')) // strip "1. " or "1) " prefixes
    .map((line) => line.replace(/^[-*]\s*/, '')) // strip "- " or "* " prefixes
    .map((line) => line.replace(/^["']|["']$/g, '')) // strip surrounding quotes
    .filter((line) => line.length > 0)
    .slice(0, count)
}
