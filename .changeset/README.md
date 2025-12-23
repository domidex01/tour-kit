# Changesets

This project uses [Changesets](https://github.com/changesets/changesets) for version management.

## Adding a Changeset

When you make changes that should be released, run:

```bash
pnpm changeset
```

This will prompt you to:

1. Select which packages have changed
2. Choose the bump type (major/minor/patch)
3. Write a summary of the changes

## Releasing

Releases are automated via GitHub Actions. When changesets are merged to main:

1. A "Version Packages" PR is created/updated
2. Merging that PR triggers the release workflow
3. Packages are published to npm

## Versioning Strategy

- **Major**: Breaking changes to public API
- **Minor**: New features, non-breaking
- **Patch**: Bug fixes, documentation
