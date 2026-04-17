Shepherd.js has 221K weekly npm downloads. Its React wrapper is MIT-licensed.

But the core package is AGPL-3.0. AGPL cascades through dependencies.

For SaaS products where users interact over a network, the copyleft obligation kicks in. You either open-source your frontend or purchase a commercial license.

Google prohibits AGPL-licensed software internally. Many enterprise legal teams follow the same policy. FossID documented how MIT wrappers around AGPL cores create "licensing time bombs" that companies don't discover until legal review.

I wrote a step-by-step migration guide for teams replacing Shepherd.js with Tour Kit, an MIT-licensed headless React tour library at under 8KB gzipped. The guide covers converting step definitions, event callbacks, multi-page persistence, and the cleanup that removes the AGPL dependency entirely.

Full migration guide: https://usertourkit.com/blog/migrate-shepherd-js-tour-kit

Disclosure: I built Tour Kit.

#react #javascript #opensource #licensing #webdevelopment
