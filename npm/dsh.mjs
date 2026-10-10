import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const name = 'fnos-cli'
export const inject = ['skills']

export function apply(ctx) {
  const skillDirectory = new URL('../skill/', import.meta.url)
  const metadata = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  const markdown = readFileSync(new URL('SKILL.md', skillDirectory), 'utf8')
  const body = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim()
  const invocation = `## DSH package-local invocation

1. Resolve \`../npm/run.cjs\` against the base directory returned by this Skill. This is the launcher shipped with this Skill's npm package, version ${metadata.version}.
2. In the local DSH Host shell, run \`node "<resolved-launcher>" <arguments>\`. Replace every \`fnos-cli\` or \`trim-cli\` command prefix in this Skill and its references with that invocation. Quote the resolved path and each argument for the active shell (Bash or PowerShell), including spaces, apostrophes and shell metacharacters. Keep each argument separate. The launcher's path is outside the workspace and does not require changing the working directory.
3. Begin with \`--version\` or \`--help\`, then use the requested read-only command and the chosen \`--profile\`. This entry does not require a global CLI installation and never adds \`--yes\` for you. Only include \`--yes\` after the user explicitly authorizes the corresponding write.

### First login or an expired session

For a new profile, ask the user to run \`npx -y --package=@fnnas-labs/fnos-cli@${metadata.version} fnos-cli login --profile <profile> --host <nas-host> --port <port>\` in their real terminal. Use the user's chosen NAS host and port; ask when unknown instead of assuming localhost. An existing profile may reuse its saved endpoint by omitting the host/port options unless the user chooses another device. The terminal must be on the same DSH Host, as the same system user, with the same configuration environment (including \`TRIM_CLI_CONFIG_DIR\`) and profile as the CLI invocation. The user completes browser authorization and enters the code in that terminal. Resume the requested read-only command only after the user confirms login. Installation and Skill loading do not log in. Keep passwords and authorization codes in the user's terminal; do not request or submit them through Agent tools.

The default one-shot DSH shell has no interactive login TTY. A remote browser does not share the DSH Host's session. SSH shell providers and containers may execute on a different host with different files and sessions: ask the user to install and log in in the actual execution environment before proceeding; this local package path must only be used on the host where this package is installed. macOS Keychain access may require the user's system approval.
`
  return ctx.skills.register({
    name: 'fnos-cli',
    source: 'runtime',
    description: 'Manage fnOS NAS files, downloads, storage, apps and system state with the package-local fnOS CLI. Use for fnOS operations and authentication guidance.',
    content: `${invocation}\n${body}`,
    resourceBase: { kind: 'directory', path: fileURLToPath(skillDirectory) },
  })
}
