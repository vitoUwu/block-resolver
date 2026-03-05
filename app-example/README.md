# app-example

Reference installable app used by `example`.

## Purpose

- Demonstrates an installable app `mod.ts` contract.
- Demonstrates app-level secret handling (`encrypt` action + `encrypted` loader).
- Exposes reusable loaders/actions that can be invoked by site blocks.

## Files

- `mod.ts`: app entrypoint (`App(state) => { manifest, state, init }`)
- `loaders/encrypted.ts`: secret resolver with env override/decrypt behavior
- `loaders/current-token.ts`: returns installed app token from context
- `actions/secrets/encrypt.ts`: encrypt helper action (`{ value } -> { value }`)
- `utils/crypto.ts`: AES-GCM crypto helpers and key management
- `manifest.gen.ts`, `manifest.types.gen.ts`: generated resolver registry/types

## State contract

`State` is defined in `mod.ts`:

- `apiBaseUrl: string`
- `token: string | secret-like | resolvable reference`

`token` is resolved before `init`, and `init` builds:

- `ctx.appExample.token`
- `ctx.appExample.client`
- `ctx.appExample.state.startedAt`
- `ctx.client` (convenience alias)

## Coding guidelines

- Keep API clients and cross-resolver dependencies in `init`, not duplicated in
  each loader/action.
- Use `loaders/encrypted.ts` for sensitive configuration.
- Prefer nested resolvables in install block props for dynamic values.
- Return clear errors in `init` when required config cannot be resolved.
- Keep resolver IDs stable to avoid breaking existing `.blocks` references.

## Installation in site

This app is installed by the site (`example`) using:

1. `example/apps/app-example.ts` export bridge
2. `example/.blocks/app-example.json` with `resolverId: "core/apps/app-example"`
3. `example/block-resolver.app.json` with `"apps": ["app-example"]`
