const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { readBridge } = require("./bridge.cjs");

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

// Persist acceptance independently of registry visibility so retries do not
// upload again while npm is still processing the same immutable package.
function githubReceipt(root, release, execute = run) {
  const name = "npm-publish-receipt.json";
  const expected = { schemaVersion: 1, repository: release.repository, tag: release.tag,
    packageName: release.packageName, version: release.version,
    sourceCommit: release.sourceCommit, assets: release.assets };
  const content = JSON.stringify(expected);
  function temporary(action) {
    fs.mkdirSync(path.join(root, ".tmp"), { recursive: true });
    const dir = fs.mkdtempSync(path.join(root, ".tmp", "npm-receipt-"));
    try { return action(path.join(dir, name)); }
    finally { fs.rmSync(dir, { recursive: true, force: true }); }
  }
  return {
    assertPublishOrder() {
      // npm latest can still be stale after a newer version was accepted.
      // Include receipted drafts whose Release completion has not succeeded.
      forEachRelease(release.repository, execute, (item) => {
        if (isNewerStableRelease(item, release) && (!item.draft
          || item.assets?.some((asset) => asset.name === name))) {
          throw new Error(`Release ${release.version} must be newer than accepted GitHub release ${item.tag_name}`);
        }
      });
    },
    exists() {
      const metadata = JSON.parse(execute("gh", ["release", "view", release.tag, "--repo", release.repository, "--json", "assets"]));
      if (!Array.isArray(metadata.assets)) throw new Error("Invalid release asset response");
      const matches = metadata.assets.filter((asset) => asset.name === name);
      if (!matches.length) return false;
      if (matches.length !== 1) throw new Error("Duplicate npm acceptance receipts");
      return temporary((file) => {
        execute("gh", ["release", "download", release.tag, "--repo", release.repository, "--pattern", name, "--output", file]);
        if (fs.readFileSync(file, "utf8") !== content) throw new Error("npm acceptance receipt differs from release assets");
        return true;
      });
    },
    save() {
      temporary((file) => {
        fs.writeFileSync(file, content);
        try { execute("gh", ["release", "upload", release.tag, file, "--repo", release.repository]); }
        catch { throw new Error("npm accepted the package, but saving its receipt failed; confirm registry visibility before retrying"); }
      });
    }
  };
}

function forEachRelease(repository, execute, visit) {
  for (let page = 1; ; page += 1) {
    const releases = JSON.parse(execute("gh", ["api", `repos/${repository}/releases?per_page=100&page=${page}`]));
    if (!Array.isArray(releases)) throw new Error("Invalid GitHub releases response");
    for (const item of releases) visit(item);
    if (releases.length < 100) break;
  }
}

function isNewerStableRelease(item, release) {
  if (!item || item.prerelease || !/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(item.tag_name)) return false;
  const compared = item.tag_name.slice(1).split(".").map(BigInt)
    .map((value, i) => value - BigInt(release.version.split(".")[i])).find((value) => value !== 0n) || 0n;
  return compared > 0n;
}

function completeRelease(root, directory, execute = run) {
  const release = verifyAssets(root, directory);
  if (!githubReceipt(root, release, execute).exists()) throw new Error("Missing npm acceptance receipt");
  let newer = false;
  forEachRelease(release.repository, execute, (item) => {
    if (isNewerStableRelease(item, release) && !item.draft) newer = true;
  });
  execute("gh", ["release", "edit", release.tag, "--repo", release.repository,
    "--draft=false", "--prerelease=false", `--latest=${!newer}`]);
}

function publish(root, directory, runner = spawnSync, receipt) {
  const release = verifyAssets(root, directory);
  receipt ||= githubReceipt(root, release);
  if (receipt.exists()) {
    console.log("npm acceptance already recorded for these assets; skipping publication.");
    return;
  }
  const tgz = path.join(directory, release.assets.find((asset) => asset.name.endsWith(".tgz")).name);
  const integrity = `sha512-${hash(tgz, "sha512", "base64")}`;
  const lookup = runner("npm", ["view", `${release.packageName}@${release.version}`, "--json", "--registry=https://registry.npmjs.org"], { encoding: "utf8" });
  if (registryState(lookup, release, integrity) === "published") {
    receipt.save();
    console.log("Identical npm package already published; skipping publication.");
    return;
  }
  receipt.assertPublishOrder();
  const latest = runner("npm", ["view", release.packageName, "dist-tags.latest", "--json", "--registry=https://registry.npmjs.org"], { encoding: "utf8" });
  if (latest.error || latest.status !== 0) throw new Error("Cannot verify the current npm latest version");
  const previous = JSON.parse(latest.stdout);
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(previous)) throw new Error("Expected an existing stable major.minor.patch npm version");
  const compare = release.version.split(".").map(BigInt).map((value, i) => value - BigInt(previous.split(".")[i])).find((value) => value !== 0n) || 0n;
  if (compare <= 0n) throw new Error(`Release ${release.version} must be newer than npm latest ${previous}`);
  const result = runner("npm", ["publish", tgz, "--ignore-scripts", "--access=public", "--tag=latest", "--registry=https://registry.npmjs.org"], { stdio: "inherit" });
  if (result.error || result.status !== 0) throw new Error("npm publish failed");
  receipt.save();
  console.log(`npm accepted ${release.version}; registry processing may delay availability. No post-publish registry checks are performed.`);
}

// Optional manual check after registry propagation; not part of publication.
// Fetch with a fresh cache and verify actual bytes before installation.
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

if (require.main === module) {
  try {
    const root = path.resolve(__dirname, "..");
    const directory = path.join(root, "artifacts");
    const action = process.argv[2];
    if (["publish", "complete"].includes(action) && process.env.GITHUB_ACTIONS !== "true") {
      throw new Error("Run publishing in the GitHub release-tag workflow");
    }
    if (action === "verify") verifyAssets(root, directory);
    else if (action === "smoke") smoke(root, directory);
    else if (action === "publish") publish(root, directory);
    else if (action === "complete") completeRelease(root, directory);
    else if (action === "registry-smoke") registrySmoke(root, directory);
    else throw new Error("Usage: release.cjs verify|smoke|publish|complete|registry-smoke");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { hash, readRelease, verifyAssets, registryState, publish, smoke, registrySmoke, githubReceipt, completeRelease };
