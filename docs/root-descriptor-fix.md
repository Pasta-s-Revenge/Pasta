# Root descriptor validation

Folia reads plugin descriptors from the archive root. The transformer must patch and verify only root-level `plugin.yml` and `paper-plugin.yml` entries before emitting a Folia-marked artifact.
