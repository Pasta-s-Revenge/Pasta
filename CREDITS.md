# Credits, design references, and independent implementation

## Design references

- [MARVserver/pasta](https://github.com/MARVserver/pasta) — design reference for Bukkit-to-Folia bytecode transformation categories and runtime bridging.
- [MARVserver/Foliacode](https://github.com/MARVserver/Foliacode) — design reference for conservative transformation preconditions, explicit refusals, and post-transform reporting. FoliaCode is distributed under the MIT License.
- [JSZip](https://stuk.github.io/jszip/) — browser ZIP/JAR processing, distributed under the MIT License.

## Why this project is implemented independently

Pasta's Revenge does not copy or modify the source code, binaries, documentation, comments, error messages, visual assets, branding, or UI composition of `MARVserver/pasta`.

The project refers only to general technical ideas such as:

- inspecting Bukkit and Paper API calls;
- identifying operations that are unsafe under Folia's region-thread model;
- replacing selected invocation patterns with Folia-aware alternatives;
- routing compatibility behavior through a runtime bridge;
- producing an audit report after transformation.

Copyright generally protects a creator's concrete expression, such as specific source code, text, artwork, and other original material. It does not normally grant ownership over an abstract idea, method, system, procedure, interface requirement, or general software architecture by itself. Pasta's Revenge therefore uses independently written code and its own data structures, rule registry, transformation plan, verification stages, report format, terminology, and interface design.

This is not a claim that merely renaming symbols or rearranging copied code would avoid infringement. The implementation must remain independently authored at the level of structure and expression.

## Development safeguards

The project follows these rules:

1. Third-party source is not copied unless its license expressly permits reuse and all applicable conditions are satisfied.
2. Project-specific class layouts, comments, prose, error messages, illustrations, logos, and UI layouts are not reproduced.
3. Public Java class-file specifications and public Bukkit, Paper, and Folia API contracts may be used as interoperability references.
4. Each transformation rule is documented in Pasta's Revenge's own terminology and implemented from independently designed preconditions and verification logic.
5. Third-party dependencies are listed with their licenses and required notices.
6. Technical inspiration is credited even where attribution is not a substitute for license compliance.

## Legal scope

This document describes an engineering policy, not a legal guarantee. Copyright is only one consideration. Patent rights, trademarks, trade secrets, contract terms, repository licenses, and unfair-competition rules may impose separate obligations.

The supplied background artwork is used as a project visual asset. Folia, Paper, Bukkit, Spigot, and Minecraft are trademarks or projects of their respective owners. This project is not affiliated with Mojang Studios or PaperMC.
