# Getting started

Use this when you have just created a repository from the BastionPack template and want to go from clone to first release.

## 1. Clone into a Prism instance

The repository root **is** the instance's `minecraft/` folder. In [Prism Launcher](https://prismlauncher.org/), find the instances folder (right-click an instance, Folder, or Settings, Folders) and clone like this:

```sh
cd <Prism>/instances
mkdir my-pack && cd my-pack
git clone <your-repo-url> minecraft
cd minecraft
```

## 2. Install tools and set up

```sh
mise install
task setup
```

`task setup` runs `pnpm install --frozen-lockfile`, downloads the pinned Pakku (checksum verified), fetches the mods and enables the git hook. It is safe to re-run.

## 3. Make it yours

```sh
task init
```

It asks for the pack name, author, description and Modrinth slug, then updates `pakku.json` and the Prism instance name, resets `CHANGELOG.md`, replaces this template README with a short pack README, and removes `docs/superpowers/`. Pass flags to skip the prompts (see `task --list`).

## 4. Create the Prism instance files

Close Prism, then:

```sh
task setup:prism
```

This writes `instance.cfg` (including the `PreLaunchCommand` that runs `pakku fetch` before every launch) and `mmc-pack.json` (Minecraft 1.21.1 + NeoForge from the lock) into the instance folder, merging into an existing `instance.cfg`. Open Prism, the instance appears, press Play.

## 5. Add your first mod

```sh
task mods:find -- create
task mods:add -- create
task doctor
```

Then press Play in Prism (the pre-launch fetch downloads it). `task doctor` cross-checks the mod's side against Modrinth; if it prints a `pakku.json` snippet, apply it ([wrong-mod-side](guides/wrong-mod-side.md)).

## 6. Check, build, release

```sh
task check
task test
task build
```

When you are ready, add notes under `## [Unreleased]` in `CHANGELOG.md`, commit, and from `main`:

```sh
task release -- 0.1.0
```

The tag triggers the release workflow. For the very first Modrinth upload see [first-modrinth-release](guides/first-modrinth-release.md).

## Verify it worked

- `task doctor` shows no `error` lines.
- Prism launches the instance to the main menu with your mods.
- `task build` writes `build/modrinth/<name>-<version>.mrpack`.
