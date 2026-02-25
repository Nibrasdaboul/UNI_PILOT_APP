# UniPilot — npm audit notes (T10)

Run `npm run audit` (or `npm audit`) to check for vulnerabilities. Use `npm run audit:fix` for safe fixes.

## Current known issues (as of last check)

| Package | Severity | Note |
|--------|----------|------|
| **dompurify** (via jspdf) | moderate | XSS advisory. Fix: `npm audit fix --force` would upgrade jspdf to 4.2.0 (breaking). Acceptable for now; buyer should upgrade jspdf when possible. |
| **esbuild** (via vite) | moderate | Dev server only. Fix would upgrade to Vite 7 (breaking). Not exposed in production build. |

- **Recommendation:** Run `npm audit` before release. For production, consider upgrading jspdf when a non‑breaking path is available, and upgrade Vite in a dedicated dependency update.
- **Critical:** If any **critical** vulnerability appears, fix or document and plan a fix before handover.
