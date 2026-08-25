# PENCIL Bridge

An HR-only concept prototype for finding gaps in shared understanding across existing operational records.

> From translation to shared understanding.

## What the demo shows

PENCIL Bridge groups approved Backlog, Chatwork, and meeting records around an issue or work product. It then prepares evidence-backed review candidates for HR without asking employees to use another tool.

The current bridge-system-v1 demo includes:

- a weekly overview with the small number of issues that need attention
- an interactive HR review queue with open and completed filters
- source-level evidence tracing across Backlog, Chatwork, and meeting records
- issue-level rework and cross-channel mismatch signals
- HR actions for interview follow-up, confirmation, and false-positive feedback
- a working CSV export for the weekly review
- a connection-design screen for engineering validation
- a complete Japanese/English language toggle, including case evidence and CSV output
- responsive layouts for laptop, tablet, and phone

Every issue ID, message, count, average, and threshold in the demo is fictional.

## Proposed workflow

1. Agree on company approval, pilot department, access scope, retention, and HR permissions.
2. Read only the minimum approved records.
3. Group records around a Backlog issue ID or work product, never around a person.
4. Detect contradictory instructions, undocumented decisions, and unusual rework.
5. Show the original evidence and a situation-specific question to HR.
6. Let HR confirm, dismiss, or add the case to interview follow-up.

## Run locally

    git clone https://github.com/Jsmitty78/pencil-people-bridge.git
    cd pencil-people-bridge
    git checkout bridge-system-v1
    npm install
    npm run dev

Open http://localhost:3000.

## Honest prototype boundary

Implemented:

- fictional issue-level data
- interactive review workflow
- evidence timelines
- review-state feedback
- CSV export
- proposed read-only connection model

Not implemented:

- real Backlog, Chatwork, or meeting-record connectors
- persistent HR decisions
- production authentication and access controls
- an approved storage or retention policy
- a completed privacy, security, or APPI review

## Guardrails

- HR-only output
- issue and work-product analysis, never employee scoring
- no emotion, stress, personality, or sensitive-trait inference
- no automated HR decisions
- every signal is a review candidate, not a conclusion
- original evidence must remain available to the human reviewer
- no confidential PENCIL data is stored in this repository

## Suggested pilot

Start with one approved department for four weeks using read-only access. A useful success test is whether HR can complete the weekly review in under 30 minutes and identify at least one real source of preventable rework earlier than the current process.
