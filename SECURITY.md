# Security policy

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Use [GitHub private vulnerability reporting](https://github.com/weiligao/utomate/security/advisories/new) to submit a report confidentially. Please include:

- A description of the vulnerability
- Steps to reproduce
- Potential impact

You will receive a response within 72 hours.

## Scope

This project is a read-only web scraper and calendar export tool. It does not collect, store, or process personal data beyond standard server request logs handled by Vercel. The main attack surface is the server-side scraping endpoint (`/api/scrape`).

## Supported versions

Only the latest release on `main` is actively maintained.
