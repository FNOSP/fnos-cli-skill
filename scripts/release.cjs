const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { readBridge, copyBridge, isBridgePath } = require("./bridge.cjs");

function hash(file, algorithm = "sha256", encoding = "hex") {
  return crypto.createHash(algorithm).update(fs.readFileSync(file)).digest(encoding);
}

function readRelease(root) {
  const release = JSON.parse(fs.readFileSync(path.join(root, "release.json"), "utf8"));
  if (release.schemaVersion !== 2 || release.variant !== "fnos"
    || release.packageName !== "@fnnas-labs/fnos-cli" || release.commandName !== "fnos-cli"
    || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(release.version)
    || release.tag !== `v${release.version}` || !/^[a-f0-9]{40}$/.test(release.sourceCommit)
    || !/^[a-f0-9]{64}$/.test(release.bridgeManifestSha256)
    || release.repository !== "fnnas-labs/fnos-cli-skill") {
    throw new Error("Invalid fnOS release metadata");
  }
  const expected = [`fnnas-labs-fnos-cli-${release.version}.tgz`, "fnos-skill.zip"];
  if (!Array.isArray(release.assets) || release.assets.length !== expected.length
    || expected.some((name) => release.assets.filter((asset) => asset.name === name).length !== 1)
    || release.assets.some((asset) => !/^[a-f0-9]{64}$/.test(asset.sha256))) {
    throw new Error("Invalid release asset allowlist or checksum");
  }
  return release;
}

function verifyAssets(root, assetDirectory) {
  const release = readRelease(root);
  readBridge(root, release);
  for (const asset of release.assets) {
    const file = path.join(assetDirectory, asset.name);
    if (!fs.lstatSync(file).isFile() || hash(file) !== asset.sha256) {
      throw new Error(`Release checksum mismatch: ${asset.name}`);
    }
  }
  if (process.env.GITHUB_ACTIONS === "true"
    && (process.env.GITHUB_REPOSITORY !== release.repository || process.env.GITHUB_REF !== `refs/tags/${release.tag}`)) {
    throw new Error("Run this workflow on the matching immutable release tag");
  }
  return release;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout || result.status}`);
  return result.stdout;
}

function registryState(result, release, integrity) {
  if (result.error) throw result.error;
  if (result.status === 0) {
    const published = JSON.parse(result.stdout);
    if (published.name !== release.packageName || published.version !== release.version
      || published.dist?.integrity !== integrity) {
      throw new Error("Existing npm version has different content; never overwrite or skip it");
    }
    return "published";
  }
  let error;
  try { error = JSON.parse(result.stdout).error; } catch { /* Non-JSON failures are not a missing version. */ }
  if (error?.code === "E404") return "missing";
  throw new Error("npm lookup failed; refusing to treat an authentication or network error as a missing version");
}

function smoke(root, directory) {
  const release = verifyAssets(root, directory);
  const tgz = path.join(directory, release.assets.find((asset) => asset.name.endsWith(".tgz")).name);
  const destination = path.join(root, ".tmp", "smoke");
  fs.mkdirSync(destination, { recursive: true });
  const npmArgs = ["install", "--prefix", destination, "--ignore-scripts", "--no-audit", "--no-fund", tgz];
  if (process.platform === "win32") {
    run(process.execPath, [path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js"), ...npmArgs]);
  } else run("npm", npmArgs);
  const installed = path.join(destination, "node_modules", ...release.packageName.split("/"));
  const manifest = JSON.parse(fs.readFileSync(path.join(installed, "package.json"), "utf8"));
  if (manifest.name !== release.packageName || manifest.version !== release.version
    || JSON.stringify(manifest.bin) !== JSON.stringify({ [release.commandName]: "npm/run.cjs", "trim-cli": "npm/run.cjs" })
    || manifest.trimCliSkillName !== "fnos-cli" || manifest.cliPrimaryCommand !== release.commandName
    || manifest.license !== "MIT" || manifest.main !== "npm/dsh.mjs"
    || manifest.dsh?.bundle?.patch !== "./cordis.patch.yml"
    || manifest.repository?.url !== `git+https://github.com/${release.repository}.git`
    || manifest.private || manifest.scripts || manifest.dependencies) {
    throw new Error("Unexpected npm package identity or install behavior");
  }
  const runtime = require(path.join(installed, "npm", "package-lib.cjs"));
  runtime.validatePackagedSkill(installed, { requireAllPlatforms: true });
  const binary = runtime.resolvePackagedBinary(installed);
  for (const command of [[process.execPath, [path.join(installed, "npm", "run.cjs")]], [binary, []]]) {
    const [executable, prefix] = command;
    const version = run(executable, [...prefix, "--version"]).trim();
    if (version.split(/\r?\n/)[0] !== `${release.commandName} ${release.version}`) throw new Error(`Unexpected binary version: ${version}`);
    if (!run(executable, [...prefix, "--help"]).includes(`Usage: ${release.commandName} `)) {
      throw new Error("Incorrect command name in help output");
    }
  }
  run(process.execPath, [path.join(installed, "npm", "run.cjs"), "install", "--skill-only", "--project"], { cwd: destination });
  if (!fs.existsSync(path.join(destination, ".agents", "skills", manifest.trimCliSkillName, "SKILL.md"))) {
    throw new Error("Project Skill installation failed");
  }
}

