# UniPilot — Legal Review Notes (ملاحظات للمراجعة القانونية)

**For the buyer:** Before deploying UniPilot in production, especially for EU or large institutions, consider having a lawyer review the following.

---

## 1. Terms of Service and Privacy Policy

- The in-app **Terms of Service** and **Privacy Policy** are in the codebase and linked from the app (e.g. Settings → Data & Privacy).
- **Recommendation:** Have them reviewed for compliance with:
  - **GDPR** (EU): lawful basis, data minimization, retention, rights (access, rectification, erasure, portability), DPA if using processors.
  - **Local law** (e.g. Jordan, KSA, UAE): data protection and education-sector requirements.
  - **Institution policy:** alignment with university rules on student data and AI use.

---

## 2. Data Processing and Subprocessors

- User data is stored in **PostgreSQL** (hosted e.g. on Render, Neon, or buyer’s server). AI features may send content to **GROQ** (or other LLM providers).
- **Recommendation:** If you are in the EU or have EU users, consider:
  - A **Data Processing Agreement (DPA)** with the database and AI providers.
  - Documenting subprocessors and, where required, obtaining user consent or legitimate interest for data sent to third parties.

---

## 3. License Agreement and Invoice

- **LICENSE_AGREEMENT_TEMPLATE.md** and **INVOICE_TEMPLATE.md** are templates. Have them reviewed under your jurisdiction (e.g. warranties, liability, tax, dispute resolution).

---

## 4. Accessibility and Discrimination

- Ensure the product’s use of AI and data does not discriminate. Consider accessibility (e.g. WCAG) if required by your institution or law.

---

## 5. Minors and Education

- If users may be minors, ensure Terms and Privacy are appropriate for minors and that consent (where required) is valid (e.g. parental or institutional).

---

This file is a checklist for the buyer; it is not legal advice. Consult a qualified lawyer for your situation.
