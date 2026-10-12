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

Use the package-local launcher above for both steps in \`reference/oauth.md\`. Ask for the NAS target when unknown; reuse an existing profile's saved endpoint only when it is the intended device. Run \`login --authorize-only\` with the selected connection options and profile, share its \`authorization_url\`, and wait. The user signs in and approves access in their browser, then sends the one-time code back to the Agent. Run \`login --code <code>\` with exactly the same target, options and profile; keep the code a separately quoted argument. Do not generate another link while waiting. Resume the task only after token persistence and a read-only request succeed. The user needs no terminal. Installation and Skill loading do not log in. Keep passwords and tokens out of chat; do not repeat or separately log the user-provided code. Chat and tool records may retain it.

Both login calls are noninteractive and must run on the same DSH Host, as the same system user, with the same configuration environment (including \`TRIM_CLI_CONFIG_DIR\`) and profile as later CLI requests. This works without an interactive login TTY. SSH shell providers and containers may execute on a different host: resolve a launcher installed there and perform both authorization calls there rather than borrowing this local path or session. A remote browser only handles consent; it does not need access to CLI storage. macOS Keychain access may require the user's system approval.
`
  return ctx.skills.register({
    name: 'fnos-cli',
    source: 'runtime',
    description: 'Manage fnOS NAS files, downloads, storage, apps and system state with the package-local fnOS CLI. Use for fnOS operations and authentication guidance.',
    content: `${invocation}\n${body}`,
    resourceBase: { kind: 'directory', path: fileURLToPath(skillDirectory) },
  })
}
