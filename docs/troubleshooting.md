# Troubleshooting

Use this when a `task` command printed an error with a `docs:` link, or something in the pack misbehaves. Every error from the scripts links to a section below. Start with `task doctor`: it checks your tools, `pakku.jar`, the Prism instance, mod sides and override paths in one go.

Each entry is symptom, cause, fix.

## Setup and tools

### Tool missing

- Symptom: `<tool> was not found` or `<tool> not found on PATH`.
- Cause: a required program (java, node, pnpm, task, git, docker) is not installed or not on `PATH`.
- Fix: run `mise install` in the repo (the toolchain is pinned in `mise.toml`), open a new terminal, then `task doctor`. Docker is separate: install Docker Desktop for the `server:` tasks.

### Missing tool

- Symptom: `<tool> not found on PATH` from `task doctor`, or `task --list-all --json` failed during `task check`.
- Cause: a required program is not installed or not on `PATH` (same cause as [tool missing](#tool-missing)).
- Fix: `mise install`, open a new terminal, `task doctor`.

### Java version

- Symptom: `Java 21+ is required` or `Java 21+ required (found …)`.
- Cause: an older or missing JDK is first on `PATH`.
- Fix: `mise install`, new terminal, `task doctor`. Pakku needs Java 21.

### Node version

- Symptom: `Node 26+ required`.
- Cause: the scripts run TypeScript directly through Node 26.
- Fix: `mise install`, new terminal, `task doctor`.

### Setup env

- Symptom: `PAKKU_VERSION is not set` / `PAKKU_SHA256 not set`.
- Cause: the script was run with `node scripts/...` instead of through `task`. The pinned Pakku version and SHA-256 live in the `Taskfile.yml` vars.
- Fix: run `task setup` or `task doctor`.

### Repo root not found

- Symptom: `Could not find pakku.json in any parent directory`.
- Cause: the command ran outside the repository.
- Fix: `cd` into the repo (the folder that contains `pakku.json`) and retry.

### Hooks install

- Symptom: `git config core.hooksPath failed`.
- Cause: the folder is not a git checkout (for example a downloaded zip).
- Fix: use a `git clone`, then `task hooks:install`.

## Pakku

### Pakku missing

- Symptom: `pakku.jar not found`.
- Cause: `pakku.jar` is not committed; `task setup` downloads it.
- Fix: `task setup`.

### Pakku jar

- Symptom: `pakku.jar is missing` or `pakku.jar hash differs from the pinned one` (from `task doctor`).
- Cause: the file is absent, partial, or a different Pakku version than the one pinned in `Taskfile.yml`.
- Fix: `task setup` re-downloads and verifies it.

### Pakku download

- Symptom: `Failed to download Pakku`.
- Cause: no network, a proxy, or GitHub is unreachable.
- Fix: check the connection and retry `task setup`. The URL is in the error.

### Pakku checksum

- Symptom: `pakku.jar checksum mismatch`.
- Cause: the download was corrupted, or the release asset no longer matches `PAKKU_SHA256`.
- Fix: retry `task setup`. If it persists, do not bypass it: verify the asset and update `PAKKU_VERSION` and `PAKKU_SHA256` together in `Taskfile.yml`.

### Pakku fetch

- Symptom: `pakku fetch failed` during `task setup`.
- Cause: a mod file could not be downloaded (network, removed version, or a CurseForge-sourced mod without an API key).
- Fix: read the Pakku output above the error. Retry. For CurseForge-only mods see [mod-not-on-modrinth](guides/mod-not-on-modrinth.md).

### Pakku lock invalid

- Symptom: `pakku-lock.json has no Minecraft version or loader`.
- Cause: the lock was edited by hand or damaged by a merge.
- Fix: `git checkout pakku-lock.json`, then re-apply your changes with `task mods:add` / `task mods:rm`. See [lockfile-merge-conflict](guides/lockfile-merge-conflict.md).

### Pakku config invalid

- Symptom: `pakku.json` is unreadable, not valid JSON, or has an unexpected shape.
- Cause: a hand-edit left a syntax error (trailing comma, missing quote) or a wrong field type.
- Fix: restore it with `git checkout pakku.json` or fix the JSON, then `task doctor`.

### Mods usage

- Symptom: a `mods:` task prints a usage error.
- Cause: missing `--` before the arguments, or no slug given.
- Fix: `task mods:add -- sodium`. Use `task mods:find -- <query>` to look up slugs.

### Mods pakku failed

- Symptom: `pakku add … failed`, `pakku diff failed`, or a failure "after changing the lock".
- Cause: unknown slug, no version for Minecraft 1.21.1 + NeoForge, or a dependency problem.
- Fix: read the Pakku output above the error and check the slug with `task mods:find`. If the lock changed, review the printed diff; undo with `git checkout pakku-lock.json pakku.json`.

### Stale config project

- Symptom: `pakku.json projects."x" matches no mod in pakku-lock.json`.
- Cause: you removed a mod but its entry stayed in `pakku.json`, or the slug is misspelled.
- Fix: delete or correct that entry in `pakku.json`.

### Duplicate overrides

- Symptom: `<path> exists in both overrides and .pakku/server-overrides/`.
- Cause: the same path in both places makes Pakku's export pick a winner unpredictably (Pakku issue #120).
- Fix: keep the file in one place only. See [configuration](reference/configuration.md).

### Doctor check failed

- Symptom: `task doctor` reports `<name> check failed` or `check skipped`.
- Cause: that check could not run (unreadable `pakku.json` / `pakku-lock.json`, or an unexpected error).
- Fix: read the message; usually `git checkout pakku-lock.json pakku.json` or `task setup`. Run `BASTION_DEBUG=1 task doctor` for a stack trace.

## Build and release

### Export failed

- Symptom: `pakku … failed` during build, or `pakku export finished but produced no .mrpack`.
- Cause: Pakku could not export (bad `pakku.json`, missing files, network).
- Fix: read the Pakku output above the error, run `task doctor`, then `task build`.

### Version detect

- Symptom: `git … failed` during `task build`.
- Cause: not a git checkout, or no commits yet.
- Fix: pass the version explicitly: `task build VERSION=0.1.0`.

### Invalid version

- Symptom: `… is not a valid semver` / `not a valid version` / `Missing version`.
- Cause: versions are `MAJOR.MINOR.PATCH` with an optional `-prerelease`, no leading `v`.
- Fix: for example `task release -- 1.2.0` or `task build VERSION=1.0.0-beta.1`.

### Mrpack invalid

- Symptom: `Cannot read … as an .mrpack`, `has no modrinth.index.json`, or `declares no known mod loader`.
- Cause: a truncated or stale build.
- Fix: delete `build/`, then `task build`.

### Release branch

- Symptom: `Releases are cut from main`.
- Cause: you are on another branch.
- Fix: merge your work into `main`, `git switch main`, retry.

### Release dirty tree

- Symptom: `The working tree has uncommitted changes`.
- Cause: the release commit must contain only the changelog change.
- Fix: commit or stash first.

### Release empty changelog

- Symptom: `The [Unreleased] section of CHANGELOG.md is empty`.
- Cause: nothing is described for this release.
- Fix: add bullets under `## [Unreleased]` in `CHANGELOG.md`, commit, retry.

### Release version exists

- Symptom: `CHANGELOG.md already has a section for x` or `Tag x already exists`.
- Cause: that version was already released.
- Fix: pick a new version number.

### Release version order

- Symptom: `Version x must be greater than the previous release y`.
- Cause: the new version is not above the highest existing tag. Tags copied from the template repository count too.
- Fix: bump higher, or delete tags that are not yours.

### Release out of date

- Symptom: `Local main is behind or diverged from origin/main`.
- Cause: someone (often the weekly mod-update PR) changed `main`.
- Fix: `git pull --rebase`, then `task release -- x.y.z` again.

### Release git failed

- Symptom: `git … failed` during `task release`.
- Cause: a git command failed (no remote, no push rights, tag clash). The git message is in the hint.
- Fix: fix the cause. If the release commit or tag was already created locally, inspect with `git log -3` and `git tag`, and delete the local tag/commit before retrying.

### Release notes usage

- Symptom: `--out needs a file path` or `not a valid release version`.
- Cause: `scripts/release-notes.ts` was called wrongly (normally only CI calls it).
- Fix: `node scripts/release-notes.ts <version> [--out <file>]`.

### Summary diff failed

- Symptom: `pakku diff failed` in the CI job summary.
- Cause: the previous tag's lock could not be read or Pakku was not set up.
- Fix: the summary falls back gracefully; locally `task setup` and retry.

## Publishing to Modrinth

### Publish failed

- Symptom: the release workflow warns "Modrinth upload failed, but the GitHub Release already exists".
- Cause: a Modrinth error (token, project id, outage). The GitHub Release is unaffected.
- Fix: re-run the job (versions already on Modrinth are skipped), or locally: `task build VERSION=x.y.z` then `task publish:modrinth -- --version x.y.z`. See [first-modrinth-release](guides/first-modrinth-release.md).

### Publish usage

- Symptom: `Unknown argument` or `No version given and no release tag found`.
- Cause: bad flags.
- Fix: `task publish:modrinth -- [--dry-run] [--skip-existing] [--version x.y.z]`.

### Publish mrpack missing

- Symptom: `No .mrpack found in build/modrinth` or more than one.
- Cause: nothing built yet, or stale files from older builds.
- Fix: clear `build/modrinth/`, then `task build VERSION=x.y.z`.

### Publish version mismatch

- Symptom: `The built pack is a, not b`.
- Cause: the `.mrpack` was built with another version than the one you are publishing.
- Fix: `task build VERSION=x.y.z`, then publish again.

### Publish version exists

- Symptom: `version x already exists on Modrinth`.
- Cause: Modrinth refuses duplicate version numbers.
- Fix: bump the version, or delete the mistaken version on Modrinth. CI uses `--skip-existing`, so re-runs are safe.

### Modrinth auth

- Symptom: `Modrinth rejected the request (HTTP 401/403)`.
- Cause: missing or wrong `MODRINTH_TOKEN`, or the token lacks the create-version scope.
- Fix: create a personal access token with version-create scope, put it in the root `.env` (local) or the `MODRINTH_TOKEN` repo secret (CI). Never paste it into commands.

### Modrinth rate limited

- Symptom: `Modrinth rate limit hit (HTTP 429)`.
- Cause: too many requests.
- Fix: wait a minute and retry.

### Modrinth server error

- Symptom: `Modrinth returned HTTP 5xx` or `unreadable response`.
- Cause: Modrinth is having trouble.
- Fix: check https://status.modrinth.com and retry later.

### Modrinth unreachable

- Symptom: `Can't reach Modrinth` (requests time out after 15 s), or `Modrinth side check skipped` in `task doctor`.
- Cause: network, proxy or outage.
- Fix: check your connection; `task doctor` still works offline, minus the side check.

### Modrinth request failed

- Symptom: `Modrinth request failed (HTTP 4xx)`.
- Cause: wrong project slug/id or bad parameters.
- Fix: for publishing check `MODRINTH_PROJECT_ID` (the id, not the slug); for `task mods:find` check the query.

## Prism

### Prism layout

- Symptom: `task setup:prism` refuses to run.
- Cause: the clone is not at `<Prism>/instances/<name>/minecraft`.
- Fix: clone into that exact place (see [getting-started](getting-started.md)). Close Prism first, then `task setup:prism`.

### Prism lock

- Symptom: `pakku-lock.json has no Minecraft version or NeoForge loader` or `Invalid pack name for instance.cfg`.
- Cause: the lock lacks NeoForge (this template is NeoForge-only) or `name` in `pakku.json` is empty or multi-line.
- Fix: restore the lock from git; set a single-line `name` in `pakku.json`.

### Prism out of sync

- Symptom: `Prism mmc-pack.json differs from pakku-lock.json`.
- Cause: Minecraft or NeoForge changed in the lock but the instance still has the old versions.
- Fix: close Prism, `task prism:sync`.

## Server

### Docker missing

- Symptom: `Docker is not available` or `docker compose … failed`.
- Cause: Docker Desktop is not running, or not installed.
- Fix: start Docker Desktop and retry. See [local-server-docker](guides/local-server-docker.md).

### Server env missing

- Symptom: `server/.env not found`.
- Cause: it is gitignored and must be created.
- Fix: copy `server/.env.example` to `server/.env` and set `PLAYIT_SECRET_KEY`.

### Server usage

- Symptom: `Unknown server command`.
- Cause: script called directly with a wrong command.
- Fix: use `task server:up`, `server:down`, `server:logs`, `server:update`.

### Server smoke failed

- Symptom: `Server smoke test failed: … before it was ready`, with the last log lines.
- Cause: usually a mod that cannot load on a dedicated server (client-only mod with the wrong side), a missing dependency, or too little memory. A transient installer download error can also cause it.
- Fix: read the log tail and crash report in the output. If a mod is client-only, fix its `side` ([wrong-mod-side](guides/wrong-mod-side.md)). Then `task build` and `task server:smoke`. Re-run once for network errors.

## Init and docs

### Init invalid input

- Symptom: `task init` rejects a name, author, description or slug.
- Cause: empty, multi-line, or an invalid Modrinth slug.
- Fix: re-run `task init` with valid values (see the message for the rule).

### Init already initialized

- Symptom: `This repository is already initialized as "…"`.
- Cause: `pakku.json` no longer has the template name.
- Fix: nothing to do; to redo it on purpose use `task init -- --force`.

### Init failed

- Symptom: `init failed partway`.
- Cause: a file write failed midway.
- Fix: follow the hint: re-run `task init` (nothing changed yet) or `task init -- --force`.

### Docs check failed

- Symptom: `task check` reports `docs check found N problem(s)`.
- Cause: a broken relative link, a `task <name>` that does not exist, a troubleshooting anchor referenced by a script or workflow but missing here, or a page missing its "Use this when" opening or "Verify it worked" section.
- Fix: fix each listed line. When you add a new error with `docs: …#some-anchor`, add a heading here whose text slugs to `some-anchor` (lowercase, spaces to `-`, punctuation dropped).

## Verify it worked

Run `task doctor`: no `error` lines and the original command succeeds. For docs, `task check` passes.
