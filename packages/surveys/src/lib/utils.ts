import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names with Tailwind CSS classes
 * Compatible with shadcn/ui cn() utility
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
