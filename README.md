# [Mi Malla](https://mimalla.vercel.app)

Web application for university students. Derived from a past project, UniCore.

# Tecnologies and Dependencies

- [Bun](https://bun.sh)
- [Next.js](https://nextjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com/) on [Base UI](https://base-ui.com)
- [Motion](https://motion.dev)
- [@hello-pangea/dnd](https://github.com/hello-pangea/dnd)
- [Zustand](https://zustand.docs.pmnd.rs)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Biome](https://biomejs.dev)

# Development

```
bun install
bun run dev
```

`bun run verify` runs `lint` and `typecheck`; `bun run lint:write` applies Biome fixes. See `CODING_STANDARDS.md`.

# Git Commits Messages Style and Versioning

## [Versioning](https://semver.org/)

```
MAJOR.MINOR.PATCH
```

- `release:` Publish to production (equivalent to a MAJOR).
- `feat:` Add a new feature (equivalent to a MINOR).
- `fix:` Fix a bug (equivalent to a PATCH).

Don't forget to change the version in `package.json`

## [Git Commits Messages Style](https://gist.github.com/rishavpandey43/84665ffe3cea76400d8e5a1ad7133a79)

```
[:<Emoji>: ][<Type>[(<Scope>)]: ]<Subject>
```

### Common Commits

```
git commit -m ":confetti_ball: release:"
```

```
git commit -m ":star: feat:"
```

```
git commit -m ":bug: fix:"
```

```
git commit -m ":rotating_light: refactor:"
```

```
git commit -m ":lipstick: style:"
```

```
git commit -m ":chart_with_upwards_trend: perf:"
```

```
git commit -m ":wrench: chore:"
```

```
git commit -m ":pencil: docs:"
```

# Proyect Structure

## App

## Components

## Server

## Stores
