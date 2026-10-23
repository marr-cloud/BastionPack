import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import { build, restoreOnSignal } from "./build.ts";
import { BastionError } from "./lib/errors.ts";
import type { pakku } from "./lib/pakku.ts";

const original = '{\n    "name": "T",\n    "version": "0.0.0-dev"\n}';
let base: string;
let root: string;

beforeEach(() => {
    base = mkdtempSync(join(tmpdir(), "build-test-"));
    root = join(base, "Engineer's Tea");
    mkdirSync(root);
    writeFileSync(join(root, "pakku.json"), original);
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

function runner(onExport: (args: string[]) => void | "fail", calls: string[][] = []): typeof pakku {
    return async (args) => {
        calls.push(args);
        if (args[0] === "cfg") {
            writeFileSync(join(root, "pakku.json"), '{"name":"T","version":"changed"}');
        } else if (args[0] === "export") {
            if (onExport(args) === "fail") return { code: 1, stdout: "", stderr: "boom" };
        }
        return { code: 0, stdout: "", stderr: "" };
    };
}

function writeOut(...files: string[]) {
    for (const f of files) {
        const p = join(root, "build", f);
        mkdirSync(join(p, ".."), { recursive: true });
        writeFileSync(p, "z");
    }
}

test("build restores pakku.json when export fails", async () => {
    await assert.rejects(
        build({ root, version: "1.0.0", serverpack: false, pakkuRunner: runner(() => "fail") }),
        /export/i,
    );
    assert.equal(readFileSync(join(root, "pakku.json"), "utf8"), original);
});

test("build returns the mrpack path from a root with spaces and apostrophes", async () => {
    const calls: string[][] = [];
    const r = runner(() => writeOut("modrinth/x.mrpack"), calls);
    const out = await build({ root, version: "1.0.0", serverpack: false, pakkuRunner: r });
    assert.equal(out.mrpack, join(root, "build", "modrinth", "x.mrpack"));
    assert.equal(out.serverpack, undefined);
    assert.deepEqual(calls[0], ["cfg", "-v", "1.0.0"]);
    assert.ok(calls[1]?.includes("--no-server"));
    assert.equal(readFileSync(join(root, "pakku.json"), "utf8"), original);
});

test("build fails with export-failed when no mrpack is produced", async () => {
    await assert.rejects(
        build({ root, version: "1.0.0", serverpack: false, pakkuRunner: runner(() => {}) }),
        (e: unknown) => e instanceof BastionError && /export-failed/.test(e.docs ?? ""),
    );
    assert.equal(readFileSync(join(root, "pakku.json"), "utf8"), original);
});

test("build does not return a stale artifact", async () => {
    writeOut("modrinth/old.mrpack");
    await assert.rejects(
        build({ root, version: "1.0.0", serverpack: false, pakkuRunner: runner(() => {}) }),
        BastionError,
    );
    assert.ok(!existsSync(join(root, "build", "modrinth", "old.mrpack")));
});

test("build with serverpack omits --no-server and returns the zip", async () => {
    const calls: string[][] = [];
    const r = runner(() => writeOut("modrinth/x.mrpack", "serverpack/s.zip"), calls);
    const out = await build({ root, version: "1.0.0", serverpack: true, pakkuRunner: r });
    assert.equal(out.serverpack, join(root, "build", "serverpack", "s.zip"));
    assert.ok(!calls[1]?.includes("--no-server"));
});

test("signal handler restores the original bytes and exits with the conventional code", () => {
    const file = join(root, "pakku.json");
    writeFileSync(file, "modified");
    const before = process.listeners("SIGINT").length;
    const codes: number[] = [];
    const dispose = restoreOnSignal(file, Buffer.from(original), (c) => codes.push(c));
    const listeners = process.listeners("SIGINT");
    assert.equal(listeners.length, before + 1);
    (listeners.at(-1) as () => void)();
    assert.equal(readFileSync(file, "utf8"), original);
    assert.deepEqual(codes, [130]);
    const term = process.listeners("SIGTERM").at(-1) as () => void;
    term();
    assert.deepEqual(codes, [130, 143]);
    dispose();
    assert.equal(process.listeners("SIGINT").length, before);
});

test("build removes its signal handlers when done", async () => {
    const before = process.listeners("SIGINT").length;
    await assert.rejects(
        build({ root, version: "1.0.0", serverpack: false, pakkuRunner: runner(() => "fail") }),
    );
    assert.equal(process.listeners("SIGINT").length, before);
});

test("a failing restore after a failing export surfaces both", async () => {
    const r: typeof pakku = async (args) => {
        if (args[0] === "export") {
            rmSync(join(root, "pakku.json"));
            mkdirSync(join(root, "pakku.json")); // makes the restore write fail
            return { code: 1, stdout: "", stderr: "" };
        }
        return { code: 0, stdout: "", stderr: "" };
    };
    await assert.rejects(
        build({ root, version: "1.0.0", serverpack: false, pakkuRunner: r }),
        (e: unknown) =>
            e instanceof BastionError &&
            /export failed/.test(e.message) &&
            /could not restore pakku\.json/.test(e.message) &&
            /git checkout -- pakku\.json/.test(e.message),
    );
});

test("build fails when the serverpack is requested but missing", async () => {
    const r = runner(() => writeOut("modrinth/x.mrpack"));
    await assert.rejects(
        build({ root, version: "1.0.0", serverpack: true, pakkuRunner: r }),
        /serverpack/i,
    );
});
