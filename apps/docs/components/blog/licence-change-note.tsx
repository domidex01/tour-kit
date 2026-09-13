import Link from 'next/link'

/**
 * The date Tour Kit moved from "MIT core + $99 Pro suite" to one licence
 * (BSL 1.1) with a three-tier one-time ladder.
 */
export const LICENCE_CHANGE_ISO = '2026-09-11'

/**
 * Dated note on posts written before the licence change.
 *
 * 133 published posts describe the old model — mostly in passing, inside
 * comparison paragraphs that also describe competitors' licences ("React
 * Joyride and Driver.js are both MIT"). Rewriting 868 mentions mechanically
 * would relicense competitors in our own comparison tables, and rewriting them
 * by hand would be rewriting history. One dated note is both safer and more
 * honest: the post stays as it was written, and the reader is told the model
 * moved and where the current one lives.
 *
 * Prices were corrected in place — a bare number carries no argument, and a
 * post quoting a dead price is just wrong rather than dated.
 */
export function LicenceChangeNote({ publishedAt }: { publishedAt?: string }) {
  if (publishedAt && publishedAt >= LICENCE_CHANGE_ISO) return null

  return (
    <aside className="mb-8 rounded-lg border border-amber-500/30 bg-amber-500/5 px-5 py-4 text-[14px] leading-relaxed text-fd-muted-foreground">
      <p>
        <strong className="font-semibold text-fd-foreground">
          Note — licensing changed on 11 September 2026.
        </strong>{' '}
        This post was written when Tour Kit shipped an MIT-licensed core plus a paid Pro suite.
        Every package is now source-available under BSL 1.1: free for development, evaluation,
        testing and CI, with a one-time key for production, and each published version converts to
        MIT on its Change Date. Anything below about which packages are free, or about the MIT core,
        describes the older model. See <Link href="/pricing">pricing</Link> for what applies today.
      </p>
    </aside>
  )
}
