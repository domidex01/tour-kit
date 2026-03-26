import { type VariantProps, cva } from 'class-variance-authority'

export const aiChatPanelVariants = cva(
  'rounded-lg border bg-popover text-popover-foreground shadow-lg',
  {
    variants: {
      size: {
        default: 'w-80',
        sm: 'w-64',
        lg: 'w-96',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

export type AiChatPanelVariants = VariantProps<typeof aiChatPanelVariants>

export const aiChatHeaderVariants = cva('flex items-start justify-between gap-2')

export type AiChatHeaderVariants = VariantProps<typeof aiChatHeaderVariants>

export const aiChatMessageVariants = cva('rounded-lg px-3 py-2 text-sm', {
  variants: {
    role: {
      user: 'bg-primary text-primary-foreground ml-auto max-w-[85%]',
      assistant: 'bg-muted max-w-[85%]',
    },
  },
  defaultVariants: {
    role: 'assistant',
  },
})

export type AiChatMessageVariants = VariantProps<typeof aiChatMessageVariants>

export const aiChatSuggestionChipVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer'
)

export type AiChatSuggestionChipVariants = VariantProps<typeof aiChatSuggestionChipVariants>

export const aiChatToggleVariants = cva(
  'inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105',
  {
    variants: {
      size: {
        default: 'h-12 w-12',
        sm: 'h-10 w-10',
        lg: 'h-14 w-14',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

export type AiChatToggleVariants = VariantProps<typeof aiChatToggleVariants>
