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
- rewrites `Entity.teleport(Location)` to `teleportAsync(Location)` only when its boolean result is immediately discarded;
- reports Bukkit scheduler, BukkitRunnable, synchronous chunk access, and region-owned block operations as manual findings;
- removes invalidated JAR signatures;
- writes `folia-supported: true` only when no manual finding remains;
- embeds `META-INF/pasta-report.json`;
- exports a downloadable JSON audit report;
- never uploads or executes the plugin.

This is a narrow verified transformer, not a claim that every Bukkit plugin can be converted safely. Generated JARs must be tested on a disposable Folia server.

## Local development

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/v2.html`.

## License

AGPL-3.0-or-later. Modified network-hosted versions must provide their corresponding source to users as required by the license.

Design attribution is documented in [CREDITS.md](CREDITS.md).