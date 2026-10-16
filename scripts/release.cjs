const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { regularFile, readBridge } = require("./bridge.cjs");
const { product, assetNames } = require("./products.cjs");

function hash(file, algorithm = "sha256", encoding = "hex") {
  return crypto.createHash(algorithm).update(fs.readFileSync(file)).digest(encoding);
}

function readRelease(root) {
  const release = JSON.parse(fs.readFileSync(path.join(root, "release.json"), "utf8"));
  const id = product(release.variant);
  if (release.schemaVersion !== 2
    || release.packageName !== id.packageName || release.commandName !== id.commandName
    || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(release.version)
    || release.tag !== `v${release.version}` || !/^[a-f0-9]{40}$/.test(release.sourceCommit)
    || !/^[a-f0-9]{64}$/.test(release.bridgeManifestSha256)
    || release.repository !== id.repository) {
    throw new Error("Invalid release metadata");
  }
  const expected = assetNames(id, release.version);
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
  const names = ["candidate.json", "gate.json", "darwin.json", "linux.json", "win32.json"];
  if (!release.evidenceSha256 || Object.keys(release.evidenceSha256).length !== names.length) throw new Error("Missing release evidence hashes");
  for (const name of names) {
    if (hash(regularFile(root, `evidence/${name}`)) !== release.evidenceSha256[name]) throw new Error(`Release evidence checksum mismatch: ${name}`);
  }
  const gate = require(path.join(root, "scripts", "candidate-smoke-evidence.cjs")).verifyGate(
    path.join(root, "evidence/candidate.json"), path.join(root, "evidence/gate.json"),
    ["darwin", "linux", "win32"].map(os => path.join(root, `evidence/${os}.json`)), {requireCI:true});
  const candidate = gate.candidate;
  if (candidate.mode !== "tagged" || candidate.sourceTag !== release.tag || candidate.sourceCommit !== release.sourceCommit
    || candidate.variant !== release.variant || candidate.packageName !== release.packageName || candidate.repository !== release.repository
    || candidate.version !== release.version || JSON.stringify(candidate.assets) !== JSON.stringify(release.assets)) {
    throw new Error("Release evidence belongs to a different candidate");
  }
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
  const id = product(release.variant);
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
    || JSON.stringify(manifest.bin) !== JSON.stringify({ [release.commandName]: "npm/run.cjs" })
    || manifest.trimCliSkillName !== id.commandName || manifest.cliPrimaryCommand !== release.commandName
    || manifest.license !== "MIT"
    || (id.dsh ? (manifest.main !== "npm/dsh.mjs" || manifest.dsh?.bundle?.patch !== "./cordis.patch.yml") : (manifest.main || manifest.dsh))
    || manifest.repository?.url !== `git+https://github.com/${release.repository}.git`
    || manifest.private || manifest.scripts || manifest.dependencies) {
    throw new Error("Unexpected npm package identity or install behavior");
  }
  const runtime = require(path.join(installed, "npm", "package-lib.cjs"));
  runtime.validatePackagedSkill(installed, { requireAllPlatforms: true });
  const binary = runtime.resolvePackagedBinary(installed);
  const nativeOptions = {env:{...process.env, TRIM_CLI_DISTRIBUTION:release.variant}};
  for (const command of [[process.execPath, [path.join(installed, "npm", "run.cjs")]], [binary, []]]) {
    const [executable, prefix] = command;
    const version = run(executable, [...prefix, "--version"], nativeOptions).trim();
    if (version.split(/\r?\n/)[0] !== `${release.commandName} ${release.version}`) throw new Error(`Unexpected binary version: ${version}`);
    if (!run(executable, [...prefix, "--help"], nativeOptions).includes(`Usage: ${release.commandName} `)) {
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
  const expected = { schemaVersion: 2, releaseSha256: hash(path.join(root, "release.json")),
    bridgeManifestSha256: release.bridgeManifestSha256, evidenceSha256: release.evidenceSha256, repository: release.repository, tag: release.tag,
    packageName: release.packageName, version: release.version,
    sourceCommit: release.sourceCommit, assets: release.assets };
  const content = JSON.stringify(expected);
  function temporary(action, filename = name) {
    fs.mkdirSync(path.join(root, ".tmp"), { recursive: true });
    const dir = fs.mkdtempSync(path.join(root, ".tmp", "npm-receipt-"));
    try { return action(path.join(dir, filename)); }
    finally { fs.rmSync(dir, { recursive: true, force: true }); }
  }
  const attemptName = "npm-publish-attempt.json";
  const attemptContent = JSON.stringify({kind:"npm-publish-attempt", candidate:expected});
  function exists(filename, bytes) {
    const metadata = JSON.parse(execute("gh", ["release", "view", release.tag, "--repo", release.repository, "--json", "assets"]));
    if (!Array.isArray(metadata.assets)) throw new Error("Invalid release asset response");
    const matches = metadata.assets.filter(asset => asset.name === filename);
    if (!matches.length) return false;
    if (matches.length !== 1) throw new Error("Duplicate npm acceptance receipts or attempts");
    return temporary(file => {
      execute("gh", ["release", "download", release.tag, "--repo", release.repository, "--pattern", filename, "--output", file]);
      if (fs.readFileSync(file, "utf8") !== bytes) throw new Error("npm acceptance receipt differs from release assets or attempt identity");
      return true;
    }, filename);
  }
  return {
    attemptExists() { return exists(attemptName, attemptContent); },
    begin() {
      temporary(file => {
        fs.writeFileSync(file, attemptContent);
        // Failure (including a lost response) never permits uploading to npm.
        execute("gh", ["release", "upload", release.tag, file, "--repo", release.repository]);
      }, attemptName);
    },
    hasNewerPublication() {
      let newer = false;
      // npm latest can still be stale after a newer version was accepted.
      // Include uncertain attempts too: npm may have accepted them already.
      forEachRelease(release.repository, execute, (item) => {
        if (isNewerStableRelease(item, release) && (!item.draft
          || item.assets?.some((asset) => asset.name === name || asset.name === attemptName))) {
          newer = true;
        }
      });
      return newer;
    },
    exists() { return exists(name, content); },
    save() {
      temporary((file) => {
        fs.writeFileSync(file, content);
        try { execute("gh", ["release", "upload", release.tag, file, "--repo", release.repository]); }
        catch {
          // Upload may have succeeded even if its response was lost. Exact
          // remote bytes suffice; never overwrite or poll npm after acceptance.
          try { if (exists(name, content)) return; } catch { /* Preserve uncertain acceptance. */ }
          throw new Error("npm accepted the package, but saving its receipt failed; retain the attempt and reconcile acceptance before retrying");
        }
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
  const receipt = githubReceipt(root, release, execute);
  if (!receipt.exists()) throw new Error("Missing npm acceptance receipt");
  const newer = receipt.hasNewerPublication();
  execute("gh", ["release", "edit", release.tag, "--repo", release.repository,
    "--draft=false", "--prerelease=false", `--latest=${!newer}`]);
  console.log(`Publication complete: ${release.packageName}@${release.version}; npm acceptance recorded and GitHub Release completed.`);
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
  const attempted = receipt.attemptExists();
  const lookup = runner("npm", ["view", `${release.packageName}@${release.version}`, "--json", "--registry=https://registry.npmjs.org"], { encoding: "utf8" });
  if (registryState(lookup, release, integrity) === "published") {
    receipt.save();
    console.log("Identical npm package already published; skipping publication.");
    return;
  }
  if (attempted) throw new Error("Uncertain previous publication: an immutable attempt exists without acceptance receipt; do not upload again while registry visibility is unresolved");
  const newerAccepted = receipt.hasNewerPublication();
  const latest = runner("npm", ["view", release.packageName, "dist-tags.latest", "--json", "--registry=https://registry.npmjs.org"], { encoding: "utf8" });
  if (!latest.error && latest.status !== 0) {
    let failure;
    try { failure = JSON.parse(latest.stdout).error; } catch { /* Not a registry absence. */ }
    if (failure?.code === "E404") throw new Error(`First publication requires explicit bootstrap for ${release.packageName}; retain these exact assets, complete scope/2FA setup and acceptance before retrying. No npm publish was attempted.`);
  }
  if (latest.error || latest.status !== 0) throw new Error("Cannot verify the current npm latest version");
  const previous = JSON.parse(latest.stdout);
  if (previous === "0.0.0-stage") throw new Error("First publication bootstrap awaits stage approval; never directly publish a version already reserved by staging");
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(previous)) throw new Error("Expected an existing stable major.minor.patch npm version");
  const compare = release.version.split(".").map(BigInt).map((value, i) => value - BigInt(previous.split(".")[i])).find((value) => value !== 0n) || 0n;
  if (compare === 0n) throw new Error("npm latest already references this version but its exact bytes are unavailable; reconcile acceptance before retrying");
  let publicationTag = "latest";
  if (compare < 0n || newerAccepted) {
    publicationTag = `release-v${release.version}`;
    const tags = runner("npm", ["view", release.packageName, "dist-tags", "--json", "--registry=https://registry.npmjs.org"], {encoding:"utf8"});
    if (tags.error || tags.status !== 0) throw new Error("Cannot verify npm dist-tags for historical catch-up");
    const existingTags = JSON.parse(tags.stdout);
    if (!existingTags || typeof existingTags !== "object" || Array.isArray(existingTags)
      || (existingTags[publicationTag] !== undefined && existingTags[publicationTag] !== release.version)) {
      throw new Error("Historical publication tag already points to different content; never overwrite it");
    }
  }
  receipt.begin();
  const result = runner("npm", ["publish", tgz, "--ignore-scripts", "--access=public", `--tag=${publicationTag}`, "--registry=https://registry.npmjs.org"], { stdio: "inherit" });
  if (result.error || result.status !== 0) throw new Error("npm publish failed; the durable attempt is retained because acceptance may be uncertain");
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
    fs.copyFileSync(path.join(directory, `${release.variant}-skill.zip`), path.join(scratch, `${release.variant}-skill.zip`));
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
