import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { BastionError } from "./errors.ts";
import { run, type RunResult } from "./exec.ts";
import { repoRoot } from "./paths.ts";

export async function verifySha256(file: string, expected: string): Promise<boolean> {
    try {
        const hash = createHash("sha256")
            .update(await readFile(file))
            .digest("hex");
        return hash === expected.toLowerCase();
    } catch {
        return false;
    }
}

export interface EnsurePakkuOptions {
    version: string;
    sha256: string;
    dest: string;
    fetchImpl?: typeof fetch;
}

export async function ensurePakku(opts: EnsurePakkuOptions): Promise<"present" | "downloaded"> {
    if (await verifySha256(opts.dest, opts.sha256)) return "present";
    const url = `https://github.com/juraj-hrivnak/pakku/releases/download/v${opts.version}/pakku.jar`;
    const part = `${opts.dest}.part`;
    const doFetch = opts.fetchImpl ?? fetch;
    try {
        const res = await doFetch(url);
        if (!res.ok) {
            throw new BastionError(`Failed to download Pakku (HTTP ${res.status})`, {
                hint: `check your network and that ${url} exists`,
                docs: "docs/troubleshooting.md#pakku-download",
            });
        }
        await writeFile(part, Buffer.from(await res.arrayBuffer()));
        if (!(await verifySha256(part, opts.sha256))) {
            throw new BastionError("pakku.jar checksum mismatch", {
                hint: "re-run `task setup`; if it persists the release asset changed — check PAKKU_SHA256",
                docs: "docs/troubleshooting.md#pakku-checksum",
            });
        }
        await rename(part, opts.dest);
        return "downloaded";
    } catch (e) {
        await rm(part, { force: true });
        if (e instanceof BastionError) throw e;
        throw new BastionError(`Failed to download Pakku: ${(e as Error).message}`, {
            hint: `check your network connection and retry \`task setup\``,
            docs: "docs/troubleshooting.md#pakku-download",
        });
    }
}

export async function pakku(
    args: string[],
    opts: { cwd?: string; inherit?: boolean } = {},
): Promise<RunResult> {
    const root = repoRoot();
    const jar = join(root, "pakku.jar");
    if (!existsSync(jar)) {
        throw new BastionError("pakku.jar not found", {
            hint: "run `task setup`",
            docs: "docs/troubleshooting.md#pakku-missing",
        });
    }
    return run("java", ["-jar", jar, ...args], { cwd: opts.cwd ?? root, inherit: opts.inherit });
}
