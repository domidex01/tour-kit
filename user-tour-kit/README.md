# user-tour-kit

A Claude Code plugin that adds 6 skills for building product tours, onboarding flows, hints, checklists, announcements, and feature adoption tracking in React or Next.js apps using the [`@tour-kit/*`](https://www.npmjs.com/org/tour-kit) npm packages.

Works with Claude Code, Cursor, Cline, and any tool that supports the [Agent Skills](https://agentskills.io) open standard.

**Alternative to:** asking Claude to invent its own onboarding implementation, or hand-pasting docs from Shepherd.js / Driver.js / Reactour / Appcues / Userpilot / Pendo into every new chat.

## Install

### Claude Code (recommended)

```text
/plugin marketplace add domidex01/tour-kit
/plugin install user-tour-kit@user-tour-kit
```

The marketplace catalog lives at `.claude-plugin/marketplace.json` in the [domidex01/tour-kit](https://github.com/domidex01/tour-kit) repo root. Once installed, all 6 skills appear in `/help` under the `user-tour-kit:` namespace.

### Local development

```bash
git clone https://github.com/domidex01/tour-kit
claude --plugin-dir ./tour-kit/user-tour-kit
```

## Skills

| Skill | Triggers on |
|---|---|
| `/user-tour-kit:add-product-tour` | "add a tour", "user tour", "onboarding walkthrough", "guided tour", "step-by-step intro", "FTUE" |
| `/user-tour-kit:add-onboarding-checklist` | "onboarding checklist", "getting-started panel", "task list with progress", "Stripe-style activation" |
| `/user-tour-kit:add-product-announcement` | "what's new modal", "in-app changelog", "promotional banner", "feature spotlight", "welcome popup" |
| `/user-tour-kit:add-feature-hint` | "hotspot", "beacon", "pulsing dot", "single tooltip", "new feature badge", "feature discovery" |
| `/user-tour-kit:add-adoption-tracking` | "feature adoption", "feature usage tracking", "find unused features", "Pendo-style adoption" |
| `/user-tour-kit:add-ai-tour-assistant` | "AI onboarding chat", "tour copilot", "ChatGPT-style tour helper", "RAG over docs for onboarding" |

Each skill installs the right `@tour-kit/*` package(s), wires up the provider, and shows a minimal working example with notes on Next.js App Router, headless usage, persistence, and common gotchas.

## How it works

When you mention any of the trigger phrases in Claude Code, Claude matches the description in the corresponding `SKILL.md`, loads its body into context, and follows the recipe. You can also invoke a skill directly with `/user-tour-kit:<skill-name>`.

Plugin skills are namespaced (always prefixed with `user-tour-kit:`) so they never conflict with other plugins.

## Links

- Website & docs: https://usertourkit.com
- npm scope: https://www.npmjs.com/org/tour-kit
- Source: https://github.com/domidex01/tour-kit
- Issues: https://github.com/domidex01/tour-kit/issues

## License

MIT — see [LICENSE](https://github.com/domidex01/tour-kit/blob/main/LICENSE) in the root repo.
