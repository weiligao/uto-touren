# Contributing to UtoTouren

Thank you for taking the time to contribute! Whether you're fixing a bug, improving accessibility, or proposing a new feature, you're welcome here.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Commit Messages](#commit-messages)
- [Code Style](#code-style)
- [Testing](#testing)
- [Security Vulnerabilities](#security-vulnerabilities)

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/) Code of Conduct. By participating, you agree to uphold a respectful and inclusive environment. Unacceptable behaviour can be reported to the maintainer directly via GitHub.

## Reporting Bugs

Before opening an issue, please:

1. Search [existing issues](https://github.com/weiligao/uto-touren/issues) to avoid duplicates.
2. Reproduce the problem on the latest `main` branch.

When filing a bug report, include:

- A clear, descriptive title.
- What happened (the actual behaviour).
- What you expected to happen instead.
- Steps to reproduce (numbered list).
- Browser, OS, and version.
- Relevant console errors or screenshots.

## Suggesting Features

Open a [GitHub Discussion](https://github.com/weiligao/uto-touren/discussions) for general ideas, or use the [feature request template](https://github.com/weiligao/uto-touren/issues/new?template=feature_request.md) to open an issue. Describe:

- The problem you're trying to solve.
- Your proposed solution or idea.
- Any alternatives you've considered.

## Development Setup

```bash
git clone https://github.com/weiligao/uto-touren.git
cd uto-touren
npm install
npm run dev          # http://localhost:3000
```

Run checks before committing:

```bash
npm run lint         # ESLint
npm test             # Vitest
npm run build        # Ensure the production build passes
```

## Pull Request Process

1. **Open or find an issue** for the change you want to make.
2. **Create a branch from the issue** using the "Create a branch" button on the issue page. GitHub will name it `<issue-number>-short-title` and automatically link the branch to the issue.
3. Fork the repo if you don't have write access, then check out the branch locally:
   ```bash
   git fetch origin
   git checkout <issue-number>-short-title
   ```
4. Keep PRs focused. **One logical change per PR** — avoid mixing unrelated fixes.
5. **Update tests** for any logic changes in `src/lib/`.
6. Open a PR from your branch. Because the branch was created from the issue, GitHub links them automatically via the Development sidebar. This repo has auto-close enabled, so the issue will close automatically when the PR merges.
7. A maintainer will review your PR. Please respond to feedback promptly or let us know if you need more time.

## Commit Messages

All commits must be **signed** with a GPG or SSH key. See [GitHub's guide on signing commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits) to set this up. Unsigned commits will be blocked by branch protection rules.

This project uses [release-please](https://github.com/googleapis/release-please) to automate versioning, releases, and changelog generation. It reads commit types to determine the next semantic version, so consistent prefixes are essential. Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification:

```
<type>(optional scope): <short summary>

[optional body]

[optional footer(s)]
```

The most important prefixes are:

| Type | When to use | SemVer impact |
|------|-------------|---------------|
| `fix:` | Bug fix | Patch |
| `feat:` | New feature | Minor |
| `feat!:` / `fix!:` / `<type>!:` | Breaking change (indicated by `!`) | Major |

Use the imperative mood in the summary: **"add calendar swipe"**, not ~~"added calendar swipe"~~.

## Code Style

- **Functional React components** only — no class components.
- **Named exports** only — use `export function Foo`, never `export default`.
- **PascalCase file names** for components — e.g. `CalendarView.tsx`.
- **`'use client'` directive** — add it at the top of any component that uses React hooks.
- **No `any`** — TypeScript strict mode is enabled; give everything a proper type.
- **`import type`** for type-only imports — e.g. `import type { Tour } from '@/lib/types'`.
- **Tailwind CSS** for all styling — avoid inline `style` props unless positioning requires dynamic values.
- **Accessibility first** — all interactive elements need keyboard support, ARIA labels where semantics are insufficient, and sufficient colour contrast (WCAG 2.2 AA).

## Testing

Unit tests live in `src/lib/utils.test.ts` and use [Vitest](https://vitest.dev).

- Add a test for every new utility function or non-trivial logic change.
- Tests must be deterministic — avoid `Date.now()` or `Math.random()` without mocking.
- All existing tests must continue to pass: `npm test`.

## Security Vulnerabilities

**Please do not open public issues for security vulnerabilities.**

Report them privately to the maintainer via [GitHub private vulnerability reporting](https://github.com/weiligao/uto-touren/security/advisories/new). Include a description, steps to reproduce, and potential impact. You'll receive a response within 72 hours.
