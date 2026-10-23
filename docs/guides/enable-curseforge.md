# Enable CurseForge

Use this when you also want to publish to CurseForge. It is off by default, and a Modrinth-only pack never needs a CurseForge key.

## Steps

1. Switch the pack to export both platforms:

    ```sh
    java -jar pakku.jar set -t multiplatform
    ```

    `task build` then also writes `build/curseforge/*.zip`. Mods missing on one platform may produce warnings (see [mod-not-on-modrinth](mod-not-on-modrinth.md)).

2. Create a CurseForge project and an upload API token (CurseForge for Studios, https://console.curseforge.com/).
3. In the GitHub repo set secret `CURSEFORGE_TOKEN` and variables `CURSEFORGE_ID` (project id) and `ENABLE_CURSEFORGE` set to `true`. Optional: `BUILD_SERVERPACK` set to `true` also builds the server zip.
4. Release as usual (`task release -- x.y.z`). Without `ENABLE_CURSEFORGE` the step is skipped.

If the build has no `build/curseforge/*.zip`, the workflow fails with a message pointing here: the target is not `multiplatform`.

## Verify it worked

The release workflow's CurseForge step runs and the file appears on the CurseForge project (CurseForge reviews files before listing).
