## Subject: Testing Product Tours with Cypress: Custom Commands & A11y Checks

## Recipients:
- Cooperpress (React Status, JavaScript Weekly): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a guide on E2E testing product tours with Cypress — covering the specific patterns tours need that standard E2E strategies miss (React portals, focus trapping, localStorage state persistence, overlay z-index issues). It includes 6 reusable custom commands, cypress-axe accessibility checks, and analytics callback verification with cy.stub().

The most practical finding: the most common product tour bug is onComplete firing on skip, inflating completion rates by 15-30% in production.

Link: https://usertourkit.com/blog/cypress-test-product-tour

Thanks,
Domi
