# BastionPack

A Minecraft 1.21.1 NeoForge modpack template for packdevs who publish on **Modrinth**. Reliable, robust, easy to troubleshoot: when something goes wrong, the tooling says what happened and links to the fix.

BastionPack is derived from [PanPack](https://github.com/ThePansmith/PanPack) by ThePansmith (LGPL-3.0). Thanks to the PanPack authors for the original template and ideas.

## Features

- **Modrinth first**: `task build` produces a `.mrpack`; `task release -- x.y.z` tags and CI publishes (GitHub Release, Modrinth, optional Discord). CurseForge is supported but off by default.
- **One source of truth**: the client pack and the server are built from the same `pakku-lock.json`, so their mod lists cannot diverge.
- **One command per action**: `task --list` shows everything: setup, add a mod, check, build, run a server, release.
- **Pinned and verified tools**: Pakku is pinned with a SHA-256; Java, Node and Task come from `mise`.
- **`task doctor`**: checks your tools, the Prism instance, mod sides against Modrinth and override paths.
- **Server smoke test** in CI: a real `itzg/minecraft-server` boots the built pack before anything is published.
- **Weekly mod-update PR** with a readable diff and the smoke-test result.
- **Local server** with Docker and playit.gg: `task server:up`.
- **Batteries included**: Sodium, ModernFix, FerriteCore, ImmediatelyFast, EntityCulling, Noisium, KubeJS, JEI, Jade and more.

## 5-minute start

Clone into a Prism instance (`<Prism>/instances/<name>/minecraft`), then:

```sh
mise install
task setup
task init
task setup:prism
```

Open Prism and press Play. Add a mod with `task mods:add -- <slug>`. Full walkthrough: [docs/getting-started.md](docs/getting-started.md).

## Documentation

- [Getting started](docs/getting-started.md), [Concepts](docs/concepts.md), [For players](docs/players.md)
- [Troubleshooting](docs/troubleshooting.md): every script error links here
- Guides in [docs/guides/](docs/guides/): [wrong mod side](docs/guides/wrong-mod-side.md), [mod not on Modrinth](docs/guides/mod-not-on-modrinth.md), [local server](docs/guides/local-server-docker.md), [first Modrinth release](docs/guides/first-modrinth-release.md), [KubeJS](docs/guides/kubejs-recipes-and-optional-compat.md), [performance](docs/guides/performance-low-end.md)
- Reference: [tasks](docs/reference/tasks.md), [workflows](docs/reference/workflows.md), [configuration](docs/reference/configuration.md), [Pakku](docs/reference/pakku.md)
- AI agents: [AGENTS.md](AGENTS.md). Contributors: [CONTRIBUTING.md](CONTRIBUTING.md)

## License

LGPL-3.0, see [LICENSE.md](LICENSE.md). Packs created from this template choose their own license for their content.

## Credits

[PanPack](https://github.com/ThePansmith/PanPack) by ThePansmith, itself using a build script adapted from TerraFirmaGreg. [Pakku](https://github.com/juraj-hrivnak/Pakku) does the heavy lifting.
