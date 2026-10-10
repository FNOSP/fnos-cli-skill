# fnOS CLI Skill

The fnOS Skill for fnOS CLI 0.2.0. This repository contains generated
Skill documentation and reviewable integration files, not the native CLI source or binaries.

## Install the Skill

```bash
npx skills add fnnas-labs/fnos-cli-skill --skill fnos-cli -g
```

## Install the matching CLI

Node.js 18+ is required. The npm package provides both `fnos-cli` and
the compatibility command `trim-cli`; both use the same session and profile.

```bash
npx -y --package=@fnnas-labs/fnos-cli@0.2.0 fnos-cli install
fnos-cli --version
trim-cli --version
```

Use `install --project` for a project-scoped Skill, `--skill-only` to skip
the global command, or `--skip-skill` to install only the command.

## Install with DSH

After this release is published, install the public bridge into your DSH profile:

```bash
dsh plugin --profile headless add github:fnnas-labs/fnos-cli-skill#v0.2.0
```

The bridge depends on exactly `@fnnas-labs/fnos-cli@0.2.0`. Its bundle
loads `index.mjs`, which re-exports the dependency's adapter; that adapter registers
the dependency's Skill and resolves the CLI from the dependency's resource directory.
No global CLI is required for DSH commands. The checked-in `npm/dsh.mjs` is an
exact audit snapshot of the adapter in that npm release, not the runtime entry.
Installing the bundle alone is not Skill discovery: the adapter explicitly registers it.

The Agent first loads `fnos-cli`, then follows its package-local invocation instructions.
Login remains a user action in a real terminal, with the same DSH Host, system user,
configuration environment and profile. Installation does not authenticate or authorize writes.

## Sign in interactively

Installation does not sign in. In your own interactive terminal, run:

```bash
npx -y --package=@fnnas-labs/fnos-cli@0.2.0 fnos-cli --profile home --host <nas-host> login
```

Open the authorization link, sign in and approve access in your browser, then
paste the one-time code into the CLI prompt. Use `--no-open` if needed.
Never send passwords, authorization codes, access tokens or refresh tokens to an Agent.

For DSH, use a terminal on the same DSH Host, as the same system user,
with the same configuration environment and `--profile`. Remote browsers,
SSH shells and containers do not automatically share that session. On macOS,
background Keychain access may require system approval.

After authorization, verify a read-only request:

```bash
fnos-cli --profile home system info
```

Start with [the fnOS Skill](skills/fnos-cli/SKILL.md).

## License

The distributed fnOS CLI binaries, Skill documentation and integration code use the [MIT License](LICENSE). Third-party components retain their respective licenses and notices. This grant does not cover the fnOS operating system or server-side services; API access remains subject to authorization and the applicable service terms. Native CLI source is not distributed in this repository. Generating this candidate does not establish release approval.
