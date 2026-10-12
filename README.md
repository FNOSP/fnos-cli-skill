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
The Agent generates an authorization link; the user authorizes in the browser and
sends the one-time code back to the Agent. Both CLI calls use the same DSH Host,
system user, configuration environment and profile; no user terminal is required.
Installation does not authenticate or authorize writes.

## Sign in with your Agent

Installation does not sign in. Tell your Agent the NAS target and profile; it runs:

```bash
npx -y --package=@fnnas-labs/fnos-cli@latest fnos-cli --profile home --host <nas-host> login --authorize-only
```

Open the link the Agent provides, sign in and approve access in your browser,
then send the one-time code back to that Agent. You do not need a terminal.
The Agent runs `login --code '<code>'` with the same connection options and
profile, then checks token persistence and a read-only request. Follow
[the OAuth guide](skills/fnos-cli/reference/oauth.md) for the complete workflow.
Codes are sensitive: chat, tool records and process arguments may retain them.
Never send passwords, access tokens or refresh tokens to an Agent.

Both login calls and later requests must use the same execution host, system
user, configuration environment and `--profile`. DSH uses its package-local
launcher for both calls without a TTY. SSH shells and containers do not
automatically share sessions. On macOS, Keychain access may require system approval.
Plain `login` remains available if you prefer manual terminal authorization.

After authorization, verify a read-only request:

```bash
fnos-cli --profile home system info
```

Start with [the fnOS Skill](skills/fnos-cli/SKILL.md).

## License

The distributed fnOS CLI binaries, Skill documentation and integration code use the [MIT License](LICENSE). Third-party components retain their respective licenses and notices. This grant does not cover the fnOS operating system or server-side services; API access remains subject to authorization and the applicable service terms. Native CLI source is not distributed in this repository. Generating this candidate does not establish release approval.
