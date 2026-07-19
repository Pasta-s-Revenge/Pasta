# Pasta's Revenge

A mythic, multilingual, client-side Folia compatibility gate for Bukkit and Paper plugin JARs.

## What it does

- Processes the uploaded JAR entirely inside the browser.
- Scans Java class constant-pool strings for known Folia-sensitive APIs.
- Refuses to create an output when critical or ambiguous references remain.
- Removes invalidated JAR signature files after modification.
- Adds `folia-supported: true` to `plugin.yml` or `paper-plugin.yml` only after the conservative gate passes.
- Generates a new `*-folia.jar` and embeds `META-INF/pasta-report.json`.
- Supports English, Japanese, German, Traditional Chinese (Taiwan), Simplified Chinese, Italian and Spanish.

## Important limitation

This first web implementation is a **conservative manifest patcher and static gate**, not a general bytecode converter. A clean scan is not proof of thread safety. Always verify the generated plugin on a disposable Folia server before production use.

The design follows FoliaCode's principle that refusing an unsafe transformation is preferable to silently producing a broken JAR.

## Local development

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Deployment

The included GitHub Actions workflow deploys the repository root to GitHub Pages after changes reach `main`.

## License

AGPL-3.0-or-later. Modified network-hosted versions must provide their corresponding source to users as required by the license.

FoliaCode attribution is documented in [CREDITS.md](CREDITS.md).
