# PENCIL Bridge Project Archive

This document preserves the final internship context, scope, and decisions behind PENCIL Bridge.

## Project record

| Item | Detail |
| --- | --- |
| Company | PENCIL Co., Ltd. (株式会社ペンシル) |
| Program | Kyushu University QREC Venture Life Challenge 2026 (EDGE+) |
| Internship | August 17–29, 2026 |
| Final presentation | August 29, 2026, PwC Consulting, Fukuoka |
| Product | PENCIL Bridge / PENCIL People Bridge |
| Repository | `Jsmitty78/pencil-people-bridge` |
| Final prototype line | V2, originally developed on `bridge-system-v1` |

## Challenge

The internship challenge was to identify an important organizational issue related to growth, diverse employees, and AI, then propose and validate a solution.

The team found that useful context could be scattered across meetings, Chatwork, Backlog, Box, email, and verbal communication. HR could not attend every meeting or manually reconstruct every contradiction. A new frontline data-entry tool would add more burden, so the solution had to work from existing approved records.

## Direction selection

HR reviewed three early directions and ranked them **3 → 2 → 1**. The recommended direction combined:

- **Option 3:** objectively organize issues between employees, managers, and HR.
- **Option 2:** help managers communicate using needs and preferences that an employee has explicitly stated.

This produced the central principle:

> AI organizes the problem. Humans handle the relationship.

## Final scope decision

The final prototype focused on HR-only, issue-level review.

Included:

- Approved or fictional records grouped by work issue.
- Contradiction, missing-context, verbal-decision, and rework signals.
- Source-level evidence and neutral HR follow-up questions.
- Japanese and English review flows.
- A weekly HR report and feedback states.

Excluded:

- Employee scores or rankings.
- Emotion, personality, health, or sensitive-trait inference.
- Performance evaluation.
- Automatic HR, employment, or legal decisions.
- Confidential PENCIL employee data in the repository.

## Final demonstration

The public demonstration used fictional data only. It showed:

1. Simulated read-only workplace sources.
2. Ten fictional cases and 40 messages loaded into local browser storage.
3. A stored-data-to-detection pipeline.
4. Evidence-backed HR review candidates.
5. Private HR analysis and a separate staff-safe clarification draft.
6. Weekly report and CSV output.

Live demo: https://pencil-bridge-test.lovable.app

Team page: https://pencil-bridge-team.jakes02045.chatgpt.site

## Presentation structure

The final presentation was approximately eight minutes followed by five minutes of questions.

| Section | Speaker |
| --- | --- |
| Opening | Jake |
| Company context and HR challenge | Sydney |
| Interviews and focused features | Takeshi |
| Demo introduction and transition | Jake |
| Validation and engineer feedback | Sydney |
| Financials, roadmap, team, and conclusion | Jake |

The demo video was prepared with subtitles so the presentation did not depend on room audio.

## Financial planning case

The audience-facing model used planning assumptions, not guaranteed savings:

| Item | Assumption |
| --- | ---: |
| Annual HR time saved | 150 hours |
| HR time value | ¥3,000 per hour |
| Estimated annual value | ¥450,000 |
| Proposed 12-week pilot | ¥150,000 |
| Benefit-cost ratio | 3.0 |
| Annualized ROI | 200% |
| Estimated payback | 4 months |

## Validation standard

The project aimed to be a working prototype based on employee interviews, not only a clickable mockup. The next legitimate validation step is a permission-reviewed, read-only pilot measuring usefulness, false positives, HR review time, privacy, and trust.

## Roadmap

1. Test a short HR pilot with approved or anonymized cases.
2. Measure useful detections, false positives, review time, and trust.
3. Add controlled read-only connectors only after approval.
4. Preserve source references, access controls, and a short retention policy.
5. Expand beyond HR only after privacy and usefulness are validated.

## Preservation note

Raw presentation, finance, video, image, interview, and working files are retained separately from this public source repository. This repository contains the code and public-safe documentation needed to understand and reproduce the fictional prototype.

