# Prototype Plan — PENCIL People Bridge

## Build order

### V0 — HR Issue Organizer
**Status: started on `prototype-v1`**

Current implementation includes:
- Japanese-first web screen
- anonymized workplace note input
- real OpenAI Responses API route
- structured output for facts, interpretations, concerns, missing information, clarification questions, desired outcomes, and possible next steps
- human-review warning
- no-diagnosis / no-employment-decision guardrails

Remaining V0 work:
- run locally and resolve any build/runtime issues
- improve structured-output reliability
- add 3 fictional/anonymized test fixtures
- add copy/export action
- add simple tester feedback input

### V1 — Manager Communication Support
Inputs:
- reviewed HR issue summary
- employee's explicitly stated communication needs/preferences

Outputs:
- suggested conversation approach
- what to clarify first
- useful questions
- communication considerations
- what to avoid
- written follow-up suggestion
- what should be documented afterward

### V2 — Employee pilot
- test with HR
- test with managers
- collect aggregate scores and comments
- implement highest-value feedback

## Guardrails
- AI organizes; humans decide.
- Never diagnose or infer employee conditions.
- Never decide who is right or wrong.
- Never make hiring, firing, promotion, compensation, disciplinary, or legal decisions.
- Repository examples must be anonymized or fictionalized.

## Definition of a successful internship prototype
A deployed working prototype that real PENCIL employees can use on anonymized scenarios, with measured feedback that can be shown in the final presentation.
