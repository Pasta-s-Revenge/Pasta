# Architecture

Pasta is a static GitHub Pages application. Plugin JAR bytes remain in the browser.

The first implementation performs conservative compatibility analysis and only marks `folia-supported: true` when no known unsafe API references are found. It never claims that static analysis proves complete thread safety.

A later bytecode transformer can be integrated behind the same worker interface after its rewrite preconditions and verification pass are implemented.
