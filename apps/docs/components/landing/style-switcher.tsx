// No 'use client' directive: this module is only ever imported by client
// components (hero, demo-tour), so it inherits the client bundle. Declaring its
// own boundary would make Next treat the function `onChange` prop as a Server
// Action candidate and warn.
/* ═══════════════════════════════════════════
   Shared style presets

   Each preset is one design language. The actual
   CSS variables (`--tk-primary`, `--tk-radius`,
   `--tk-card-*`, `--tk-font`) live in globals.css
   keyed by `[data-tk-theme="<id>"]`, with `.dark`
   overrides — so the surfaces follow light/dark
   mode automatically. Here we only keep what JS
   needs: the swatch color and the labels.

   Drive a surface by putting `data-tk-theme={id}`
   on a wrapper; descendants re-skin live.
   ═══════════════════════════════════════════ */

export type StylePreset = {
  id: string
  /** Human-readable theme name, used for the a11y label + swatch tooltip. */
  label: string
  /** Swatch / accent color (matches `--tk-primary` for this theme). */
  accent: string
}

/**
 * Six distinct design languages — not just recolors. Each varies surface,
 * border weight, shadow, radius and typography (see `[data-tk-theme]` in
 * globals.css) so the tour card looks like it belongs to a completely
 * different product. That's the pitch: the library adapts to *any* style.
 */
export const STYLE_PRESETS: readonly StylePreset[] = [
  { id: 'ocean', label: 'Ocean', accent: '#0197f6' },
  { id: 'iris', label: 'Iris', accent: '#6366f1' },
  { id: 'forest', label: 'Forest', accent: '#10b981' },
  { id: 'crimson', label: 'Crimson', accent: '#ef4444' },
  { id: 'ember', label: 'Ember', accent: '#f59e0b' },
  { id: 'graphite', label: 'Graphite', accent: '#64748b' },
] as const

/** Default preset id — the brand "Ocean" blue. */
export const DEFAULT_PRESET_ID = STYLE_PRESETS[0].id

/* ═══════════════════════════════════════════
   Switcher — 6 circular swatches
   ═══════════════════════════════════════════ */

export function StyleSwitcher({
  value,
  onChange,
  className = '',
}: {
  value: string
  onChange: (presetId: string) => void
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Preview style"
      className={`inline-flex items-center gap-2.5 rounded-full border border-black/[0.05] bg-fd-card/70 px-3 py-2 shadow-elegant backdrop-blur-sm dark:border-white/[0.08] ${className}`}
    >
      <span className="select-none pr-0.5 text-[11px] font-medium uppercase tracking-wide text-fd-muted-foreground/70">
        Theme
      </span>
      {STYLE_PRESETS.map((preset) => {
        const isActive = preset.id === value
        return (
          <button
            key={preset.id}
            type="button"
            // biome-ignore lint/a11y/useSemanticElements: a styled color swatch can't be a native <input type="radio">; role="radio" inside the radiogroup is the correct ARIA pattern
            role="radio"
            aria-checked={isActive}
            aria-label={`${preset.label} theme`}
            title={preset.label}
            onClick={() => onChange(preset.id)}
            className={`relative h-5 w-5 rounded-full outline-none transition-transform duration-200 hover:scale-110 focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:ring-offset-2 focus-visible:ring-offset-fd-background ${
              isActive ? 'scale-110' : ''
            }`}
            style={{ backgroundColor: preset.accent }}
          >
            {/* Active ring — drawn in the preset's own color */}
            <span
              aria-hidden="true"
              className={`absolute -inset-1 rounded-full border-2 transition-opacity duration-200 ${
                isActive ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ borderColor: preset.accent }}
            />
          </button>
        )
      })}
    </div>
  )
}