function publish(root, directory, runner = spawnSync, {
  attempts = 31,
  wait = () => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10000)
} = {}) {
  const release = verifyAssets(root, directory);
  const tgz = path.join(directory, release.assets.find((asset) => asset.name.endsWith(".tgz")).name);
  const integrity = `sha512-${hash(tgz, "sha512", "base64")}`;
  const lookup = () => runner("npm", ["view", `${release.packageName}@${release.version}`, "--json", "--registry=https://registry.npmjs.org"], { encoding: "utf8" });
  if (registryState(lookup(), release, integrity) === "published") {
    console.log("Identical npm package already published; completing GitHub release");
    return;
  }
  const latest = runner("npm", ["view", release.packageName, "dist-tags.latest", "--json", "--registry=https://registry.npmjs.org"], { encoding: "utf8" });
  if (latest.error || latest.status !== 0) throw new Error("Cannot verify the current npm latest version");
  const previous = JSON.parse(latest.stdout);
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(previous)) throw new Error("Expected an existing stable major.minor.patch npm version");
  const compare = release.version.split(".").map(Number).map((value, i) => value - Number(previous.split(".")[i])).find((value) => value !== 0) || 0;
  if (compare <= 0) throw new Error(`Release ${release.version} must be newer than npm latest ${previous}`);
  const result = runner("npm", ["publish", tgz, "--ignore-scripts", "--access=public", "--tag=latest", "--registry=https://registry.npmjs.org"], { stdio: "inherit" });
  if (result.error || result.status !== 0) throw new Error("npm publish failed");
  // npm can accept a publish before the version appears in registry reads.
  // Retry only E404 visibility delays; authentication errors and hash drift fail closed.
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (registryState(lookup(), release, integrity) === "published") return;
    if (attempt + 1 < attempts) {
      console.log(`npm accepted ${release.version}; waiting for registry visibility (${attempt + 1}/${attempts - 1})`);
      wait();
    }
  }
  throw new Error("npm accepted the package but the version is not yet verifiable; wait for registry processing before retrying the workflow");
}

