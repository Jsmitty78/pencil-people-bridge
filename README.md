# PENCIL Bridge V2

An HR-only concept prototype for finding gaps in shared understanding across existing operational records.

> From translation to shared understanding.

## What the demo shows

PENCIL Bridge groups approved Backlog, Chatwork, and meeting records around an issue or work product. It then prepares evidence-backed review candidates for HR without asking employees to use another tool.

V2 incorporates the Aug 25 engineer feedback and includes:

- a weekly overview with the small number of issues that need attention
- an interactive HR review queue with open and completed filters
- source-level evidence tracing across Backlog, Chatwork, and meeting records
- issue-level rework and cross-channel mismatch signals
- HR actions for interview follow-up, confirmation, and false-positive feedback
- a working CSV export for the weekly review
- a connection-design screen for engineering validation
- a complete Japanese/English language toggle, including case evidence and CSV output
- a case-entry tool for registering multiple Backlog, Chatwork, and meeting-log cases
- a persistent browser-local IndexedDB database for privacy-safe demonstrations
- a working stored-data to detection pipeline using the existing detection API
- a staff-feedback form saved locally with each detected case
- responsive layouts for laptop, tablet, and phone
- simulated read-only connections for Chatwork, Backlog, meeting transcripts, and a Box workspace
- a visible analyzer dictionary that defines six communication signals before analysis
- contextual acknowledgement-followed-by-clarification detection instead of treating a keyword as proof of understanding
- a simulated 30-minute batch status from collection through analysis
- an interactive weekly HR report and notification state
- separate private HR analysis and HR-approved staff clarification formats
- transcript-confidence labels for meeting evidence
- a one-click demo reset so every tester can start from the same state

Presentation guide: [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)

Every issue ID, message, count, average, and threshold in the demo is fictional.

## Proposed workflow

1. Agree on company approval, pilot department, access scope, retention, and HR permissions.
2. Read only the minimum approved records.
3. Group records around a Backlog issue ID or work product, never around a person.
4. Detect contradictory instructions, undocumented decisions, and unusual rework.
5. Show the original evidence and a situation-specific question to HR.
6. Add selected cases to a weekly HR report and show the notification state.
7. Let HR confirm, dismiss, add the case to interview follow-up, or approve a neutral staff clarification draft.

## Run locally

    git clone https://github.com/Jsmitty78/pencil-people-bridge.git
    cd pencil-people-bridge
    git checkout bridge-system-v1
    npm install
    npm run dev

Open http://localhost:3000.

## Honest prototype boundary

Implemented:

- 10 fictional issue-level cases with 40 messages across three source types
- three clearly labeled foreign-staff scenarios covering deadlines, bilingual documentation, and Japanese writing expectations
- local case and feedback persistence
- manual communication-log input
- deterministic detection with optional local Ollama NLI
- interactive review workflow
- evidence timelines
- review-state feedback
- CSV export
- proposed read-only connection model
- simulated Box collection workspace and connector states
- analyzer signal dictionary and contextual acknowledgement checks
- weekly HR report delivery simulation
- separate HR and staff-safe output formats

Not implemented:

- real Backlog, Chatwork, or meeting-record connectors
- real Box ingestion or external notifications
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
