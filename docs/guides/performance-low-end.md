# Performance on low-end machines

Use this when the pack runs slowly or runs out of memory on a modest PC.

## What the base modset already does

Sodium (rendering), ModernFix (startup and memory), FerriteCore (memory), ImmediatelyFast (UI and entity drawing), EntityCulling (skips hidden entities) and Noisium (faster world generation). Noisium is **server-only**, so it is not in the client pack: singleplayer worlds do not get it, dedicated servers do.

## Memory (Java heap)

- Prism: instance Settings, Java, Maximum memory allocation. Start with 4 GB for the base modset and add as you add content mods. Far more than needed makes garbage collection slower, so do not just max it out.
- Dedicated server: `MEMORY` in `server/.env` (default `4G`).
- Modrinth App: Settings, Resource management.

## Other fixes

- Lower render distance (8 to 10) and simulation distance (5 to 8).
- Profile before guessing: add Spark (`task mods:add -- spark`) and run `/spark profiler` in game.
- Many added mods raise startup time; remove what you do not need with `task mods:rm -- <slug>`.
- On integrated graphics keep graphics on "Fast" and turn off clouds and biome blend.

## Verify it worked

Frame rate is steadier, memory in F3 stays below the allocated maximum, and a Spark report shows no single mod dominating the tick.
