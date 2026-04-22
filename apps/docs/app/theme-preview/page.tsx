import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Theme Preview',
  robots: { index: false, follow: false },
}

export default function ThemePreview() {
  return (
    <div className="min-h-screen bg-tk-surface p-8 space-y-12">
      <header>
        <h1 className="text-4xl font-bold text-tk-on-surface">userTourKit Theme Preview</h1>
        <p className="text-tk-on-surface-variant mt-2">Blue + Gold color scheme</p>
      </header>

      {/* Brand Colors */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-tk-on-surface">Brand Colors</h2>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-tk-primary rounded-xl shadow-lg flex items-center justify-center text-white text-xs font-medium">
              Primary
            </div>
            <span className="mt-2 text-xs text-tk-on-surface-variant">#0056ff</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-tk-primary-container rounded-xl shadow-lg flex items-center justify-center text-xs font-medium">
              Container
            </div>
            <span className="mt-2 text-xs text-tk-on-surface-variant">#c6dfff</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-tk-secondary rounded-xl shadow-lg flex items-center justify-center text-black text-xs font-medium">
              Secondary
            </div>
            <span className="mt-2 text-xs text-tk-on-surface-variant">#a1790d</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-tk-tertiary rounded-xl shadow-lg flex items-center justify-center text-black text-xs font-medium">
              Tertiary
            </div>
            <span className="mt-2 text-xs text-tk-on-surface-variant">#d5ba8a</span>
          </div>
        </div>
      </section>

      {/* Surface Colors */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-tk-on-surface">Surface & Container</h2>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-tk-surface border border-tk-outline-variant rounded-xl flex items-center justify-center text-xs font-medium">
              Surface
            </div>
            <span className="mt-2 text-xs text-tk-on-surface-variant">#fbfcfe</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-tk-container rounded-xl flex items-center justify-center text-xs font-medium">
              Container
            </div>
            <span className="mt-2 text-xs text-tk-on-surface-variant">#edeef1</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-tk-container-dim rounded-xl flex items-center justify-center text-xs font-medium">
              Dim
            </div>
            <span className="mt-2 text-xs text-tk-on-surface-variant">#e2e5e9</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 border-2 border-tk-outline rounded-xl flex items-center justify-center text-xs font-medium">
              Outline
            </div>
            <span className="mt-2 text-xs text-tk-on-surface-variant">#45484d</span>
          </div>
        </div>
      </section>

      {/* Semantic Colors */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-tk-on-surface">Semantic Colors</h2>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-tk-error rounded-xl shadow-lg flex items-center justify-center text-white text-xs font-medium">
              Error
            </div>
            <span className="mt-2 text-xs text-tk-on-surface-variant">#861309</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-tk-success rounded-xl shadow-lg flex items-center justify-center text-white text-xs font-medium">
              Success
            </div>
            <span className="mt-2 text-xs text-tk-on-surface-variant">#005900</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-tk-warning rounded-xl shadow-lg flex items-center justify-center text-white text-xs font-medium">
              Warning
            </div>
            <span className="mt-2 text-xs text-tk-on-surface-variant">#835c00</span>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-tk-on-surface">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <button type="button" className="btn-primary">
            Primary
          </button>
          <button type="button" className="btn-secondary">
            Secondary
          </button>
          <button type="button" className="btn-tertiary">
            Tertiary
          </button>
          <button type="button" className="btn-outline">
            Outline
          </button>
        </div>
      </section>

      {/* Badges */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-tk-on-surface">Badges</h2>
        <div className="flex flex-wrap gap-4">
          <span className="badge-primary">Primary Badge</span>
          <span className="badge-secondary">Secondary Badge</span>
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-tk-on-surface">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-tk-container rounded-xl p-6 border border-tk-outline-variant">
            <h3 className="font-semibold text-tk-on-surface">Card Title</h3>
            <p className="text-sm text-tk-on-surface-variant mt-2">
              This is a card using container colors.
            </p>
            <button type="button" className="btn-primary mt-4">
              Action
            </button>
          </div>
          <div className="bg-tk-primary-container rounded-xl p-6">
            <h3 className="font-semibold">Accent Card</h3>
            <p className="text-sm mt-2">This card uses the primary container color.</p>
            <button type="button" className="btn-primary mt-4">
              Action
            </button>
          </div>
          <div className="bg-tk-surface rounded-xl p-6 border border-tk-secondary">
            <h3 className="font-semibold text-tk-secondary">Featured</h3>
            <p className="text-sm text-tk-on-surface-variant mt-2">
              A card with secondary accent border.
            </p>
            <button type="button" className="btn-secondary mt-4">
              Action
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
