# Mod not on Modrinth

Use this when a mod you want exists only on CurseForge (example: ProjectE, MIT-licensed) and your pack publishes to Modrinth.

The template ships `target: "modrinth"` and no CurseForge mods. Both paths below are **unverified**: they come from the Pakku docs and a failed attempt without an API key. Test them on your pack before relying on them.

## First: check alternatives and the license

- `task mods:find -- <name>` for a Modrinth equivalent.
- Modrinth only allows files from approved hosts in the `.mrpack` index. A jar from elsewhere must be shipped inside the pack as an override, which needs a license or permission that allows redistribution.
- Mods without a declared license (for example the FTB mods) must not be redistributed. Avoid them on Modrinth.

## Path A: multiplatform target (UNVERIFIED)

Needs a CurseForge API key from https://console.curseforge.com/ (API keys tab).

```sh
java -jar pakku.jar credentials set --cf-api-key <key>
java -jar pakku.jar set -t multiplatform
java -jar pakku.jar add prj --cf projecte
```

Keep the key out of the repo and out of shell history where you can. Per the Pakku docs, a project not on the current platform is included as an override if it is marked redistributable (`pakku cfg prj -r`), otherwise dropped. Expect cross-platform mismatch warnings. After `task build`, check that the jar is under `overrides/mods/` in `build/modrinth/*.mrpack`. A multiplatform target also exports a CurseForge zip.

## Path B: manual jar (UNVERIFIED)

For permissively licensed mods (such as MIT): download the jar for Minecraft 1.21.1 + NeoForge and put it in `.pakku/overrides/mods/`. No API key needed; updates are manual and the jar is committed to git. Make sure the license allows redistribution and keep it noted in `CHANGELOG.md`.

## Verify it worked

Unzip the built `.mrpack` and find the jar in `overrides/mods/`, then `task server:smoke` passes and the mod loads in Prism. Report back which path worked by updating this page.
