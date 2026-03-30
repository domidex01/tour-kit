'use client'

import {
  AlertTriangle,
  CircleDot,
  DollarSign,
  GitPullRequestDraft,
  MessageSquare,
  Terminal,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

function useStaggeredReveal(count: number) {
  const [visible, setVisible] = useState<boolean[]>(Array(count).fill(false))
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          for (let i = 0; i < count; i++) {
            setTimeout(() => {
              setVisible((prev) => {
                const next = [...prev]
                next[i] = true
                return next
              })
            }, i * 120)
          }
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [count])

  return { ref, visible }
}

/* ─── Card 1: Terminal z-index nightmare ─── */
function ZIndexCard({ show }: { show: boolean }) {
  return (
    <div
      className={`transition-all duration-500 ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
    >
      <div className="group overflow-hidden rounded-xl border border-white/[0.06] bg-[#064a84] shadow-xl transition-all hover:-translate-y-0.5 hover:border-white/[0.1] hover:shadow-2xl hover:shadow-violet-500/5">
        {/* Terminal chrome */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#0a7bdd] px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-white/30">
            <Terminal className="h-3 w-3" />
            <span>zsh</span>
          </div>
        </div>

        {/* Terminal content */}
        <div className="space-y-2.5 px-5 py-4 font-mono text-[12.5px] leading-relaxed">
          <div>
            <span className="text-emerald-400">$</span>{' '}
            <span className="text-white/70">git log --oneline -3</span>
          </div>
          <div className="space-y-0.5 text-white/40">
            <div>
              <span className="text-amber-400/60">a3f2c1d</span> fix: tooltip z-index (attempt 14)
            </div>
            <div>
              <span className="text-amber-400/60">b7e9a0c</span> fix: tooltip z-index (attempt 13)
            </div>
            <div>
              <span className="text-amber-400/60">d1c4f8e</span> fix: tooltip z-index (attempt 12)
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-2.5">
            <span className="text-emerald-400">$</span>{' '}
            <span className="text-white/70">grep -r &quot;z-index&quot; src/ | wc -l</span>
          </div>
          <div className="text-rose-400">47</div>
          <div className="flex items-center gap-2 text-white/25">
            <span className="text-emerald-400">$</span>
            <span className="inline-block h-3.5 w-1.5 animate-pulse bg-white/60" />
          </div>
        </div>

        {/* Pain label */}
        <div className="border-t border-white/[0.06] bg-rose-500/[0.06] px-5 py-3">
          <p className="flex items-center gap-2 text-[12px] font-medium text-rose-400/90">
            <AlertTriangle className="h-3.5 w-3.5" />
            3 days of z-index whack-a-mole. Tooltip still renders behind the modal.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Card 2: Bundle size bloat ─── */
function BundleSizeCard({ show }: { show: boolean }) {
  return (
    <div
      className={`transition-all duration-500 ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
    >
      <div className="group overflow-hidden rounded-xl border border-white/[0.06] bg-[#064a84] shadow-xl transition-all hover:-translate-y-0.5 hover:border-white/[0.1] hover:shadow-2xl hover:shadow-cyan-500/5">
        {/* Editor chrome */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#0a7bdd] px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-[11px] text-white/30">bundle-analysis.txt</span>
        </div>

        {/* Bundle analysis content */}
        <div className="px-5 py-4 font-mono text-[12.5px] leading-relaxed">
          <div className="mb-3 text-white/30">
            {'// '}
            <span className="text-cyan-400/70">@bundlephobia/size-report</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-white/50">react-joyride</span>
              <span className="text-amber-400">47.2 KB</span>
            </div>
            <div className="mb-1 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-amber-500/80 to-rose-500/80" />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-white/50">@tour-kit/react</span>
              <span className="text-emerald-400">7.4 KB</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-[13%] rounded-full bg-emerald-500/80" />
            </div>
          </div>

          <div className="mt-3 border-t border-white/[0.06] pt-3 text-[11px] text-white/25">
            <span className="text-rose-400/70">+47KB</span> to show 3 tooltips. Your users
            are downloading a novel.
          </div>
        </div>

        {/* Pain label */}
        <div className="border-t border-white/[0.06] bg-cyan-500/[0.06] px-5 py-3">
          <p className="flex items-center gap-2 text-[12px] font-medium text-cyan-400/90">
            <AlertTriangle className="h-3.5 w-3.5" />
            47KB for a tour library. That&apos;s heavier than React itself.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Card 3: SaaS pricing pain ─── */
function PricingCard({ show }: { show: boolean }) {
  return (
    <div
      className={`transition-all duration-500 ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
    >
      <div className="group overflow-hidden rounded-xl border border-white/[0.06] bg-[#064a84] shadow-xl transition-all hover:-translate-y-0.5 hover:border-white/[0.1] hover:shadow-2xl hover:shadow-amber-500/5">
        {/* Slack-style chrome */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#0a7bdd] px-4 py-2.5">
          <MessageSquare className="h-3.5 w-3.5 text-white/30" />
          <span className="text-[11px] text-white/30">#eng-frontend</span>
          <span className="ml-auto text-[10px] text-white/15">2:47 PM</span>
        </div>

        {/* Slack messages */}
        <div className="space-y-4 px-5 py-4 text-[13px]">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-violet-500/30 text-[9px] font-bold text-violet-300">
                PM
              </div>
              <span className="text-[12px] font-semibold text-white/60">product-manager</span>
            </div>
            <p className="text-white/50">
              Can we customize the tooltip to match our design system? The brand team is pushing back
            </p>
          </div>

          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500/30 text-[9px] font-bold text-cyan-300">
                FE
              </div>
              <span className="text-[12px] font-semibold text-white/60">frontend-dev</span>
            </div>
            <p className="text-white/50">
              Not with Appcues. We can change colors and that&apos;s about it
            </p>
          </div>

          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/30 text-[9px] font-bold text-amber-300">
                EM
              </div>
              <span className="text-[12px] font-semibold text-white/60">eng-manager</span>
            </div>
            <p className="text-white/50">
              Wait, how much are we paying for this?
            </p>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-amber-400/90">
              <DollarSign className="h-3.5 w-3.5" />
              $3,588/yr for &ldquo;change this button color&rdquo; permissions
            </div>
          </div>
        </div>

        {/* Pain label */}
        <div className="border-t border-white/[0.06] bg-amber-500/[0.06] px-5 py-3">
          <p className="flex items-center gap-2 text-[12px] font-medium text-amber-400/90">
            <AlertTriangle className="h-3.5 w-3.5" />
            $300/mo and you still can&apos;t match your own design system.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Card 4: Router migration nightmare ─── */
function RouterCard({ show }: { show: boolean }) {
  return (
    <div
      className={`transition-all duration-500 ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
    >
      <div className="group overflow-hidden rounded-xl border border-white/[0.06] bg-[#064a84] shadow-xl transition-all hover:-translate-y-0.5 hover:border-white/[0.1] hover:shadow-2xl hover:shadow-violet-500/5">
        {/* GitHub issue chrome */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#0a7bdd] px-4 py-2.5">
          <GitPullRequestDraft className="h-3.5 w-3.5 text-white/30" />
          <span className="text-[11px] text-white/30">Issue #847</span>
          <span className="ml-auto flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400">
            <CircleDot className="h-2.5 w-2.5" />
            Open
          </span>
        </div>

        {/* Issue content */}
        <div className="px-5 py-4">
          <h4 className="mb-2 text-[14px] font-semibold text-white/80">
            Onboarding tour completely broken after Next.js App Router migration
          </h4>

          <div className="space-y-2.5 text-[12.5px]">
            <p className="text-white/40">
              We migrated from Pages Router to App Router and every single tour step is broken.
              The library relies on{' '}
              <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-violet-400/80">
                window.location
              </code>{' '}
              for route matching instead of the router state.
            </p>

            <div className="rounded-lg bg-white/[0.03] px-3 py-2.5 font-mono text-[11px]">
              <div className="text-white/25">{'// What we expected to take 1 day:'}</div>
              <div className="text-white/40">
                Estimated: <span className="text-emerald-400/70">4 hours</span>
              </div>
              <div className="text-white/40">
                Actual: <span className="text-rose-400">3 weeks</span>{' '}
                <span className="text-white/20">(and counting)</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {['bug', 'routing', 'migration', 'help wanted'].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-medium text-white/35"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Pain label */}
        <div className="border-t border-white/[0.06] bg-violet-500/[0.06] px-5 py-3">
          <p className="flex items-center gap-2 text-[12px] font-medium text-violet-400/90">
            <AlertTriangle className="h-3.5 w-3.5" />
            Switched routers. Rebuilt entire onboarding from scratch.
          </p>
        </div>
      </div>
    </div>
  )
}

export function PainPoints() {
  const { ref, visible } = useStaggeredReveal(4)

  return (
    <section className="relative overflow-hidden bg-[#02182b] px-6 py-24 sm:px-8 md:py-32 lg:px-12">
      {/* Subtle gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-[#064a84] opacity-[0.15] blur-[120px]" />
        <div className="absolute -right-20 bottom-0 h-[400px] w-[400px] rounded-full bg-[#448fa3] opacity-[0.06] blur-[100px]" />
      </div>
      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div ref={ref} className="relative mx-auto max-w-6xl">
        <div className="grid gap-6 md:grid-cols-2">
          <ZIndexCard show={visible[0]} />
          <BundleSizeCard show={visible[1]} />
          <PricingCard show={visible[2]} />
          <RouterCard show={visible[3]} />
        </div>
      </div>
    </section>
  )
}
