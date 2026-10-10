# Upload validation

Verify small uploads, same-name policies and resumable large uploads.

## 1. Prerequisites

- A signed-in target NAS.
- A confirmed writable `/vol{n}/...` directory.
- An existing local regular file.

## 2. Small file

1. Create a temporary subdirectory in the confirmed writable directory.
2. Upload a local file smaller than 20 MiB:

```bash
fnos-cli file upload /vol1/1000/tmp-upload ./demo.txt --overwrite rename --yes
```

3. List the temporary directory:

```bash
fnos-cli file ls /vol1/1000/tmp-upload
```

4. Confirm the CLI reports the requested target path and the directory contains
   the matching filename.

## 3. Large file

1. Prepare a local file of at least 20 MiB.
2. Upload it:

```bash
fnos-cli file upload /vol1/1000/tmp-upload ./large.bin --overwrite rename --yes
```

3. List the directory and confirm the original filename exists remotely.
4. When diagnosing resume, inspect the upload cache in the local configuration
   directory. Its `upload_path` is the backend's `.~#n` upload path, not the final filename.
5. Resume only when endpoint, profile, signed-in user, remote target, size,
   overwrite policy and local SHA-256 all match. A different same-size file at
   the same local path must begin a new `check-upload`.
6. Concurrent uploads to the same endpoint and remote target serialize across
   processes; lock waiting does not by itself indicate corrupt cache.

## 4. Cleanup

After verifying the exact temporary paths, remove the uploaded files and directory:

```bash
fnos-cli file rm /vol1/1000/tmp-upload/demo.txt --yes
fnos-cli file rm /vol1/1000/tmp-upload/large.bin --yes
fnos-cli file rm /vol1/1000/tmp-upload --yes
```

## 5. Completion criteria

The successful output uses the requested path, and `file ls` shows the uploaded
file. Small files do not depend on resume cache. Large files may create cache;
cache paths support HTTP upload/resume and are not visible result paths.
Legacy caches, caches missing identity fields and local fingerprint mismatches
must not resume.
