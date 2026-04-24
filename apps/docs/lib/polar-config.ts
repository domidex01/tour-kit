export const POLAR_CHECKOUT_URL =
  process.env.NEXT_PUBLIC_POLAR_CHECKOUT_URL ??
  'https://buy.polar.sh/polar_cl_L7PUGpf0vnEZflbnGzHtDDMMahVxbYM6jBu2E4fflrZ'

// Polar-hosted customer portal. Customers sign in with the email they used to
// purchase; Polar mails them a one-time code. Set NEXT_PUBLIC_POLAR_PORTAL_URL
// to your org's portal, e.g. https://polar.sh/<your-org-slug>/portal.
export const POLAR_PORTAL_URL = process.env.NEXT_PUBLIC_POLAR_PORTAL_URL ?? 'https://polar.sh/login'
