import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider, useLocale, useT } from './index'
import type { TranslateFn } from './use-t'

function Probe({ k, vars }: { k: string; vars?: Record<string, unknown> }) {
  const t = useT()
  return <span data-testid="out">{t(k, vars)}</span>
}

function DirProbe() {
  const { direction } = useLocale()
  return <span data-testid="dir">{direction}</span>
}

function withProvider(props: {
  locale?: string
  messages?: Record<string, string>
  t?: TranslateFn
  children: ReactNode
}): ReactNode {
  return (
    <LocaleProvider locale={props.locale} messages={props.messages} t={props.t}>
      {props.children}
    </LocaleProvider>
  )
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('i18n primitives', () => {
  describe('fallback locale (no provider)', () => {
    it('returns the key itself in dev when no provider mounted and no message', () => {
      vi.stubEnv('NODE_ENV', 'development')
      render(<Probe k="hello" />)
      expect(screen.getByTestId('out')).toHaveTextContent('hello')
    })

    it('default LocaleContext has no direction set (undefined)', () => {
      render(<DirProbe />)
      // Without a provider, the default context omits direction; rendering undefined → empty
      expect(screen.getByTestId('dir').textContent).toBe('')
    })
  })

  describe('missing-key fallback', () => {
    it('returns the key in dev', () => {
      vi.stubEnv('NODE_ENV', 'development')
      render(withProvider({ messages: {}, children: <Probe k="absent" /> }))
      expect(screen.getByTestId('out')).toHaveTextContent('absent')
    })

    it('returns empty string in production', () => {
      vi.stubEnv('NODE_ENV', 'production')
      render(withProvider({ messages: {}, children: <Probe k="absent" /> }))
      expect(screen.getByTestId('out').textContent).toBe('')
    })
  })

  describe('plural — English', () => {
    const messages = { items: '{count, plural, one {# item} other {# items}}' }

    it('resolves "one" for count=1', () => {
      render(
        withProvider({ locale: 'en', messages, children: <Probe k="items" vars={{ count: 1 }} /> })
      )
      expect(screen.getByTestId('out')).toHaveTextContent('1 item')
    })

    it('resolves "other" for count=5', () => {
      render(
        withProvider({ locale: 'en', messages, children: <Probe k="items" vars={{ count: 5 }} /> })
      )
      expect(screen.getByTestId('out')).toHaveTextContent('5 items')
    })

    it('resolves "other" for count=0 when there is no =0 branch', () => {
      render(
        withProvider({ locale: 'en', messages, children: <Probe k="items" vars={{ count: 0 }} /> })
      )
      expect(screen.getByTestId('out')).toHaveTextContent('0 items')
    })
  })

  describe('plural — Russian', () => {
    const messages = {
      apples: '{count, plural, one {# яблоко} few {# яблока} many {# яблок} other {# яблока}}',
    }

    it('resolves "few" for count=2', () => {
      render(
        withProvider({ locale: 'ru', messages, children: <Probe k="apples" vars={{ count: 2 }} /> })
      )
      expect(screen.getByTestId('out')).toHaveTextContent('2 яблока')
    })

    it('resolves "many" for count=5', () => {
      render(
        withProvider({ locale: 'ru', messages, children: <Probe k="apples" vars={{ count: 5 }} /> })
      )
      expect(screen.getByTestId('out')).toHaveTextContent('5 яблок')
    })

    it('resolves "one" for count=1', () => {
      render(
        withProvider({ locale: 'ru', messages, children: <Probe k="apples" vars={{ count: 1 }} /> })
      )
      expect(screen.getByTestId('out')).toHaveTextContent('1 яблоко')
    })
  })

  describe('plural — =N exact-match precedence', () => {
    const messages = { items: '{count, plural, =0 {none} other {# items}}' }

    it('uses =0 branch over plural categories when count=0', () => {
      render(
        withProvider({ locale: 'en', messages, children: <Probe k="items" vars={{ count: 0 }} /> })
      )
      expect(screen.getByTestId('out')).toHaveTextContent('none')
    })

    it('falls through to "other" when count !== 0', () => {
      render(
        withProvider({ locale: 'en', messages, children: <Probe k="items" vars={{ count: 3 }} /> })
      )
      expect(screen.getByTestId('out')).toHaveTextContent('3 items')
    })
  })

  describe('RTL detection', () => {
    it.each([
      ['ar', 'rtl'],
      ['he', 'rtl'],
      ['fa', 'rtl'],
      ['ur', 'rtl'],
      ['he-IL', 'rtl'],
      ['en', 'ltr'],
      ['fr-CA', 'ltr'],
    ] as const)('locale %s → direction %s', (locale, expected) => {
      render(
        <LocaleProvider locale={locale}>
          <DirProbe />
        </LocaleProvider>
      )
      expect(screen.getByTestId('dir')).toHaveTextContent(expected)
    })

    it('honors explicit direction override', () => {
      render(
        <LocaleProvider locale="ar" direction="ltr">
          <DirProbe />
        </LocaleProvider>
      )
      expect(screen.getByTestId('dir')).toHaveTextContent('ltr')
    })
  })

  describe('LocaleProvider.t adapter precedence', () => {
    it('delegates every key to the adapter when provided', () => {
      const adapter: TranslateFn = (k) => `OVERRIDE-${k}`
      render(
        withProvider({
          messages: { hello: 'should be ignored' },
          t: adapter,
          children: <Probe k="anything" />,
        })
      )
      expect(screen.getByTestId('out')).toHaveTextContent('OVERRIDE-anything')
    })

    it('passes vars through to the adapter', () => {
      const adapter: TranslateFn = (k, v) => `${k}:${(v as { x?: number } | undefined)?.x ?? '?'}`
      render(withProvider({ t: adapter, children: <Probe k="foo" vars={{ x: 7 }} /> }))
      expect(screen.getByTestId('out')).toHaveTextContent('foo:7')
    })
  })

  describe('interpolate inside translate', () => {
    it('substitutes {{name}} from vars when message contains a template', () => {
      render(
        withProvider({
          messages: { greet: 'Hi {{name}}' },
          children: <Probe k="greet" vars={{ name: 'Domi' }} />,
        })
      )
      expect(screen.getByTestId('out')).toHaveTextContent('Hi Domi')
    })

    it('combines plural + interpolate', () => {
      render(
        withProvider({
          locale: 'en',
          messages: {
            msg: '{count, plural, one {Hi {{name}}, # message} other {Hi {{name}}, # messages}}',
          },
          children: <Probe k="msg" vars={{ count: 3, name: 'Domi' }} />,
        })
      )
      expect(screen.getByTestId('out')).toHaveTextContent('Hi Domi, 3 messages')
    })
  })
})
