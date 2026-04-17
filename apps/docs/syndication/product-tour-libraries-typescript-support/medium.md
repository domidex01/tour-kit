# Which Product Tour Libraries Actually Support TypeScript?

*We tested 8 libraries in strict mode. Only 3 compiled clean.*

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-libraries-typescript-support)*

Most product tour libraries claim TypeScript support. Fewer actually deliver it. A library can ship type definition files and still resolve your step config to `any` after a minor version bump.

We installed eight tour libraries into a Vite 6 + React 19 + TypeScript 5.7 strict-mode project and checked what works: autocomplete, generic step types, strict-mode compilation, and whether the types stay accurate across versions.

**The short version:** Only three libraries are written in TypeScript from the ground up with full strict-mode compatibility — Tour Kit, Driver.js, and Onborda. React Joyride is written in TypeScript but its Step type has regressed. Shepherd.js retrofitted types but its React wrapper breaks under strict mode. Intro.js relies on community-maintained DefinitelyTyped declarations.

## Three tiers of TypeScript support

**Native TypeScript (best DX):** The library source code is TypeScript. Types evolve with the API. Autocomplete covers every config option. Tour Kit, Driver.js, Onborda, and NextStepjs fall here.

**Own declarations (mixed results):** The source is TypeScript, but the type architecture has gaps. React Joyride is written in TypeScript, yet its Step type resolves to `any` in certain configurations.

**DefinitelyTyped (worst DX):** Types are maintained by the community, not the library author. They lag behind releases and miss API changes. Intro.js falls here.

## How to choose

The right library depends on your framework, TypeScript strictness, and whether you need generic step metadata.

For strict-mode TypeScript with generics, Tour Kit is the only library that supports typed step metadata. For vanilla JS with solid types, Driver.js ships at 5KB with zero dependencies. For Next.js App Router, Onborda and NextStepjs are both TypeScript-native.

Full comparison table, code examples, and decision framework: [usertourkit.com/blog/product-tour-libraries-typescript-support](https://usertourkit.com/blog/product-tour-libraries-typescript-support)

*Bias disclosure: We built Tour Kit. Every claim is verifiable against npm, GitHub, and bundlephobia.*

**Suggested publications:** JavaScript in Plain English, Better Programming, Bits and Pieces
