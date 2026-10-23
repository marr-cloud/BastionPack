import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import { ensurePakku, verifySha256 } from "./pakku.ts";

const bytes = Buffer.from("fake pakku jar contents");
const sha = createHash("sha256").update(bytes).digest("hex");
let dir: string;
let calls: string[];
let opts: Parameters<typeof ensurePakku>[0];

beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "pakku-test-"));
    calls = [];
    opts = {
        version: "9.9.9",
        sha256: sha,
        dest: join(dir, "pakku.jar"),
        fetchImpl: (async (url: string) => {
            calls.push(url);
            return new Response(bytes);
        }) as unknown as typeof fetch,
    };
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

test("verifySha256 compares file hash", async () => {
    const f = join(dir, "x");
    writeFileSync(f, bytes);
    assert.equal(await verifySha256(f, sha), true);
    assert.equal(await verifySha256(f, sha.toUpperCase()), true);
    assert.equal(await verifySha256(f, "0".repeat(64)), false);
    assert.equal(await verifySha256(join(dir, "missing"), sha), false);
});

test("ensurePakku downloads and verifies", async () => {
    assert.equal(await ensurePakku(opts), "downloaded");
    assert.deepEqual(readFileSync(opts.dest), bytes);
    assert.deepEqual(calls, [
        "https://github.com/juraj-hrivnak/pakku/releases/download/v9.9.9/pakku.jar",
    ]);
    assert.equal(existsSync(opts.dest + ".part"), false);
});

test("ensurePakku returns present when hash matches", async () => {
    await ensurePakku(opts);
    calls.length = 0;
    assert.equal(await ensurePakku(opts), "present");
    assert.equal(calls.length, 0);
});

test("checksum mismatch deletes the partial file and throws", async () => {
    await assert.rejects(ensurePakku({ ...opts, sha256: "0".repeat(64) }), /checksum mismatch/);
    assert.equal(existsSync(opts.dest + ".part"), false);
    assert.equal(existsSync(opts.dest), false);
});

test("existing jar with old hash is replaced", async () => {
    writeFileSync(opts.dest, "junk");
    assert.equal(await ensurePakku(opts), "downloaded");
    assert.deepEqual(readFileSync(opts.dest), bytes);
});

test("HTTP failure throws BastionError without leaving files", async () => {
    const failing = (async () => new Response("no", { status: 404 })) as unknown as typeof fetch;
    await assert.rejects(ensurePakku({ ...opts, fetchImpl: failing }), /download/i);
    assert.equal(existsSync(opts.dest + ".part"), false);
});
