/**
 * Compile-time key-coverage parity between `TourDefinition`, the inferred
 * type from `tourDefinitionSchema`, and a hand-authored JSON-safe key set.
 *
 * When `Tour` gains a JSON-safe field, the maintainer MUST update three
 * places — the union below, `TourDefinition`, and the schema. Any two of
 * three falling out of sync fails one of the `AssertExact` assertions and
 * breaks `pnpm --filter @tour-kit/core typecheck:types`.
 *
 * NOTE: We deliberately do NOT assert `Tour ≡ z.infer<typeof schema>` —
 * `Tour.target` is `string | RefObject<HTMLElement>` (runtime), but the
 * schema's `target` is `string` only (refs aren't JSON-serializable). The
 * parity contract is key-set equality, not full type equality.
 */

import type { z } from 'zod'
import type { TourDefinition, TourStepDefinition } from '../../../types/tour-definition'
import type { tourStepDefinitionSchema } from '../step.schema'
import type { tourDefinitionSchema } from '../tour.schema'

// Hand-authored JSON-safe key sets — the contract.
type TourJsonSafeKeys = 'id' | 'steps' | 'audience' | 'autoStart' | 'startAt'
type TourStepJsonSafeKeys =
  | 'id'
  | 'kind'
  | 'target'
  | 'title'
  | 'description'
  | 'content'
  | 'audience'
  | 'placement'

// Strict bidirectional key-set equality.
type AssertExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false

// TourDefinition / TourStepDefinition keys must match the contract.
const _tdKeys: AssertExact<keyof TourDefinition, TourJsonSafeKeys> = true
const _stKeys: AssertExact<keyof TourStepDefinition, TourStepJsonSafeKeys> = true

// Schema-inferred type keys must ALSO match the contract.
type SchemaTour = z.infer<typeof tourDefinitionSchema>
type SchemaStep = z.infer<typeof tourStepDefinitionSchema>
const _schTourKeys: AssertExact<keyof SchemaTour, TourJsonSafeKeys> = true
const _schStepKeys: AssertExact<keyof SchemaStep, TourStepJsonSafeKeys> = true

// Drift detector — proves `AssertExact` catches a missing key.
// @ts-expect-error intentional — `'id' | 'steps'` is missing keys; assertion must fail.
const _drift: AssertExact<keyof TourDefinition, 'id' | 'steps'> = true

void _tdKeys
void _stKeys
void _schTourKeys
void _schStepKeys
void _drift
