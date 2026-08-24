# PENCIL Context Bridge

Working local-AI prototype for the PENCIL Internship 2026.

> **Core principle:** 「情報は伝わっている。でも、共通理解として残っていない。」
>
> **Direction:** 「翻訳から、共通理解へ。」

## Current prototype

The `prototype-v1` branch is now the **Pre-Send Context Check** validated through PENCIL employee interviews and direct HR feedback.

An employee pastes a draft message intended for Chatwork, Backlog, email, or another work tool. The local AI checks whether the message contains enough context for another person to act on it with the same understanding.

The prototype checks:

- Purpose / why the message is being sent
- Background and prior context
- Requested action
- Expected output / definition of done
- Owner
- Deadline
- Reference material, link, ticket, or prior message
- Decision / approval owner when relevant
- Ambiguous wording and implicit assumptions
- Conflicting instructions

It then produces:

- A clarity score
- Clear / unclear / missing context indicators
- Misunderstanding risks
- Questions to confirm before sending
- A rewritten Japanese message
- Optional English version
- Copy-ready output for Chatwork / Backlog

## HR-provided anonymized evidence implemented

The prototype includes short anonymized test examples derived from communication logs supplied by PENCIL HR. No real employee names or identifying information are included.

Examples include:

1. A link/document shared without explaining its purpose or what the recipients are expected to do.
2. A request using a broad deadline such as 「面談まで」 without an exact time/date.

The AI prompt also incorporates communication patterns supported by the HR log:

- 「具体的に」 should clarify **いつまでに・何を・どうする**.
- Completion may require review/approval, not just finishing the sender's own work.
- When resending or correcting a message, explain why so it is not mistaken for an accidental duplicate.
- Confirm ambiguous instructions before creating a new task, format, or deliverable based on assumptions.
- If an established company format/process exists, confirm before changing it.

These rules are used to improve clarity, **not** to judge politeness, personality, competence, nationality, or employee performance.

## Run locally

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

If you already have the repository locally:

```bash
git checkout prototype-v1
git pull origin prototype-v1
npm install
ollama serve
npm run dev
```

## Local AI

The real prototype continues to use **Ollama locally** rather than an external API.

Default model:

```text
qwen3:4b
```

Optional environment variables:

```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:4b
```

## Future vision from HR feedback

PENCIL HR strongly validated the pre-send check and suggested a future version that could, with appropriate consent and privacy controls, use existing personality / communication-style assessment data to adjust a message for the specific recipient.

That feature is **not implemented** in the current prototype. The current prototype does not ingest, store, infer, or classify personality, medical, or neurodevelopmental information.

## Privacy and safety

- Do not input real employee names, private HR cases, client names, or confidential PENCIL information during testing.
- Use anonymized or fictional scenarios only.
- Inputs are not persisted by the application.
- Do not infer medical, mental-health, personality, or neurodevelopmental diagnoses.
- AI does not make disciplinary, legal, hiring, firing, promotion, compensation, or performance decisions.
- Missing information is left as a confirmation placeholder rather than invented.

## Backup

The previous HR Issue Organizer V0 was preserved before this change on:

```text
prototype-v1-hr-organizer-backup
```
