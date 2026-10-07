# Devaswom

Frontend application built with React, TypeScript and Vite.

## Tech stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for dev server and builds
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for unit tests
- [Playwright](https://playwright.dev/) for end-to-end tests
- [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) for code quality

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm

## Getting started

```bash
npm install
npx playwright install chromium   # one-time: browser for e2e tests
npm run dev
```

The dev server runs at http://localhost:5173.

## Scripts

| Script                 | Description                              |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Start the Vite dev server                |
| `npm run build`        | Type-check and build for production      |
| `npm run preview`      | Preview the production build locally     |
| `npm run typecheck`    | Run the TypeScript compiler (no emit)    |
| `npm run lint`         | Lint with ESLint                         |
| `npm run lint:fix`     | Lint and auto-fix problems               |
| `npm run format`       | Format all files with Prettier           |
| `npm run format:check` | Check formatting without writing changes |
| `npm run test`         | Run unit tests once                      |
| `npm run test:watch`   | Run unit tests in watch mode             |
| `npm run test:e2e`     | Run Playwright end-to-end tests          |

## Project structure

```
├── e2e/               # Playwright end-to-end tests
├── public/            # Static assets served as-is
├── src/
│   ├── components/    # Shared UI components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities and non-UI logic
│   ├── test/          # Unit test setup
│   ├── App.tsx        # Root component
│   ├── index.css      # Tailwind entry point
│   └── main.tsx       # Application entry point
├── eslint.config.js
├── playwright.config.ts
└── vite.config.ts     # Vite + Vitest configuration
```