// Registry metadata alone is insufficient: fetch with a fresh cache and check
// the actual downloaded bytes before promoting the static Skill on main.
function registrySmoke(root, directory, runner = run, smokeCheck = smoke) {
  const release = verifyAssets(root, directory);
  fs.mkdirSync(path.join(root, ".tmp"), { recursive: true });
  const scratch = fs.mkdtempSync(path.join(root, ".tmp", "registry-smoke-"));
  try {
    const result = JSON.parse(runner("npm", ["pack", `${release.packageName}@${release.version}`, "--json", "--ignore-scripts",
      "--pack-destination", scratch, "--cache", path.join(scratch, "cache"), "--registry=https://registry.npmjs.org"]));
    const tgz = release.assets.find((asset) => asset.name.endsWith(".tgz"));
    if (!Array.isArray(result) || result.length !== 1 || result[0].filename !== tgz.name
      || hash(path.join(scratch, tgz.name)) !== tgz.sha256) throw new Error("Downloaded npm tarball differs from release assets");
    fs.copyFileSync(path.join(directory, "fnos-skill.zip"), path.join(scratch, "fnos-skill.zip"));
    smokeCheck(root, scratch);
  } finally { fs.rmSync(scratch, { recursive: true, force: true }); }
}

function promote(root, directory, runner = run) {
  const release = verifyAssets(root, directory);
  const names = readBridge(root, release);
  const registry = (...args) => runner("npm", ["view", ...args, "--json", "--registry=https://registry.npmjs.org"]);
  const tgz = release.assets.find((asset) => asset.name.endsWith(".tgz"));
  registryState({ status: 0, stdout: registry(`${release.packageName}@${release.version}`) }, release,
    `sha512-${hash(path.join(directory, tgz.name), "sha512", "base64")}`);
  if (JSON.parse(registry(release.packageName, "dist-tags.latest")) !== release.version) {
    console.log("This release is no longer npm latest; leaving the public bridge unchanged.");
    return false;
  }
  fs.mkdirSync(path.join(root, ".tmp"), { recursive: true });
  const temporary = fs.mkdtempSync(path.join(root, ".tmp", "bridge-promote-"));
  try {
    const checkout = path.join(temporary, "repository");
    const auth = ["-c", "credential.helper=", "-c", "credential.helper=!gh auth git-credential"];
    runner("git", [...auth, "clone", "--branch", "main", "--single-branch", `https://github.com/${release.repository}.git`, checkout]);
    const git = (...args) => runner("git", [...auth, ...args], { cwd: checkout }).trim();
    const current = JSON.parse(fs.readFileSync(path.join(checkout, "package.json"), "utf8"));
    if (current.name !== "fnos-cli-skill" || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(current.version)) throw new Error("Unexpected public bridge on main");
    const compared = current.version.split(".").map(Number).map((value, i) => value - Number(release.version.split(".")[i])).find(Boolean) || 0;
    if (compared > 0) throw new Error("Refusing to downgrade public bridge documentation");
    const tracked = git("ls-files").split("\n");
    copyBridge(root, checkout, names, tracked);
    git("add", "--", ...new Set([...names, ...tracked.filter(isBridgePath)]));
    if (!git("diff", "--cached", "--name-only")) return true;
    git("-c", "user.name=fnOS release bot", "-c", "user.email=fnos-release@users.noreply.github.com",
      "commit", "-m", `docs: publish fnOS ${release.version} Skill`);
    // Recheck after preparing the commit. Non-force push fails on concurrent
    // main changes; retry the original tag without rebuilding its artifacts.
    if (JSON.parse(registry(release.packageName, "dist-tags.latest")) !== release.version) throw new Error("npm latest changed during bridge promotion");
    git("push", "origin", "HEAD:refs/heads/main");
    return true;
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
}

if (require.main === module) {
  try {
    const root = path.resolve(__dirname, "..");
    const directory = path.join(root, "artifacts");
    const action = process.argv[2];
    if (["publish", "promote"].includes(action) && process.env.GITHUB_ACTIONS !== "true") {
      throw new Error("Run publishing and bridge promotion in the GitHub release-tag workflow");
    }
    if (action === "verify") verifyAssets(root, directory);
    else if (action === "smoke") smoke(root, directory);
    else if (action === "publish") publish(root, directory);
    else if (action === "registry-smoke") registrySmoke(root, directory);
    else if (action === "promote") promote(root, directory);
    else throw new Error("Usage: release.cjs verify|smoke|publish|registry-smoke|promote");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { hash, readRelease, verifyAssets, registryState, publish, smoke, registrySmoke, promote };
