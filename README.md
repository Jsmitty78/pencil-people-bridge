# PENCIL People Bridge

Working AI prototype for the PENCIL Internship 2026.

> **Core principle:** AI organizes the problem. Humans handle the relationship.

## What we are building

Prototype V0 is the **HR Issue Organizer**: it helps HR separate reported facts, interpretations, concerns/emotions, missing information, desired outcomes, neutral questions to clarify, and possible next steps.

The AI does **not** decide who is right, diagnose employees, or replace HR/manager judgment.

## Current progress

### Prototype V0 — in progress

The `prototype-v1` branch now contains the first real MVP slice:

- Japanese-first web interface
- Guided, anonymized intake with an information-completeness indicator
- Free-form anonymized notes as an alternative input mode
- Free local AI using Ollama and `qwen3:4b`
- Structured HR output for:
  - Facts
  - Interpretations
  - Concerns / emotions
  - Missing information
  - Questions to clarify
  - Desired outcomes
  - Possible next steps
- Human-review warning
- Privacy/diagnosis guardrails
- Editable HR review for every AI-generated section, including add/delete controls
- Explicit HR approval before the final meeting-preparation view is unlocked
- A local copy action for the HR-reviewed summary

The V0 scope is intentionally limited to the HR Issue Organizer.

## Run the V0 locally

```bash
git clone https://github.com/Jsmitty78/pencil-people-bridge.git
cd pencil-people-bridge
git checkout prototype-v1
npm install
ollama pull qwen3:4b
ollama serve
npm run dev
```

Then open `http://localhost:3000`.

## MVP flow

1. HR answers short, guided questions about an anonymized workplace concern.
2. The UI combines those answers into a structured note and marks blank areas as unknown.
3. AI organizes the issue without deciding who is right or wrong.
4. HR edits, deletes, or manually adds items in a separate review copy.
5. HR explicitly approves the reviewed version.
6. Only the approved HR-reviewed content is mapped into before/during/after meeting preparation.
7. Humans make all final decisions and handle the relationship.

## Why V0 uses guided intake

A single large text box makes output quality depend too heavily on how much time the HR user has and how they structure their writing. Guided intake asks separately about the reported event, timing/frequency, source of the information, available records, other perspectives, explicitly expressed concerns/emotions, and the employee's desired outcome. Empty fields are sent to the model as unknown rather than silently omitted.

This follows the general shape of established HR listening and investigation guidance:

- [Acas investigation planning](https://www.acas.org.uk/investigations-for-discipline-and-grievance-step-by-step/step-2-preparing-for-an-investigation) identifies the issue, people to speak with, evidence sources, time limits, and confidentiality before deciding outcomes.
- [Japan Ministry of Health, Labour and Welfare consultation guidance](https://www.mhlw.go.jp/file/06-Seisakujouhou-11900000-Koyoukintoujidoukateikyoku/0000181888.pdf) recommends confirming the consultation content with the person, creating a record where needed, and then verifying facts and considering responses.
- [Microsoft Viva Glint's ACT approach](https://learn.microsoft.com/en-us/viva/glint/reports/take-action-team-conversations) connects feedback to an ongoing conversation: acknowledge the current situation, collaborate on the destination, and take one step forward.

### Data-collection options considered

| Option | Benefit | Main risk / cost | V0 decision |
| --- | --- | --- | --- |
| Guided intake that builds the note automatically | More complete inputs without requiring a long essay | Still depends on an HR user asking and recording answers | Implemented |
| Short pre-meeting pulse questionnaire | Lets the employee answer privately before a meeting | Requires identity, delivery, access, retention, and confidentiality design | Candidate for later validation |
| Consent-based meeting note or transcript import | Captures more detail with less manual typing | High privacy, consent, redaction, and accuracy risk | Not built in V0 |
| Automatic collection from work systems | Could surface context and records | Can become employee monitoring and requires integrations, permissions, and governance | Explicitly out of V0 scope |

“Automatic” in this V0 means automatically composing structured answers and turning analysis into meeting preparation. It does not mean monitoring employees or ingesting workplace communications.

## Team

- **Jake + Takeshi:** prototype development, AI logic, deployment, debugging
- **Sydney:** research synthesis, anonymized testing scenarios, employee test plan, feedback collection, and presentation evidence

## Prototype success criteria

Before the final presentation, we want to be able to truthfully say:

> We identified an organizational problem through employee interviews, co-developed the direction with PENCIL HR, built a working AI prototype, and tested it with real PENCIL employees.

## Privacy and safety rules

- Do not commit real employee names, private HR cases, client information, or confidential PENCIL data.
- Use anonymized or fictionalized scenarios in the repository.
- Do not store or infer medical or neurodevelopmental diagnoses.
- Use only employee needs/preferences that were explicitly provided.
- AI output must always be reviewed by a human.
- The prototype must not make disciplinary, legal, hiring, firing, promotion, or compensation decisions.

## Repository docs

See `/docs` for the problem statement, Hitomi-san feedback, prototype plan, and employee test plan.
