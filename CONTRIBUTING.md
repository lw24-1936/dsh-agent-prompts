# Contributing

Thanks for improving `dsh-agent-prompts`.

## Before you start

- Read [AGENTS.md](./AGENTS.md) for the repo's agent instructions and file map.
- Read [docs/SKILL-AUTHORING.md](./docs/SKILL-AUTHORING.md) before adding or changing a skill.
- For behavior/architecture, see [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Setup

```bash
npm run verify
npm pack --dry-run
```

No dependencies are required; Node.js >= 20.

## Adding or changing a skill

1. Edit `skills/<name>.md` and/or `resources/`.
2. Update `lib/index.js` `SKILLS` (description ≤500 chars, whenToUse, file).
3. Update `test/content.test.mjs`, `test/plugin.test.mjs`, `test/tarball.test.mjs`.
4. Update `README.md`, `README.en.md`, `AGENTS.md`, `resources/AGENTS.snippet.md` if the catalog changes.
5. Run `npm run verify`; add a test for new behavior.
6. Update `CHANGELOG.md`.

## Commit / PR

- One logical change per commit; Conventional Commits (`feat(scope): ...`, `fix(scope): ...`, `docs: ...`).
- PR body: goal, changes, verification commands/results, risks, UI before/after if applicable, unverified items.
- Do not mix unrelated refactors/dependency bumps.
- Do not weaken tests/lint or delete assertions to get green.

## Content rules

- No hard technology version pins; read versions from the project.
- Do not copy large portions of third-party skills; summarize and cite in `NOTICE.md`.
- No secrets, real customer data, internal URLs, or generated binaries.
- Keep skill descriptions trigger-focused and under 500 characters.

## License

By contributing, you agree your changes are licensed under the MIT License (see [LICENSE](./LICENSE)).
