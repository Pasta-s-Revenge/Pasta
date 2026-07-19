# Pasta's Revenge

A mythic, multilingual, **client-side Bukkit → Folia bytecode transformer** for GitHub Pages.

## Transformer v2 proposal

This branch defines the next implementation stage: browser-side class-file parsing, verified call-site rewriting, runtime bridge injection, post-transform scanning, and downloadable JSON/HTML/Markdown audit reports.

### Planned automatic rewrites

| Legacy API | Replacement strategy | Safety condition |
|---|---|---|
| `BukkitScheduler.runTask*` | Injected bridge → `GlobalRegionScheduler` or `AsyncScheduler` | Returned `BukkitTask` is discarded |
| `scheduleSync*` / `scheduleAsync*` | Injected bridge → Folia scheduler | Returned task ID is discarded |
| `BukkitRunnable.runTask*` | Static bridge method preserving the runnable receiver | Returned `BukkitTask` is discarded |
| `Entity.teleport(Location)` | Bridge invokes `teleportAsync(Location)` on Folia | Boolean result is discarded |
| `Block.setType` / `setBlockData` | Bridge schedules mutation on the block location's `RegionScheduler` | Supported descriptor |
| `Block.breakNaturally` / `applyBoneMeal` | Region-scheduled bridge | Boolean result is discarded |

Calls whose result is used, task cancellation, synchronous chunk access, `isPrimaryThread`, ambiguous overloads, and method-handle references must remain manual findings.

## Bytecode design requirements

- Parse Java class files directly instead of searching decoded binary strings.
- Resolve constant-pool `Methodref` and `InterfaceMethodref` entries.
- Walk every method's `Code` attribute with variable-length instruction support.
- Replace `invokevirtual` with equal-length `invokestatic` instructions.
- Replace five-byte `invokeinterface` with `invokestatic` plus two `NOP` bytes.
- Keep branch targets, stack-map offsets, exception tables, and debug tables unchanged.
- Add new constant-pool entries without renumbering existing entries.
- Resolve local class hierarchies for `BukkitRunnable` subclasses.
- Scan nested JARs one level deep.
- Run analysis in a Web Worker.

## Reports

The v2 output must include `META-INF/pasta-report.json` and downloadable JSON, standalone HTML, and Markdown reports containing plugin identity, SHA-256, compatibility score, timing, transformed call sites, unresolved findings, bytecode offsets, nested archives, and signature-removal counts.

## Safety

`folia-supported: true` must only be written after a post-transform scan finds no blocking issue. Generated plugins still require testing on a disposable Folia server.

## Design references

The transformation categories are inspired by `MARVserver/pasta`, while conservative preconditions and refusal behavior are inspired by `MARVserver/Foliacode`. This project uses an independent implementation and does not copy source from `MARVserver/pasta`.

## License

AGPL-3.0-or-later. Modified network-hosted versions must provide corresponding source to users as required by the license.
