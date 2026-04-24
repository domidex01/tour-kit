'use client'

import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useId, useState } from 'react'

type FormState = 'idle' | 'sending' | 'sent' | 'error' | 'rate-limited'

export function EmailPortalForm() {
  const inputId = useId()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<FormState>('idle')

  async function submit() {
    if (state === 'sending') return
    setState('sending')
    try {
      const res = await fetch('/api/account/portal', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) setState('sent')
      else if (res.status === 429) setState('rate-limited')
      else setState('error')
    } catch {
      setState('error')
    }
  }

  if (state === 'sent') {
    return (
      <div
        aria-live="polite"
        className="mt-10 mx-auto max-w-md rounded-lg border border-fd-border bg-fd-card px-6 py-5 text-left"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" aria-hidden="true" />
          <div>
            <p className="mb-1 text-[15px] font-semibold text-fd-foreground">Check your inbox</p>
            <p className="text-[13.5px] leading-[1.6] text-fd-muted-foreground">
              We just sent a secure sign-in link to{' '}
              <span className="font-medium text-fd-foreground">{email}</span>. The link is
              single-use — open it on the device where you want to manage your license.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="mt-10 flex flex-col items-center gap-3"
    >
      <label htmlFor={inputId} className="sr-only">
        Email address
      </label>
      <input
        id={inputId}
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={state === 'sending'}
        aria-invalid={state === 'error' || state === 'rate-limited' || undefined}
        aria-describedby={
          state === 'error' || state === 'rate-limited' ? `${inputId}-status` : undefined
        }
        className="w-full max-w-sm rounded-md border border-fd-border bg-fd-background px-3 py-2 text-[14px] text-fd-foreground placeholder:text-fd-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={state === 'sending'}
        className="inline-flex items-center gap-2 rounded-md bg-fd-primary px-6 py-3 text-[15px] font-semibold text-fd-primary-foreground transition-colors hover:bg-fd-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
        {state !== 'sending' && <ArrowRight className="size-4" aria-hidden="true" />}
      </button>
      <p
        aria-live="polite"
        id={`${inputId}-status`}
        className="min-h-[1.2em] text-[13px] text-fd-muted-foreground"
      >
        {state === 'error'
          ? 'Something went wrong — please try again in a moment.'
          : state === 'rate-limited'
            ? 'Too many requests from this email — please wait an hour and try again.'
            : 'We never show your license keys on this page — they only live in Polar.'}
      </p>
    </form>
  )
}
