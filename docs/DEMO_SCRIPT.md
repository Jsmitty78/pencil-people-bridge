# PENCIL Bridge Demo Script

## Before the meeting

1. Pull the latest bridge-system-v1 branch.
2. Run npm install and npm run dev.
3. Open http://localhost:3000.
4. Keep the interface in Japanese for PENCIL staff. Use the EN button when English explanation is helpful.
5. Do not enter confidential or identifiable staff data without explicit company approval.

## Five-minute demonstration

### 1. Problem and promise — 30 seconds

“Information is being communicated, but decisions do not always remain as shared understanding. PENCIL Bridge finds possible gaps across existing records without scoring employees or asking staff to use another tool.”

Japanese:

「情報は伝達されていますが、判断内容が共通理解として残らない場合があります。PENCIL Bridgeは、社員を評価したり新しい入力作業を増やしたりせず、既存記録から認識のズレ候補を見つけます。」

### 2. Working pipeline — 90 seconds

Open Data & Detection / データ登録・検知.

1. Select Load 10 fictional cases / 架空の10案件を読み込む.
2. Point out that two cases and six messages are stored in the browser-local database.
3. Select Run detection pipeline / 検知パイプラインを実行.
4. Show the detected contradiction, undocumented verbal decision, rework count, and original evidence.
5. Explain that optional local Ollama analysis can supplement the deterministic checks.

Say clearly:

“This is a working stored-data-to-detection flow. The current data is fictional and the live company connectors are not implemented.”

### 3. HR workflow — 60 seconds

Open Review queue / 確認キュー.

1. Select BLG-1234.
2. Show the decision history across the meeting, Backlog, and Chatwork.
3. Show Mark false positive, Add to follow-up, and Mark reviewed.
4. Explain that AI produces review candidates, while HR makes the decision.

### 4. Business value — 60 seconds

Open Business value / 事業価値.

1. Show the HR, manager, and company Before → After tables.
2. Change one calculator assumption to demonstrate transparent calculation.
3. State that the figures are illustrative and must be replaced with PENCIL-validated inputs.
4. Explain the three value sources: HR discovery time, avoided rework, and faster resolution.

### 5. Pilot and roadmap — 60 seconds

On Business value, show:

Detect → Understand → Act → Improve

Then open Connection design / 接続設計 and explain the proposed pilot:

- one approved department
- four weeks
- read-only access
- issue-level analysis
- original text retained in source systems where possible
- HR-only review

## Questions for engineers

1. How consistently are Backlog issue IDs used in Chatwork?
2. Which API events reliably represent a return or rework?
3. Can meeting records include a related issue ID or URL?
4. Can read-only access be limited by department and time?
5. Can Bridge store reference IDs and HR decisions without retaining source messages?

## Questions for staff feedback

1. Is this detection useful?
2. Would this information be welcome?
3. Could this be used in real work?
4. What was inaccurate or missing?

## Honest closing

“Today we demonstrated a working local pipeline with fictional data. The next validation is not a company-wide connection. It is a permission-reviewed, read-only pilot that tests detection usefulness, false positives, HR review time, rework time, and resolution time.”
