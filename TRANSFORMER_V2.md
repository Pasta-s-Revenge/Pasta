# Transformer v2 implementation plan

This document tracks the browser-side Bukkit-to-Folia transformer architecture proposed for the next release.

## Engine phases

1. Open JAR locally in the browser.
2. Parse plugin metadata and compute SHA-256.
3. Parse class files and resolve method references from the constant pool.
4. Apply only offset-stable rewrites whose return values are discarded.
5. Inject a Java 17 runtime bridge.
6. Re-scan transformed classes.
7. Add `folia-supported: true` only when no blocking finding remains.
8. Repackage the JAR and generate JSON, HTML, and Markdown reports.

## Required validation

- JVM verification with `-Xverify:all` fixtures.
- Branch-target and exception-table invariance tests.
- Constant-pool growth tests.
- Signed-JAR signature removal tests.
- Nested-JAR analysis tests.
- Refusal tests for used task handles and ambiguous APIs.

## UI target

The interface will expose processing phases, compatibility score, plugin identity, transformed-site count, unresolved findings, nested archive count, timing, and report downloads in the mythic Pasta's Revenge visual language.
