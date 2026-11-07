# Design

## Fonts

The app uses two fonts on every route, landing included:

- **Montserrat** for titles: `h1`, `h2` and `h3`.
- **Inter** for all other text.

`src/app/layout.tsx` loads both, and `src/styles/globals.css` applies them. A route inherits them from there and adds no `next/font` of its own.

A design file may show another font when its tool lacks these two. Keep Montserrat and Inter when you build it.
