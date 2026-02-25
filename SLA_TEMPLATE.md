# UniPilot — SLA Template (Optional)

**Use this only if the buyer agrees to a formal SLA.** Adjust numbers and compensation as needed.

---

## Service level

- **Uptime target:** [99% / 99.5%] of the time over a calendar month (excluding planned maintenance and buyer-side issues).
- **Measurement:** Based on successful responses from `GET /api/health` or `GET /api/ready` at [5]-minute intervals from a mutually agreed monitoring endpoint.

---

## Response times (during support period)

- **Critical (production down):** Response within [4] business hours. Best effort to restore within [24] hours.
- **High (major feature broken):** Response within [1] business day.
- **Medium / Low:** Response within [2–3] business days.

---

## Planned maintenance

- Maintenance windows (e.g. database or server updates) will be announced [24–48] hours in advance when possible and kept as short as practicable.

---

## Compensation (optional)

- If uptime in a month is below [99%], Licensor will credit [X% of monthly support fee / one extra week of support]. This applies only if a paid support or SLA fee is in effect; one-time license has no recurring fee unless separately agreed.

---

## Exclusions

- Outages due to buyer’s changes, third-party providers (e.g. Render, GROQ), DDoS, or force majeure are excluded from uptime calculation.

---

**Note:** For the standard one-time license, support is as in **SUPPORT_POLICY.md**; this SLA template is for optional extended or premium support agreements.
