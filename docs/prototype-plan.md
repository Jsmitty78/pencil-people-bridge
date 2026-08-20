# Prototype Plan

## V0 scope

Build only what is necessary to test the core idea with real PENCIL employees.

### Screen 1: HR Issue Organizer

Input:
- An anonymized workplace concern or HR note

AI output:
- Facts
- Interpretations
- Concerns / emotions
- Missing information
- Questions to clarify
- Desired outcome
- Possible next steps

Rules:
- Do not decide who is right or wrong.
- Do not infer diagnoses or protected/sensitive traits.
- Clearly mark uncertainty.
- Require human review before use.

### Screen 2: Manager Communication Support

Inputs:
- Structured issue summary
- Employee's stated communication preferences / needs

AI output:
- Suggested conversation approach
- What to clarify first
- Questions to ask
- Communication considerations
- What to avoid
- Suggested written follow-up
- Items to document afterward

### Screen 3: Feedback

Collect:
- Role: HR / Manager / Staff
- Usefulness score (1–5)
- Objectivity score (1–5)
- Did AI add an incorrect assumption? Yes/No
- Would this reduce preparation time? 1–5
- Would you use this at work? Yes / Maybe / No
- Free-text feedback

## Suggested stack

- Next.js + TypeScript
- Tailwind CSS
- Server-side LLM API route
- Structured JSON responses
- Simple local/hosted anonymous feedback storage for testing

## V0 non-goals

Do not build yet:
- Chatwork API integration
- Backlog API integration
- Employee accounts / SSO
- Medical or neurodevelopmental diagnosis features
- Real HR case database
- Automated disciplinary decisions
- Real-time meeting transcription

## Definition of done for tonight

- App runs locally
- Real AI call works
- HR organizer produces structured output
- Manager-support flow works
- Japanese-first interface is usable
- No confidential data required
- Basic feedback can be recorded
