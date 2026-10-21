# Contributing to Mi Malla

Thanks for your interest in contributing! This guide explains how to report issues, propose changes and add new curricula.

## Ways to contribute

- **Report a bug:** [open an issue](https://github.com/bastianbeckeru/mimalla/issues) with the steps to reproduce it, the expected and the actual behavior, and your browser.
- **Suggest a feature:** open an issue describing the problem it solves before you start working on it, so we can agree on the approach.
- **Add or fix a curriculum:** see [Adding a curriculum](#adding-a-curriculum).
- **Improve the code or the docs:** open a pull request.

For questions, join the [Discord](https://discord.gg/wez3cJDzXk).

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
2. Keep each pull request focused on a single change.
3. Follow the [coding standards](CODING_STANDARDS.md).
4. Run `bun run verify` and make sure it passes. `bun run lint:write` fixes most Biome issues.
5. Describe what changed and why. Add screenshots for UI changes.
6. Link the issue the pull request resolves, if there is one.

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

Curricula are stored as JSON files in `src/server/db/curriculums/<institution-acronym>/<program-slug>.json`, and the institution list is in `src/server/db/data.ts`.

1. Copy an existing curriculum file from the same institution, or from another one, as a template.
2. Fill in the institution, department, program and course data. The shape is defined by `CurriculumData` in `src/types/curriculum.ts`.
3. Add the program to its institution and department in `src/server/db/data.ts`.
4. Check in the app that the curriculum imports and that prerequisites render correctly.
5. In the pull request, link the official source of the curriculum.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
