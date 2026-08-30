# PENCIL Bridge — 90-Second Demo Script

## Before presenting

1. Checkout `bridge-system-v1`.
2. Run `npm install`.
3. Run `npm run dev` without enabling Ollama for the most predictable demonstration.
4. Open `http://localhost:3000`.
5. Keep the page at the initial state before analysis.

## Spoken demo

### 0–15 seconds — Problem and honest boundary

“PENCIL's challenge is not a foreign-employee language problem. Information is communicated, but the background and decision path are not always retained as shared understanding. This is a working concept prototype with fictional data. It is not connected to company systems.”

### 15–30 seconds — Permission first, no new staff tool

Point to **STEP 0** and the four-step flow.

“If PENCIL grants permission, we would first agree the departments, read-only scope, retention, anonymization, and HR access. Staff would continue using Backlog, Chatwork, meeting records, and the Excel file HR already uses. We are not asking them to adopt another tool.”

### 30–45 seconds — Run the proposed flow

Select **架空データで動作を見る**.

“The prototype groups records at issue and work-product level. It counts rework, compares contradictory instructions, and flags references to decisions that are missing from the available record. During this internship, these are fictional adapters rather than real connectors.”

### 45–62 seconds — Excel weekly output

Point to the Excel-style summary.

“Instead of sending HR into a new dashboard, the result is prepared as a weekly Excel workbook: summary, review candidates, interview notes, and false-positive history. Normal items remain visible in the summary, while detailed evidence is reserved for candidates that need review.”

### 62–78 seconds — Evidence, not judgment

Move to BLG-1234.

“The meeting record and Chatwork instruction point in different directions. The system does not decide who is right or score an employee. It shows the evidence together and prepares a neutral question for HR.”

### 78–90 seconds — Human decision and next step

Select **面談メモに追加**, then **誤検知として記録** on one result.

“HR decides whether to use the question or mark the signal as incorrect. If the concept is approved after the internship, the next responsible step is a privacy-reviewed, read-only pilot with a narrow scope. AI finds where to look; humans handle the relationship.”

## Claims we may make

- The interface and fictional detection pipeline work.
- The proposal shows how permission, read-only sources, and Excel output fit together.
- Rework counting is deterministic.
- The prototype can use local Ollama NLI and has a deterministic fallback.
- The design is issue-level, HR-only, and does not use emotion or individual scores.
- No additional employee or manager input is required in the proposed flow.

## Claims we must not make

- Backlog, Chatwork, meeting records, or Excel storage are already connected.
- The prototype has been tested with staff or company data.
- The fictional thresholds are validated PENCIL averages.
- The detector is proven accurate on PENCIL data.
- The design eliminates turnover or rework.
- Employee consent, APPI compliance, or internal information-security approval is complete.

