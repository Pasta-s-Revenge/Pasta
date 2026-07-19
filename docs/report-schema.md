# Pasta report schema

The v2 browser prototype emits `META-INF/pasta-report.json` and a downloadable JSON report.

Current report fields:

- tool and engine version
- source file name, size, and SHA-256
- class count and elapsed time
- compatibility score
- transformed call sites with class, method, descriptor, bytecode offset, rule, and replacement status
- unresolved findings with severity and reason
- removed signatures

## Implemented prototype

The executable prototype is available at `v2.html`.

It performs direct Java class-file parsing in the browser and applies one verified rewrite:

- `Entity.teleport(Location): boolean` to `Entity.teleportAsync(Location): CompletableFuture` when the following bytecode instruction discards the result with `POP`.

The transformer appends new constant-pool entries without renumbering existing entries and keeps the five-byte `invokeinterface` instruction length unchanged. Other Folia-sensitive calls are reported as manual findings rather than being silently rewritten.

Future commits will expand the verified rewrite matrix and add standalone HTML and Markdown exports.