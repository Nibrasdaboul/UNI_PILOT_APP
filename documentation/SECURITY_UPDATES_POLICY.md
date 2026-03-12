# UniPilot — Security Updates Policy (سياسة تحديثات الأمان)

---

## During support period

- For [30 / 90] days after delivery (see **SUPPORT_POLICY.md**), we will provide **security updates** for the UniPilot code we delivered. This includes patches for vulnerabilities in our code and guidance for critical vulnerabilities in dependencies (e.g. npm audit).

---

## After support period

- **No obligation:** After the support period ends, there is no contractual obligation to provide new security patches.
- **Best effort:** We may, at our discretion, publish or share critical security fixes for the last delivered version; we will not guarantee timelines or scope.
- **Recommendation:** The buyer should:
  - Run `npm audit` and update dependencies as needed.
  - Monitor security advisories for Node, React, Express, PostgreSQL, and other stack components.
  - Consider extending support or a separate maintenance agreement if long-term security updates are required.

---

## Notice before ending security support

- If we decide to stop providing any security updates (e.g. for an old major version), we will give [30] days’ notice by email or a notice in the repository, when feasible.

---

## What counts as a security update

- Patches that fix vulnerabilities that could lead to unauthorized access, data loss, or denial of service in the delivered UniPilot application or its documented dependencies.

---

**Summary:** Security updates are provided during the support period. After that, best effort only; buyer should maintain dependencies and consider a maintenance agreement for long-term coverage.
