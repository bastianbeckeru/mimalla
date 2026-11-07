# Contributing to Mi Malla

Thanks for your interest in contributing! This guide explains how to report issues, propose changes and add new curricula.

## Ways to contribute

- **Report a bug:** [open an issue](https://github.com/bastianbeckeru/mimalla/issues) with the steps to reproduce it, the expected and the actual behavior, and your browser.
- **Suggest a feature:** open an issue describing the problem it solves before you start working on it, so we can agree on the approach.
- **Add or fix a curriculum:** see [Adding a curriculum](#adding-a-curriculum).
- **Improve the code or the docs:** open a pull request.

For questions, join the [Discord](https://discord.gg/wez3cJDzXk).

## Before you start

Opening a pull request does not oblige the maintainers to review or merge it. We may ask for a smaller scope, defer it or close it.

- **Likely to be accepted:** bug fixes, performance improvements, accessibility, documentation and new or corrected curricula.
- **Needs approval first:** features and changes to existing behavior. Open an issue and wait for a maintainer to agree on the direction and scope. Link that approval in your pull request. Calling a behavior change a bug fix does not skip this step.
- **No approval needed:** a very small fix for an obvious bug, and curriculum contributions. For the fix, explain the defect in the pull request.

## Development setup

1. Fork the repository and clone your fork.
2. Install [Bun](https://bun.sh) 1.x.
3. Install dependencies and start the development server:

   ```sh
   bun install
   bun run dev
   ```

No environment variables are needed.

## Pull requests

1. Create a branch from `main` (for example `feat/course-search` or `fix/drag-on-mobile`).
2. Solve one underlying problem per pull request. If it fixes several independent problems, we will ask you to split it, even when each fix is useful. Include the tests and docs that problem needs, but put unrelated cleanups in their own pull request.
3. Follow the [coding standards](CODING_STANDARDS.md).
4. Run `bun run verify` and make sure it passes. `bun run lint:write` fixes most Biome issues.
5. Describe what changed and why, and link the issue it resolves, if there is one.
6. Provide [evidence](#evidence) that the change works.

### Evidence

Explain how you reproduced the problem, how you checked the fix and what you observed. Include the steps, your browser and any test you ran. Say what you could not check. "Tests pass" alone does not show that the change works.

UI changes need before and after screenshots. Add a short recording when the change involves motion or interaction, such as drag and drop.

### AI-assisted pull requests

You may use AI tools. You are responsible for the result: read the diff, run it and be able to explain every change. Agents must follow [AGENTS.md](AGENTS.md).

### Closing pull requests

We may close a pull request that breaks these rules, such as missing approval, mixed scope or missing evidence. We will name the rule and what to fix, and you can request a new review once you have addressed it.

## Commit messages

Commits follow this format:

```
<type>[(<scope>)]: <subject>
```

Write the subject in English, in the imperative mood ("add", not "added").

| Type | Use |
| --- | --- |
| `release` | Publish to production |
| `feat` | Add a new feature |
| `fix` | Fix a bug |
| `refactor` | Change code without changing behavior |
| `style` | Change styles or formatting |
| `perf` | Improve performance |
| `chore` | Update tooling, dependencies or config |
| `docs` | Change documentation |

Examples:

```
feat(curriculum): add course search
fix: keep course order after drag and drop
```

## Versioning

Mi Malla follows [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`):

- `release` bumps MAJOR.
- `feat` bumps MINOR.
- `fix` bumps PATCH.

Maintainers update `version` in `package.json` when they publish a release.

## Adding a curriculum

Curricula are stored as curriculum files in `src/server/db/curriculums/<institution-acronym>/<program-slug>_<effective-year>.malla`, the same format the builder downloads (ADR 0004). The program list, routes, versions and search are derived from these files.

1. Lay out the curriculum in the builder (`/builder`), or write the file from the official PDF following `public/builder/pdf-to-malla.md`, and download it.
2. Save it in the folder of its institution. A new version of an existing program is a new file with its effective year.
3. For a new program, register its department, SIES and DEMRE codes and schedule in `src/server/db/programs.ts`, and its institution if it is new. The institution name must match the one in the file.
4. Run `bun test`, which loads every curriculum file, and check the program page in the app.
5. In the pull request, link the official source of the curriculum and confirm that you checked every course, credit and prerequisite against it. This applies in particular if an LLM converted the PDF.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
