import { cva } from 'class-variance-authority'

export const ratingOptionVariants = cva(
  'inline-flex items-center justify-center border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-base',
        lg: 'h-12 w-12 text-lg',
      },
      style: {
        numeric: 'rounded-md font-medium',
        stars: 'rounded-full',
        emoji: 'rounded-full text-xl',
      },
      selected: {
        true: 'bg-primary text-primary-foreground border-primary',
        false:
          'bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground',
      },
    },
    defaultVariants: { size: 'md', style: 'numeric', selected: false },
  }
)

export const textInputVariants = cva(
  'flex w-full rounded-md border border-input bg-background px-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 text-sm',
        md: 'h-10 text-base',
        lg: 'h-12 text-lg',
      },
    },
    defaultVariants: { size: 'md' },
  }
)

export const selectOptionVariants = cva(
  'flex items-center gap-2 rounded-md border px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer',
  {
    variants: {
      size: {
        sm: 'py-1.5 text-sm',
        md: 'py-2 text-base',
        lg: 'py-3 text-lg',
      },
      selected: {
        true: 'bg-primary/10 border-primary text-foreground',
        false: 'bg-background border-input text-foreground hover:bg-accent',
      },
      disabled: {
        true: 'cursor-not-allowed opacity-50',
        false: '',
      },
    },
    defaultVariants: { size: 'md', selected: false, disabled: false },
  }
)

export const booleanOptionVariants = cva(
  'inline-flex items-center justify-center rounded-md border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
      selected: {
        true: 'bg-primary text-primary-foreground border-primary',
        false:
          'bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground',
      },
    },
    defaultVariants: { size: 'md', selected: false },
  }
)

export const progressBarVariants = cva('h-2 rounded-full bg-primary transition-all duration-300', {
  variants: {
    size: {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    },
  },
  defaultVariants: { size: 'md' },
})
