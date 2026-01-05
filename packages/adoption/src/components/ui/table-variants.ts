import { type VariantProps, cva } from 'class-variance-authority'

/**
 * Table container variants
 * Used by AdoptionTable component
 */
export const adoptionTableVariants = cva('rounded-md border', {
  variants: {
    size: {
      default: '',
      compact: 'text-sm',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

export type AdoptionTableVariants = VariantProps<typeof adoptionTableVariants>

/**
 * Table header cell variants
 */
export const adoptionTableHeaderCellVariants = cva('text-left text-sm font-medium', {
  variants: {
    padding: {
      default: 'px-4 py-3',
      compact: 'px-3 py-2',
    },
  },
  defaultVariants: {
    padding: 'default',
  },
})

export type AdoptionTableHeaderCellVariants = VariantProps<typeof adoptionTableHeaderCellVariants>

/**
 * Table row variants
 */
export const adoptionTableRowVariants = cva('border-b transition-colors', {
  variants: {
    hover: {
      true: 'hover:bg-muted/50',
      false: '',
    },
  },
  defaultVariants: {
    hover: true,
  },
})

export type AdoptionTableRowVariants = VariantProps<typeof adoptionTableRowVariants>

/**
 * Table cell variants
 */
export const adoptionTableCellVariants = cva('', {
  variants: {
    padding: {
      default: 'px-4 py-3',
      compact: 'px-3 py-2',
    },
    variant: {
      default: '',
      muted: 'text-sm text-muted-foreground',
    },
  },
  defaultVariants: {
    padding: 'default',
    variant: 'default',
  },
})

export type AdoptionTableCellVariants = VariantProps<typeof adoptionTableCellVariants>

/**
 * Table empty state variants
 */
export const adoptionTableEmptyVariants = cva('text-center text-muted-foreground', {
  variants: {
    padding: {
      default: 'px-4 py-8',
      compact: 'px-3 py-6',
    },
  },
  defaultVariants: {
    padding: 'default',
  },
})

export type AdoptionTableEmptyVariants = VariantProps<typeof adoptionTableEmptyVariants>
