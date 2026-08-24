# PENCIL Bridge — Cross-Channel Detection Prototype

Concept prototype aligned with the August 24, 2026 system design document.

> **Information is communicated. However, it is not retained as shared understanding.**

## What this branch demonstrates

The `bridge-system-v1` branch replaces the manual HR intake flow with an HR-only weekly review concept:

1. Existing Backlog, Chatwork, and meeting-minute records are grouped by Backlog issue.
2. A deterministic counter identifies unusually high rework.
3. local NLI plus explicit demo rules compare instructions for contradictions.
4. reference patterns flag decisions that may have occurred outside the available record.
5. meeting decisions are compared with execution-phase instructions across channels.
6. Only flagged issues and situation-specific interview questions are shown to HR.
7. HR can add a finding to interview notes or record it as a false positive.

The included records, issue IDs, messages, counts, averages, and thresholds are fictional demonstration data.

## Honest prototype boundary

Implemented now:

- issue-level fictional dataset
- deterministic rework counting
- off-record reference detection
- cross-channel comparison
- optional local Ollama NLI with deterministic fallback
- HR weekly-review dashboard
- suggested interview questions
- false-positive and interview-queue interactions
- no employee names, emotion scores, or individual rankings

Four-week pilot roadmap, not implemented:

- real Backlog API connector
- real Chatwork API connector
- internal meeting-minutes connector
- automated role-label anonymization at retrieval
- Notion API output
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

Open `http://localhost:3000` and select **今週のログを分析**.

For the most reliable boss demonstration, run `npm run dev` without `ENABLE_LOCAL_NLI`. The prototype then uses clearly labeled deterministic concept-demo rules. Enable local NLI only when Ollama has already been tested on the presentation laptop.

## Presentation framing

Do not claim that PENCIL's systems are already connected. Present this build as:

> A working concept prototype that demonstrates the detection logic and HR experience using fictional issue-level records. A four-week pilot would replace the fictional adapters with approved, privacy-reviewed connectors for one or two Consulting Division projects.

## Safety principles

- HR-only output
- issue/work-product level, never employee scoring
- no emotion or psychological-safety scoring
- no diagnosis or sensitive-trait inference
- signals are review candidates, not conclusions
- human HR confirmation is required
- no confidential PENCIL data in the repository
