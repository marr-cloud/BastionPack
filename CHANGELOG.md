# Changelog

All notable changes to this modpack are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- Guide `mod-not-on-modrinth`: new verified path for mods published as GitHub Releases (for example a fork of ProjectE).
- Tooling runtime moved to Node 26. Dev builds are now versioned `<tag>+dev.<sha>`.

### Fixed

- Scripts no longer silently do nothing when the repo is reached through a symlink or junction.
- `task setup` now installs npm dependencies; `task release` rejects extra arguments; stalled Pakku downloads time out.
- `task server:up` always recreates the container and resyncs the local pack.
- `task setup:prism` writes `instance.cfg` values escaped the way Prism (Qt) reads them; the pre-launch `pakku fetch` command was being run with its arguments glued together.
- `task build` runs `pakku fetch` before exporting, so GitHub-hosted mods are no longer silently left out of the `.mrpack`.

## [0.1.0] - 2026-10-23

### Added

- First release of the BastionPack template: Minecraft 1.21.1 NeoForge base pack with performance mods, KubeJS + ProbeJS, JEI, Jade, Crash Assistant and spark.
