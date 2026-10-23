import assert from "node:assert/strict";
import { test } from "node:test";
import { upPlan } from "./server.ts";

test("local `up` recreates the container and forces a modpack resync", () => {
    const p = upPlan("up", true);
    assert.deepEqual(p.args, ["up", "-d", "--force-recreate"]);
    assert.equal(p.forceSync, true);
});

test("`up` with a published pack does not force anything", () => {
    const p = upPlan("up", false);
    assert.deepEqual(p.args, ["up", "-d"]);
    assert.equal(p.forceSync, false);
});

test("`update` always forces recreate and resync", () => {
    for (const local of [true, false]) {
        const p = upPlan("update", local);
        assert.deepEqual(p.args, ["up", "-d", "--force-recreate"]);
        assert.equal(p.forceSync, true);
    }
});
