# Coding Standards

Biome enforces `type` over `interface`, `import type`, and the `@/*` alias for internal imports (`biome.json`).

## Naming and comments

- Carry intent in names, in code and in types. Code and types are self-explanatory, so they hold no comments; tool directives (`biome-ignore`, `@ts-expect-error`) are the only exception.
- Write logs in English.

## Errors

- Let errors propagate. Catch only to recover locally or to give the user feedback.

## Modules and types

- Put pure helpers, parsers, and domain utilities (URL/subdomain handlers, formatters, sanitizers) in `@/utils` once two or more modules use them. Keep single-use logic in its file; extract it only when that simplifies the caller. A util that merely renames an expression is noise.
- Put types shared by two or more modules in `@/types`; keep single-use types in the file that uses them. Import a type from where it is defined; do not re-export it.
- Export only what another module imports.
- Delete code that has no caller in production.

## State and props

- Pass shared state through composition (`children`, slots) or colocate it with its consumers. For complex trees with a lot of shared state, consider a context provider.
