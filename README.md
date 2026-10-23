# [Mi Malla](https://mimalla.vercel.app)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Website](https://img.shields.io/badge/demo-mimalla.vercel.app-black)](https://mimalla.vercel.app)

Mi Malla is a web app that lets university students customize their curriculum ("malla curricular") and track their academic progress.

It is the successor of UniCore, an earlier project by the same author.

## Features

- **See prerequisites:** view the prerequisites of every course in your curriculum.
- **Set your own pace:** drag and drop courses between terms to fit your time and needs.
- **Track your progress:** mark courses as passed and follow your overall progress.
- **Start from an official curriculum:** import an official program curriculum and customize it.
- **Local first:** your data stays in your browser's local storage. No account is needed.

### Available programs

| Institution | Programs |
| --- | --- |
| Universidad de Chile (UCH) | Química y Farmacia |
| Universidad Diego Portales (UDP) | Derecho, Diseño, Ingeniería Civil (Plan Común, Industrial, Informática y Telecomunicaciones, Obras Civiles), Obstetricia y Neonatología, Psicología |

Is your program missing? See [Adding a curriculum](CONTRIBUTING.md#adding-a-curriculum).

## Tech stack

- [Bun](https://bun.sh)
- [Next.js](https://nextjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com/) on [Base UI](https://base-ui.com)
- [Motion](https://motion.dev)
- [@hello-pangea/dnd](https://github.com/hello-pangea/dnd)
- [Zustand](https://zustand.docs.pmnd.rs)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Biome](https://biomejs.dev)

## Getting started

Prerequisites: [Bun](https://bun.sh) 1.x. Mi Malla needs no environment variables or external services.

```sh
git clone https://github.com/bastianbeckeru/mimalla.git
cd mimalla
bun install
bun run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start the development server |
| `bun run build` | Build for production |
| `bun run start` | Serve the production build |
| `bun run lint` | Check formatting and lint rules with Biome |
| `bun run lint:write` | Apply Biome fixes |
| `bun run typecheck` | Type-check the project |
| `bun run verify` | Run `lint` and `typecheck` |

## Project structure

```
src/
├── app/            Next.js routes: landing, program pages, dashboard and curriculum JSON API
├── components/
│   ├── curriculum/ Curriculum grid, course cards and prerequisite paths
│   ├── dashboard/  Sidebar, dialogs and forms of the dashboard
│   └── ui/         shadcn/ui components
├── hooks/          Shared React hooks
├── server/db/      Curriculum JSON files and the build-time reader
├── stores/         Zustand stores persisted to local storage
├── styles/         Global and curriculum styles
├── types/          Shared types
└── utils/          Shared helpers
```

## Contributing

Contributions are welcome! Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [coding standards](CODING_STANDARDS.md) before opening a pull request.

Questions or ideas? Join the [Discord](https://discord.gg/wez3cJDzXk) or [open an issue](https://github.com/bastianbeckeru/mimalla/issues).

## License

Mi Malla is released under the [MIT License](LICENSE).
