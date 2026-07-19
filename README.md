# Pasta's Revenge

A mythic, multilingual, client-side Folia compatibility gate for Bukkit and Paper plugin JARs.

## Stable interface

Open `index.html` for the current conservative analyzer and manifest patcher.

## Bytecode transformer v2 prototype

Open `v2.html` for the executable browser transformer prototype.

The v2 prototype:

- parses Java class files directly in the browser;
- resolves constant-pool method references;
- walks method bytecode with variable-length instruction handling;
- records exact class, method, descriptor, and bytecode offsets;
- reports Bukkit scheduler, BukkitRunnable, synchronous chunk access, entity, and region-owned block operations;
- removes invalidated JAR signatures;
- embeds `META-INF/pasta-report.json`;
- exports a downloadable JSON audit report;
- never uploads or executes the plugin.

## Conversion modes

### Safe

Refuses to create a JAR when unresolved Folia-sensitive findings remain. This is the default mode.

### Partial

Creates a `*-folia-partial.jar` containing only verified changes. Unresolved findings remain and are included in the audit report. `folia-supported: true` is not added while manual findings remain.

### Force

Creates a `*-folia-force.jar` even when unresolved findings remain and forcibly writes `folia-supported: true` so Folia will attempt to load the plugin.

Force Mode does **not** make unresolved calls thread-safe and does not claim verification. It requires an explicit risk acknowledgement in the UI and adds:

- `mode: "force"` and `verified: false` to `META-INF/pasta-report.json`;
- unresolved/unsafe finding counts;
- `META-INF/PASTA-FORCE-MODE.txt` containing a prominent warning;
- a distinct filename and red unverified status in the UI.

Force-generated JARs can crash, violate region ownership, or corrupt server state. Test them first on a disposable Folia server with backups.

This remains a narrow transformer, not a claim that every Bukkit plugin can be converted safely.

## Local development

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/v2.html`.

## License

AGPL-3.0-or-later. Modified network-hosted versions must provide their corresponding source to users as required by the license.

Design attribution is documented in [CREDITS.md](CREDITS.md).
