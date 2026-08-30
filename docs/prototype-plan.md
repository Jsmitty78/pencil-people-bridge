# Prototype Plan — PENCIL People Bridge

## Current product direction

**Organizational challenge:** As PENCIL grows and employee backgrounds and working styles become more diverse, workplace concerns can reach HR with reported events, interpretations, emotions, and missing context mixed together. This can slow fact-finding and make the next human conversation harder to prepare.

The prototype does not treat international employees or any employee group as the problem.

**Product principle:** AI organizes the problem. Humans handle the relationship.

## V0 — HR Issue Organizer

**Status: working prototype on `prototype-v1`**

Current implementation includes:

- Japanese-first responsive web interface
- Guided anonymized intake plus a free-form alternative
- Information-completeness indicator
- Local AI through Ollama and `qwen3:4b`
- Structured output for reported events/claims, interpretations, concerns/emotions, missing information, clarification questions, desired outcomes, and possible next steps
- Safety filtering for diagnoses and prohibited employment/legal decisions
- Editable HR review with add, delete, and rewrite controls
- Explicit HR approval before meeting preparation is unlocked
- Before/during/after meeting-preparation view
- Copy action for the HR-reviewed summary
- GitHub Actions build workflow

## What remains before the final presentation

### Must complete

1. Run the complete flow on the three fictional scenarios in `docs/employee-pilot-kit.md`.
2. Fix only failures that would block an employee test.
3. Test with at least one HR participant and two to four managers or staff who prepare workplace conversations.
4. Record anonymized, aggregate results only.
5. Implement the highest-value correction found in testing.
6. Freeze the prototype by Thursday evening and preserve a known-working demo setup.
7. Merge or reconcile `prototype-v1` with `main` only after the demo version is stable.

### Do not build this week unless testing proves it is necessary

- Chatwork or Backlog integration
- Employee accounts or SSO
- Automatic monitoring or ingestion of workplace communications
- Real HR case storage
- Medical or neurodevelopmental inference
- Automated disciplinary, hiring, firing, promotion, compensation, or legal decisions
- Real-time transcription
- A broad employee analytics dashboard

## Later direction — Manager Communication Support

Possible later inputs:

- HR-reviewed issue summary
- Employee's explicitly stated communication needs and preferences

Possible later outputs:

- Suggested conversation approach
- What to clarify first
- Neutral questions
- Communication considerations
- What to avoid
- Written follow-up structure
- Items to document afterward

This later direction must be presented as a roadmap unless it is separately built and tested.

## Definition of success

A successful internship result is not the largest app. It is a defensible chain of evidence:

1. Interviews identified a real organizational friction.
2. HR helped select and shape the direction.
3. The team built a privacy-conscious working prototype.
4. PENCIL employees tested it using fictional or anonymized scenarios.
5. The team measured usefulness, objectivity, incorrect assumptions, preparation support, and willingness to use it.
6. The final recommendation explains limitations, governance, and the next pilot step.
