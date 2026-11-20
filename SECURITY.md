# Security Policy

## Supported versions

Security fixes are provided for the latest released minor version. Older versions may receive documentation-only fixes at the maintainer's discretion.

## Reporting a vulnerability

Please **do not open a public issue** for a vulnerability.

Use GitHub's private vulnerability reporting for this repository:

<https://github.com/lw24-1936/dsh-agent-prompts/security/advisories/new>

Include:

- affected version,
- a minimal reproduction or description,
- impact (secret exposure, code execution, data loss, etc.),
- any suggested fix.

## Scope

- The plugin is a Host-only skill pack: it reads bundled Markdown/JS at activation and registers skills. It does not listen on a port, execute target code, or access the network at runtime.
- `resources/scan-redlines.mjs` and `resources/frontend-design/check-design.mjs` are read-only local scripts; they do not execute scanned code.
- Reports about vulnerable **user projects** are out of scope; this repository only ships the skill pack and scanners.
- Secrets found in the repository should be reported privately; do not paste the secret value in a public issue.

## Disclosure

We aim to acknowledge reports within a reasonable time and coordinate a fix/release before public disclosure.
