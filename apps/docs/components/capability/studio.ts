/**
 * The Tour Kit Studio — the anonymous, no-signup visual builder — is the
 * zero-friction activation wedge for the capability pages. It is NOT deployed
 * yet (usertourkit.com/builder 404s as of 2026-06-11), so every Studio CTA is
 * gated on this env var. Set `NEXT_PUBLIC_STUDIO_URL` in the deploy
 * environment (Dokploy) once the Studio ships and the "How it works" sections
 * flip from the install-first flow to the Studio flow without a code change.
 *
 * URL contract (utk-studio `STARTER_TEMPLATES` ids): `?template=<id>` —
 * the param handler is tracked as a utk-studio ticket; unknown params are
 * harmless, the link still lands on the builder.
 */
export const STUDIO_URL = process.env.NEXT_PUBLIC_STUDIO_URL

export type StudioTemplateId =
  | 'welcome-tour'
  | 'feature-checklist'
  | 'changelog-announcement'
  | 'feature-hint'

export function studioTemplateHref(template?: StudioTemplateId): string | undefined {
  if (!STUDIO_URL) return undefined
  if (!template) return STUDIO_URL
  return `${STUDIO_URL}?template=${template}`
}
