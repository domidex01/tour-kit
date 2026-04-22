# @tour-kit/announcements

Product announcements with five UI variants (Modal, Slideout, Banner, Toast, Spotlight),
queued by priority and gated by frequency, audience, and schedule rules.

```bash
pnpm add @tour-kit/announcements
```

## Quick start

```tsx
import { AnnouncementsProvider, AnnouncementModal } from '@tour-kit/announcements'

<AnnouncementsProvider
  announcements={[
    { id: 'welcome', variant: 'modal', title: 'Welcome', description: 'Thanks for trying us out.' },
  ]}
>
  <AnnouncementModal id="welcome" />
</AnnouncementsProvider>
```

Any registered announcement that passes its eligibility checks auto-shows on
mount. See the [Troubleshooting page](https://usertourkit.com/docs/troubleshooting)
for the opt-out and migration notes.

## Integration gotchas

- Registered announcements **auto-show** by default (since 0.1.5). Set `autoShow: false` on a config to trigger imperatively via `show(id)`.
- `frequency: 'once'` persists to `localStorage` — clearing storage (or using incognito) lets it fire again.

## Documentation

Full documentation: [https://usertourkit.com/docs/announcements](https://usertourkit.com/docs/announcements)

## License

SEE LICENSE IN LICENSE.md
