# Pasta report schema

The transformer report will be emitted as `META-INF/pasta-report.json` and as downloadable JSON, HTML, and Markdown.

Required fields:

- tool and engine version
- source file name and SHA-256
- plugin name, version, main class, and API version
- class, method, invocation, and nested-JAR counts
- elapsed analysis and packaging time
- compatibility score
- transformed call sites with class, method, descriptor, bytecode offset, rule, and replacement
- unresolved findings with severity, reason, and remediation
- removed signatures
- post-transform verification result
