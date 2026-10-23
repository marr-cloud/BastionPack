# Local server with Docker

Use this when you want to host the pack for friends from your own PC using Docker and playit.gg.

`server/compose.yaml` runs `itzg/minecraft-server:java21` (it installs the pack from the same `.mrpack` friends use) and the playit.gg agent `ghcr.io/playit-cloud/playit-agent:1.0.8`.

## Setup

1. Install Docker Desktop and start it.
2. Create the env file and fill it in:

    ```sh
    cp server/.env.example server/.env
    ```

    Set `PLAYIT_SECRET_KEY` (playit.gg dashboard, Agents). `MEMORY` defaults to 4G. Never commit `server/.env`.

3. In the playit dashboard set the tunnel's local address to `minecraft:25565`. The agent shares the compose network with the server, so the service name is the address.

## Run

```sh
task server:up
task server:logs
```

`task server:up` builds a dev pack and starts both containers. `task server:up SERVER_USE_ENV_PACK=true` skips the build and uses `MODRINTH_MODPACK` from `server/.env` instead (a `/modpacks/<file>.mrpack` path, or a published Modrinth slug with `MODRINTH_VERSION`). Friends join through the playit address.

Other commands:

- `task server:update`: pull images and force a modpack resync after a new build.
- `task server:down`: stop everything (the world in `server/data/` stays).
- `task server:smoke`: boot a throwaway server from the built `.mrpack` and wait for the ready line (this is the CI check).

`MODRINTH_EXCLUDE_FILES` (comma-separated jar names) is a fallback to skip a file on the server. Prefer fixing the mod's `side` ([wrong-mod-side](wrong-mod-side.md)).

## Verify it worked

`task server:logs` shows `Done (...)! For help, type "help"`, and a player joins through the playit address. If not, see [server-rejects-connection](server-rejects-connection.md) and [troubleshooting](../troubleshooting.md#docker-missing).
