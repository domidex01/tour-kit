/**
 * US-2 — dynamic / server-fetched tours keep the wide `string` step-id
 * behavior they have today. No `@ts-expect-error` needed: the type widens
 * naturally because both `TourStep` and `Tour` default their generics.
 */
import type { Tour, TourStep } from '@tour-kit/core'

// Simulating a server-fetched tour: shape known at compile time, ids are not.
const dynamicSteps: TourStep[] = JSON.parse('[]')
const dynamic: Tour = { id: 'd', steps: dynamicSteps }
void dynamic

// Explicit-widening escape hatch for authors who want the wide behavior to be
// visible in the type signature.
const widened: Tour<TourStep<string>> = dynamic
void widened

// And the inverse: a narrowed `Tour<TourStep<'a' | 'b'>>` is NOT assignable
// back to the wide `Tour` without the explicit widen — but the wide one IS
// assignable to the narrowed shape only via a cast. We don't assert that here
// (covered by step-id-narrowing); this file's purpose is purely to confirm
// the default-param path compiles.
