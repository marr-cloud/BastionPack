import assert from "node:assert/strict";
import {
    cpSync,
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import { BastionError } from "./lib/errors.ts";
import { freshChangelog } from "./lib/changelog.ts";
import { applyInit, parseInitArgs } from "./init.ts";

const real = join(import.meta.dirname, "..");
let root: string;
beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "init-test-"));
    for (const f of [
        "pakku.json",
        "CHANGELOG.md",
        "README.md",
        ".pakku/prism-overrides/instance.cfg",
        "server/.env.example",
    ]) {
        mkdirSync(join(root, f, ".."), { recursive: true });
        cpSync(join(real, f), join(root, f));
    }
    mkdirSync(join(root, "docs/superpowers/plans"), { recursive: true });
    writeFileSync(join(root, "docs/superpowers/plans/x.md"), "x");
    writeFileSync(join(root, "docs/getting-started.md"), "g");
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

const answers = {
    name: "Engineer's Tea",
    author: "Ann",
    description: 'A "cozy" pack',
    modrinthSlug: "engineers-tea",
};
const read = (f: string) => readFileSync(join(root, f), "utf8");

test("applyInit rewrites everything for a name with spaces and apostrophe", () => {
    applyInit(root, answers);
    const cfg = JSON.parse(read("pakku.json"));
    assert.equal(cfg.name, "Engineer's Tea");
    assert.equal(cfg.author, "Ann");
    assert.equal(cfg.description, 'A "cozy" pack');
    assert.equal(cfg.version, "0.0.0-dev");
    assert.deepEqual(cfg.overrides.slice(0, 1), ["config"]);
    assert.equal(existsSync(join(root, "docs/superpowers")), false);
    assert.equal(existsSync(join(root, "docs/getting-started.md")), true);
    assert.equal(read("CHANGELOG.md"), freshChangelog());
    const inst = read(".pakku/prism-overrides/instance.cfg");
    assert.match(inst, /^name=Engineer's Tea$/m);
    assert.match(inst, /PreLaunchCommand=/);
    const readme = read("README.md");
    assert.match(readme, /^# Engineer's Tea$/m);
    assert.match(readme, /A "cozy" pack/);
    assert.match(readme, /https:\/\/modrinth\.com\/modpack\/engineers-tea/);
    assert.match(readme, /Built with BastionPack/);
    assert.match(readme, /docs\/getting-started\.md/);
    const env = read("server/.env.example");
    assert.match(env, /^# MODRINTH_MODPACK=engineers-tea$/m);
    assert.match(env, /^# MODRINTH_MODPACK=\/modpacks\//m);
});

test("without a slug the README has no Modrinth link and .env.example is untouched", () => {
    const before = read("server/.env.example");
    applyInit(root, { name: "Plain", author: "A", description: "d" });
    assert.doesNotMatch(read("README.md"), /modrinth\.com\/modpack/);
    assert.equal(read("server/.env.example"), before);
});

test("second run is refused unless forced", () => {
    applyInit(root, answers);
    assert.throws(
        () => applyInit(root, { ...answers, name: "Other" }),
        (e) =>
            e instanceof BastionError &&
            /troubleshooting\.md#init-already-initialized/.test(e.docs ?? ""),
    );
    applyInit(root, { ...answers, name: "Other" }, { force: true });
    assert.equal(JSON.parse(read("pakku.json")).name, "Other");
});

test("invalid answers are rejected before touching anything", () => {
    for (const bad of [
        { name: " " },
        { name: "a\nb" },
        { author: "" },
        { modrinthSlug: "Bad Slug" },
    ]) {
        assert.throws(() => applyInit(root, { ...answers, ...bad }), BastionError);
    }
    assert.equal(JSON.parse(read("pakku.json")).name, "BastionPack");
    assert.equal(existsSync(join(root, "docs/superpowers")), true);
});

test("parseInitArgs reads flags", () => {
    assert.deepEqual(
        parseInitArgs([
            "--name",
            "N",
            "--author=A",
            "--description",
            "D",
            "--modrinth-slug",
            "s",
            "--force",
        ]),
        { name: "N", author: "A", description: "D", modrinthSlug: "s", force: true },
    );
    assert.throws(() => parseInitArgs(["--bogus"]), BastionError);
    assert.throws(() => parseInitArgs(["--name"]), BastionError);
});

test("a failed write leaves pakku.json untouched and the repo re-runnable", () => {
    rmSync(join(root, ".pakku"), { recursive: true });
    assert.throws(
        () => applyInit(root, answers),
        (e) => e instanceof BastionError && /init-failed/.test(e.docs ?? ""),
    );
    assert.equal(JSON.parse(read("pakku.json")).name, "BastionPack");
    mkdirSync(join(root, ".pakku/prism-overrides"), { recursive: true });
    applyInit(root, answers);
    assert.equal(JSON.parse(read("pakku.json")).name, "Engineer's Tea");
});
