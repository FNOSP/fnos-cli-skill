# fnOS CLI Skill

The fnOS Skill for the latest available fnOS CLI. This repository contains generated
Skill documentation and reviewable integration files, not the native CLI source or binaries.

## Install the Skill

```bash
npx skills add fnnas-labs/fnos-cli-skill --skill fnos-cli -g
```

## Install the CLI

Node.js 18+ is required. The npm package provides both `fnos-cli` and
the compatibility command `trim-cli`; both use the same session and profile.

```bash
npm install -g @fnnas-labs/fnos-cli@latest
fnos-cli --version
```

Or run without a global installation:

```bash
npx -y --package=@fnnas-labs/fnos-cli@latest fnos-cli --help
```

Existing installations do not update automatically. Repeat the installation
command to update explicitly. During npm processing, latest may still select
the previous version; check the installed version and command help.

## Install with DSH

Install the public bridge into your DSH profile:

```bash
dsh plugin --profile headless add github:fnnas-labs/fnos-cli-skill
```

The bridge requests `@fnnas-labs/fnos-cli@latest` when its dependency is resolved.
Its `index.mjs` loads the installed dependency's adapter, Skill and package-local
CLI together. No global CLI is required. Existing installations do not update
automatically; the package manager's lockfile may retain an earlier version.
Update dependencies explicitly to select a newer release. A bridge Git tag does
not pin the CLI; use an explicit npm version for reproducible installations.

The static Skill documents may be synchronized before npm finishes processing.
Check the installed version and command help before using new capabilities.
The checked-in `npm/dsh.mjs` is an audit snapshot, not the runtime entry;
the installed dependency supplies the actual adapter. DSH instructions and
OAuth commands use the actual installed package's version. Installing the bundle
alone is not Skill discovery: the adapter explicitly registers it.

The Agent first loads `fnos-cli`, then follows its package-local invocation instructions.
Login remains a user action in a real terminal, with the same DSH Host, system user,
configuration environment and profile. Installation does not authenticate or authorize writes.

## Sign in interactively

Installation does not sign in. In your own interactive terminal, run:

```bash
npx -y --package=@fnnas-labs/fnos-cli@latest fnos-cli --profile home --host <nas-host> login
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
