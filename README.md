# Pasta's Revenge

A mythic, multilingual, **client-side Bukkit → Folia bytecode transformer** for GitHub Pages.

Upload a plugin JAR and the browser analyzes its class files, applies verified call-site rewrites, injects a compact runtime bridge, repackages the plugin, and produces a detailed audit report. The JAR is never uploaded or executed.

## Automatic rewrites

The current engine transforms these bytecode patterns when its safety preconditions pass:

| Legacy API | Replacement strategy | Safety condition |
|---|---|---|
| `BukkitScheduler.runTask*` | Injected bridge → `GlobalRegionScheduler` or `AsyncScheduler` | Returned `BukkitTask` is discarded |
| `scheduleSync*` / `scheduleAsync*` | Injected bridge → Folia scheduler | Returned task ID is discarded |
| `BukkitRunnable.runTask*` | Static bridge method preserving the runnable receiver | Returned `BukkitTask` is discarded |
| `Entity.teleport(Location)` | Bridge invokes `teleportAsync(Location)` on Folia | Boolean result is discarded |
| `Block.setType` / `setBlockData` | Bridge schedules the mutation on the block location's `RegionScheduler` | Supported descriptor |
| `Block.breakNaturally` / `applyBoneMeal` | Region-scheduled bridge | Boolean result is discarded |

Calls whose result is used are intentionally left unchanged and reported for manual migration. Task cancellation, synchronous chunk access, `isPrimaryThread`, ambiguous overloads, and method-handle references are also reported rather than silently rewritten.

## Bytecode design

The browser engine parses Java class files directly instead of searching decoded binary strings.

- Resolves constant-pool `Methodref` and `InterfaceMethodref` entries.
- Walks every method's `Code` attribute with variable-length instruction support.
- Replaces `invokevirtual` with equal-length `invokestatic` instructions.
- Replaces five-byte `invokeinterface` with `invokestatic` plus two `NOP` bytes.
- Keeps branch targets, stack-map offsets, exception tables, and debug tables unchanged.
- Adds new constant-pool entries without renumbering existing entries.
- Resolves local class hierarchies for `BukkitRunnable` subclasses.
- Scans nested JARs one level deep.
- Runs analysis in a Web Worker and processes classes concurrently.

The transformed test fixture passes JVM verification with `-Xverify:all`.

## Output and reports

Every valid input produces either:

- `plugin-folia.jar` when no blocking finding remains, or
- `plugin-folia-partial.jar` when safe rewrites were applied but manual work remains.

`folia-supported: true` is written only for a clean result. The application removes invalidated JAR signatures and embeds `META-INF/pasta-report.json`.

The UI also exports:

- JSON report
- Standalone HTML report
- Markdown report

Reports contain the plugin identity, SHA-256 input hash, compatibility score, timing, transformed call sites, unresolved findings, original and replacement descriptors, class/method names, bytecode offsets, nested archives, and signature removal counts.

## Runtime bridge

`runtime/FoliaBridge.java` is the corresponding source for the Java 17 class embedded in `bytecode-worker.js`. It uses Folia scheduler APIs through reflection and falls back to legacy Paper/Bukkit behavior when Folia APIs are unavailable.

The bridge changes timing semantics for some operations. A generated JAR must still be tested on a disposable Folia server before production use.

## Supported interface languages

- English
- 日本語
- Deutsch
- 繁體中文（台灣）
- 简体中文
- Italiano
- Español

## Local development

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`. A normal file URL is insufficient because the transformer uses a Web Worker.

Syntax validation:

```bash
node --check app.js
node --check bytecode-worker.js
```

## Deployment

The GitHub Actions workflow validates the JavaScript and deploys the repository root to GitHub Pages after changes reach `main`.

## Design references

The transformation categories are inspired by `MARVserver/pasta`, while the conservative safety checks and refusal model are inspired by `MARVserver/Foliacode`. This repository contains an independent browser implementation; source from `MARVserver/pasta` is not copied into this project.

## License

AGPL-3.0-or-later. Modified network-hosted versions must provide their corresponding source to users as required by the license.
