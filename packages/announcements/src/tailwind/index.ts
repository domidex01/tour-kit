import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

/**
 * Tailwind CSS plugin for @tour-kit/announcements
 * Adds announcement-specific utilities and animations
 */
export const announcementsPlugin: ReturnType<typeof plugin> = plugin(
  ({ addUtilities }) => {
    addUtilities({
      // Overlay utilities
      '.announcement-overlay': {
        position: 'fixed',
        inset: '0',
        'z-index': '50',
        'background-color': 'rgba(0, 0, 0, 0.8)',
      },
      '.announcement-overlay-blur': {
        'backdrop-filter': 'blur(4px)',
      },

      // Modal utilities
      '.announcement-modal': {
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        'z-index': '50',
        'background-color': 'var(--announcement-modal-bg, hsl(0 0% 100%))',
        border: '1px solid var(--announcement-modal-border, hsl(214.3 31.8% 91.4%))',
        'border-radius': 'var(--announcement-modal-radius, 0.5rem)',
        'box-shadow': 'var(--announcement-modal-shadow, 0 25px 50px -12px rgba(0, 0, 0, 0.25))',
        padding: '1.5rem',
      },

      // Banner utilities
      '.announcement-banner': {
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'space-between',
        gap: '1rem',
        padding: '0.75rem 1rem',
        'font-size': '0.875rem',
      },
      '.announcement-banner-top': {
        'border-bottom-width': '1px',
      },
      '.announcement-banner-bottom': {
        'border-top-width': '1px',
      },
      '.announcement-banner-sticky': {
        position: 'fixed',
        left: '0',
        right: '0',
        'z-index': '50',
      },

      // Toast utilities
      '.announcement-toast': {
        display: 'flex',
        width: '100%',
        'max-width': '24rem',
        'align-items': 'flex-start',
        gap: '0.75rem',
        'border-radius': '0.5rem',
        border: '1px solid var(--announcement-toast-border)',
        'background-color': 'var(--announcement-toast-bg)',
        padding: '1rem',
        'box-shadow': 'var(--announcement-toast-shadow)',
      },

      // Spotlight utilities
      '.announcement-spotlight-content': {
        'z-index': '50',
        width: '100%',
        'max-width': '24rem',
        'border-radius': '0.5rem',
        border: '1px solid var(--announcement-spotlight-content-border)',
        'background-color': 'var(--announcement-spotlight-content-bg)',
        padding: '1rem',
        'box-shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
    })
  },
  {
    theme: {
      extend: {
        keyframes: {
          'announcement-fade-in': {
            from: { opacity: '0' },
            to: { opacity: '1' },
          },
          'announcement-fade-out': {
            from: { opacity: '1' },
            to: { opacity: '0' },
          },
          'announcement-slide-in-from-top': {
            from: { transform: 'translateY(-100%)' },
            to: { transform: 'translateY(0)' },
          },
          'announcement-slide-in-from-bottom': {
            from: { transform: 'translateY(100%)' },
            to: { transform: 'translateY(0)' },
          },
          'announcement-slide-in-from-left': {
            from: { transform: 'translateX(-100%)' },
            to: { transform: 'translateX(0)' },
          },
          'announcement-slide-in-from-right': {
            from: { transform: 'translateX(100%)' },
            to: { transform: 'translateX(0)' },
          },
          'announcement-zoom-in': {
            from: { opacity: '0', transform: 'translate(-50%, -50%) scale(0.95)' },
            to: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
          },
          'announcement-zoom-out': {
            from: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
            to: { opacity: '0', transform: 'translate(-50%, -50%) scale(0.95)' },
          },
        },
        animation: {
          'announcement-fade-in': 'announcement-fade-in 200ms ease-out',
          'announcement-fade-out': 'announcement-fade-out 200ms ease-in',
          'announcement-slide-in-from-top': 'announcement-slide-in-from-top 300ms ease-out',
          'announcement-slide-in-from-bottom': 'announcement-slide-in-from-bottom 300ms ease-out',
          'announcement-slide-in-from-left': 'announcement-slide-in-from-left 300ms ease-out',
          'announcement-slide-in-from-right': 'announcement-slide-in-from-right 300ms ease-out',
          'announcement-zoom-in': 'announcement-zoom-in 200ms ease-out',
          'announcement-zoom-out': 'announcement-zoom-out 200ms ease-in',
        },
      },
    },
  } as Partial<Config>
)

export default announcementsPlugin
