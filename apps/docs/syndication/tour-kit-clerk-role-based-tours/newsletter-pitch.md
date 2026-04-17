## Subject: Tutorial: Role-based product tours with Clerk + Tour Kit (TypeScript)

## Recipients:
- Cooperpress (React Status, JavaScript Weekly): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a tutorial on wiring Clerk's useOrganization hook into a headless product tour library so admins, members, and custom roles each see different onboarding steps. The integration is ~50 lines of TypeScript across 3 files.

The article covers the system permissions gotcha (Clerk's 8 system permissions aren't in session claims), persisting tour state in publicMetadata, and a cost comparison showing $0/month for Clerk + open-source at 40K MAU vs $2,275/month for Auth0 equivalents.

Link: https://usertourkit.com/blog/tour-kit-clerk-role-based-tours

Thanks,
Domi
