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
3. Install dependencies, start a [local database](#local-database) and start the development server:

   ```sh
   bun install
   bun run dev
   ```

The app reads the catalog from Postgres, so `bun run dev`, `bun run build` and `bun run start` need `DATABASE_URL`. The build prerenders every published program, so the database must hold at least one published curriculum.

### Local database

To run Mi Malla against a local database, install [Docker](https://docs.docker.com/get-docker/) and run, from the repository root:

```sh
cp .env.example .env
docker compose up -d
bun run db:seed
```

- `docker compose up -d` starts Postgres 17 on `localhost:5432`, as defined in `compose.yaml`. Data persists in the `pgdata` volume.
- `bun run db:seed` applies the migrations in `drizzle/` and imports the sample seed in `seed/`. Running it again is safe: curriculums already in the database are skipped.
- The connection string comes from `DATABASE_URL`. Bun and Next load it from `.env`. A Neon connection string (`*.neon.tech`) makes the app use the Neon HTTP driver; any other uses `pg`.

The sample seed holds two programs of a fictional institution, Universidad de Ejemplo (`UE`), that share their basic science and general education courses. It is not real data. Check it with `bun run validate seed`.

To stop Postgres, run `docker compose down`. Add `-v` to also delete the data and start from scratch.

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

The catalog lives in Postgres. A curriculum enters it through a curriculum file that is validated and imported, and only published curriculums are shown.

1. Copy a file from `seed/` as a template and fill in the institution, department, program and course data. Check it with `bun run validate <file>`.
2. Import it as a draft with `bun run import <file> [--slug <program-slug>]`. Pass `--replace` to fix a curriculum that already exists for the program and year, and `--publish` to publish it right away.
3. Publish a draft with `bun scripts/publish-curriculum.ts <curriculum-id>`.
4. Check in the app that the curriculum renders and that prerequisites are right.

The app caches the catalog and the curriculum pages. After an import or a publish, the scripts ask the app at `APP_URL` to refresh them by calling `POST /api/revalidate` with `REVALIDATE_SECRET`, which must match the app's. Without `APP_URL` and `REVALIDATE_SECRET` they print a warning and the pages keep the old data until the next build.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
