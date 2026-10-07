# Frontend Interview Prep

Five React + TypeScript features, each shipped as its own pull request. Every question lives on its own route, linked from the home page.

| #   | Question                 | PR link                                                           |
| --- | ------------------------ | ----------------------------------------------------------------- |
| 1   | Todo App                 | [#1](https://github.com/alphyemmanuel95/fe-interview-prep/pull/1) |
| 2   | Live Search              | [#2](https://github.com/alphyemmanuel95/fe-interview-prep/pull/2) |
| 3   | Registration Wizard      | [#3](https://github.com/alphyemmanuel95/fe-interview-prep/pull/3) |
| 4   | Data Table               | [#4](https://github.com/alphyemmanuel95/fe-interview-prep/pull/4) |
| 5   | Login & Session Handling |                                                                   |

**Video:**

## Tech stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (strict mode)
- [Vite](https://vite.dev/) for the dev server and builds
- [React Router](https://reactrouter.com/) for page routing
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for unit and component tests
- [Playwright](https://playwright.dev/) for end-to-end tests
- [ESLint](https://eslint.org/) (typescript-eslint strict, type-checked) + [Prettier](https://prettier.io/)

## Getting started

Requires Node.js 20.19+ or 22.12+ and npm.

```bash
npm install
npx playwright install chromium   # one-time: browser for e2e tests
npm run dev                       # http://localhost:5173
```

## Scripts

| Script                 | Description                                |
| ---------------------- | ------------------------------------------ |
| `npm run dev`          | Start the Vite dev server                  |
| `npm run build`        | Type-check and build for production        |
| `npm run preview`      | Preview the production build locally       |
| `npm run typecheck`    | Run the TypeScript compiler (no emit)      |
| `npm run lint`         | Lint with ESLint (zero warnings allowed)   |
| `npm run lint:fix`     | Lint and auto-fix problems                 |
| `npm run format`       | Format all files with Prettier             |
| `npm run format:check` | Check formatting without writing changes   |
| `npm run test`         | Run unit and component tests once          |
| `npm run test:watch`   | Run unit and component tests in watch mode |
| `npm run test:e2e`     | Run Playwright end-to-end tests            |

## Project structure

```
├── e2e/               # Playwright end-to-end tests
├── public/            # Static assets served as-is
├── src/
│   ├── components/    # Shared UI components (layout, …)
│   ├── hooks/         # Reusable React hooks
│   ├── lib/           # Framework-agnostic utilities
│   ├── pages/         # Route-level pages
│   ├── test/          # Unit test setup
│   ├── questions.ts   # Question registry: drives routes and the home page
│   ├── App.tsx        # Route definitions
│   └── main.tsx       # Application entry point
├── eslint.config.js
├── playwright.config.ts
└── vite.config.ts     # Vite + Vitest configuration
```

Each question adds one entry to `src/questions.ts`, which registers its route and its link on the home page.
