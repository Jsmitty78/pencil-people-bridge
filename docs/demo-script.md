# PENCIL Bridge — 90-Second Demo Script

## Before presenting

1. Checkout `bridge-system-v1`.
2. Run `npm install`.
3. Optional local NLI: run `ollama pull qwen3:4b` and `ollama serve`.
4. Run `npm run dev`.
5. Open `http://localhost:3000`.
6. Keep the page at the initial state before analysis.

## Spoken demo

### 0–15 seconds — Problem and boundary

“PENCIL's challenge is not a foreign-employee language problem. Information is communicated, but the background and decision path are not always retained as shared understanding. PENCIL Bridge does not score employees or emotions. It narrows down what HR should check.”

### 15–30 seconds — Existing systems, zero frontline operation

Point to the three source cards.

“In a four-week pilot, approved connectors would read existing Backlog issues, related Chatwork threads, and meeting minutes once a week. Employees and managers do not operate a new tool. The Backlog issue is the anchor, and names are replaced by role labels at retrieval.”

State clearly:

“This demonstration uses fictional records. These systems are not connected yet.”

### 30–45 seconds — Run analysis

Select **今週のログを分析**.

“Layer one counts revision events without an LLM. Layers two and four compare instructions using local NLI, while layer three checks for references to decisions that are missing from the available record.”

### 45–65 seconds — Cross-channel result

Open BLG-1234.

“The meeting decided to prioritize simplicity, but the execution-phase Chatwork message asks for more selling points. The system does not conclude that anyone made a mistake. It shows both records together and generates a neutral question for HR.”

### 65–78 seconds — Off-record result

Move to BLG-1189.

“Here, the system finds phrases such as ‘as confirmed verbally’ and ‘the specification discussed earlier,’ but the referenced decision is not available in the issue record. This is a structural signal that shared understanding may not have been retained.”

### 78–90 seconds — Human decision and learning loop

Select **面談メモに追加**, then **誤検知として記録** on one result.

“HR decides whether to use the question or mark the signal as incorrect. False positives become tuning data. AI finds where to look; humans handle the relationship.”

## Claims we may make

- The interface and fictional detection pipeline work.
- Rework counting is deterministic.
- The prototype can use local Ollama NLI and has a labeled deterministic fallback.
- The design is issue-level, HR-only, and does not use emotion or individual scores.
- The next step is a privacy-reviewed four-week pilot on one or two Consulting Division projects.

## Claims we must not make

- Backlog, Chatwork, meeting minutes, or Notion are already connected.
- The fictional thresholds are validated PENCIL averages.
- The detector is proven accurate on PENCIL data.
- The design eliminates turnover or rework.
- Cross-channel detection is definitely unique worldwide.
- Employee consent, APPI compliance, or internal information-security approval is complete.
