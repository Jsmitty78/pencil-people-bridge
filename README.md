# PENCIL Bridge — Permission-Gated Excel Workflow Prototype

Concept prototype aligned with the August 24, 2026 system design document.

> **Information is communicated. However, it is not retained as shared understanding.**

## What this branch demonstrates

The `bridge-system-v1` branch demonstrates an HR-only weekly review concept without asking staff to adopt another tool:

0. Company permission, scope, retention, anonymization, and HR access are agreed before any connection.
1. Approved Backlog, Chatwork, and meeting records would be read without additional staff input.
2. Records are grouped at issue/work-product level rather than employee level.
3. Rework, contradictory instructions, off-record references, and cross-channel mismatches are identified as review candidates.
4. Only flagged issues, evidence, and situation-specific interview questions are prepared for HR.
5. The weekly output is formatted as the Excel workbook HR already uses.
6. HR can add a finding to interview notes or record it as a false positive.

The included records, issue IDs, messages, counts, averages, and thresholds are fictional demonstration data.

Design reference: [PENCIL Bridge — Excel Workflow Concept](https://www.figma.com/design/RAX4Z62Ib6LLJRqA1WnvuS)

## Honest prototype boundary

Implemented now:

- issue-level fictional dataset
- deterministic rework counting
- off-record reference detection
- cross-channel comparison
- optional local Ollama NLI with deterministic fallback
- HR weekly-review dashboard
- Excel-style weekly summary, review-candidate, interview-note, and false-positive sheets
- suggested interview questions
- false-positive and interview-queue interactions
- no employee names, emotion scores, or individual rankings

Future permission-gated pilot work, not implemented during the internship:

- real Backlog API connector
- real Chatwork API connector
- internal meeting-minutes connector
- automated role-label anonymization at retrieval
- Excel file generation and approved storage-location integration
- persistent false-positive storage
- privacy, consent, access-control, and APPI review

## Run locally

```bash
git clone https://github.com/Jsmitty78/pencil-people-bridge.git
cd pencil-people-bridge
git checkout bridge-system-v1
npm install

# Recommended for the boss demonstration
npm run dev

# Optional only after local NLI has been tested
ollama pull qwen3:4b
ollama serve
ENABLE_LOCAL_NLI=true npm run dev
```

Open `http://localhost:3000` and select **架空データで動作を見る**.

For the most reliable boss demonstration, run `npm run dev` without `ENABLE_LOCAL_NLI`. The prototype then uses clearly labeled deterministic concept-demo rules. Enable local NLI only when Ollama has already been tested on the presentation laptop.

## Presentation framing

Do not claim that PENCIL's systems are already connected. Present this build as:

> A working concept prototype that shows how the experience could work after permission is granted. It uses fictional issue-level records, has no live connectors, and prepares the result in the Excel format HR already uses. A later limited pilot could replace the fictional adapters with approved, privacy-reviewed read-only connectors.

## Safety principles

- HR-only output
- issue/work-product level, never employee scoring
- no emotion or psychological-safety scoring
- no diagnosis or sensitive-trait inference
- signals are review candidates, not conclusions
- human HR confirmation is required
- no confidential PENCIL data in the repository
