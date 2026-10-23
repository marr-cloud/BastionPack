import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import { BastionError, main } from "./lib/errors.ts";
import { run } from "./lib/exec.ts";
import { repoRoot } from "./lib/paths.ts";
import { findMrpack } from "./publish-modrinth.ts";

const DOCS = "docs/troubleshooting.md";

export function composeArgs(root: string, rest: string[]): string[] {
    return [
        "compose",
        "-f",
        join(root, "server", "compose.yaml"),
        "--env-file",
        join(root, "server", ".env"),
        ...rest,
    ];
}

/** A rebuilt local pack can keep its filename (same commit), so local runs always recreate and resync. */
export function upPlan(
    cmd: "up" | "update",
    local: boolean,
): { args: string[]; forceSync: boolean } {
    const force = cmd === "update" || local;
    return { args: ["up", "-d", ...(force ? ["--force-recreate"] : [])], forceSync: force };
}

function requireEnv(root: string): void {
    if (!existsSync(join(root, "server", ".env"))) {
        throw new BastionError("server/.env not found", {
            hint: "copy server/.env.example to server/.env and fill in PLAYIT_SECRET_KEY",
            docs: `${DOCS}#server-env-missing`,
        });
    }
}

async function compose(root: string, rest: string[], env: NodeJS.ProcessEnv = {}): Promise<void> {
    const r = await run("docker", composeArgs(root, rest), { inherit: true, env }).catch((e) => {
        throw e instanceof BastionError
            ? new BastionError("Docker is not available", {
                  hint: "start Docker Desktop and retry",
                  docs: `${DOCS}#docker-missing`,
              })
            : e;
    });
    if (r.code !== 0) {
        throw new BastionError(`docker compose ${rest[0]} failed (exit ${r.code})`, {
            hint: "see the output above; is Docker Desktop running?",
            docs: `${DOCS}#docker-missing`,
        });
    }
}

async function build(root: string): Promise<void> {
    const r = await run("node", [join(root, "scripts", "build.ts")], { cwd: root, inherit: true });
    if (r.code !== 0) {
        throw new BastionError("task build failed", {
            hint: "fix the build first, then retry",
            docs: `${DOCS}#export-failed`,
        });
    }
}

if (import.meta.main) {
    main(async () => {
        const root = repoRoot();
        const cmd = process.argv[2];
        requireEnv(root);
        switch (cmd) {
            case "up":
            case "update": {
                // Local mode: always serve the freshly built pack. A published slug in .env is used by `update`.
                const local = process.env["SERVER_USE_ENV_PACK"] !== "true";
                const env: NodeJS.ProcessEnv = {};
                if (local) {
                    await build(root);
                    env["MODRINTH_MODPACK"] = `/modpacks/${basename(findMrpack(root))}`;
                }
                const plan = upPlan(cmd, local);
                if (plan.forceSync) env["MODRINTH_FORCE_SYNCHRONIZE"] = "true";
                if (cmd === "update") await compose(root, ["pull"], env);
                await compose(root, plan.args, env);
                break;
            }
            case "down":
                await compose(root, ["down"]);
                break;
            case "logs":
                await compose(root, ["logs", "-f", "--tail", "100"]);
                break;
            default:
                throw new BastionError(`Unknown server command: ${cmd ?? ""}`, {
                    hint: "usage: node scripts/server.ts up|update|down|logs",
                    docs: `${DOCS}#server-usage`,
                });
        }
    });
}
