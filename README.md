# PENCIL People Bridge

Working AI prototype for the PENCIL Internship 2026.

> **Core principle:** AI organizes the problem. Humans handle the relationship.

## What we are building

After employee interviews and direct validation with PENCIL HR, our current direction combines two ideas:

1. **HR Issue Organizer** — help HR separate facts, interpretations, concerns/emotions, missing information, desired outcomes, and neutral questions to clarify.
2. **Manager Communication Support** — help managers prepare communication based only on an employee's explicitly stated needs and working preferences.

The AI does **not** decide who is right, diagnose employees, or replace HR/manager judgment.

## Current progress

### Prototype V0 — in progress

The `prototype-v1` branch now contains the first real MVP slice:

- Japanese-first web interface
- Anonymized workplace-note input
- Real OpenAI API route using the Responses API
- Structured HR output for:
  - Facts
  - Interpretations
  - Concerns / emotions
  - Missing information
  - Questions to clarify
  - Desired outcomes
  - Possible next steps
- Human-review warning
- Privacy/diagnosis guardrails

**Next:** build Manager Communication Support, then test the prototype with real PENCIL employees using anonymized scenarios.

## Run the V0 locally

```bash
git clone https://github.com/Jsmitty78/pencil-people-bridge.git
cd pencil-people-bridge
git checkout prototype-v1
npm install
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local
npm run dev
```

Then open `http://localhost:3000`.

## MVP flow

1. HR enters anonymized notes about a workplace concern.
2. AI organizes the issue without deciding who is right or wrong.
3. HR reviews and corrects the output.
4. AI identifies missing information and neutral clarification questions.
5. HR/manager enters the employee's **stated** communication preferences.
6. AI suggests a manager conversation approach and follow-up structure.
7. Humans make all final decisions and handle the relationship.

## Team

- **Jake + Takeshi:** prototype development, AI logic, deployment, debugging
- **Sydney:** research synthesis, anonymized testing scenarios, employee test plan, feedback collection, and presentation evidence

## Prototype success criteria

Before the final presentation, we want to be able to truthfully say:

> We identified an organizational problem through employee interviews, co-developed the direction with PENCIL HR, built a working AI prototype, and tested it with real PENCIL employees.

## Privacy and safety rules

- Do not commit real employee names, private HR cases, client information, or confidential PENCIL data.
- Use anonymized or fictionalized scenarios in the repository.
- Do not store or infer medical or neurodevelopmental diagnoses.
- Use only employee needs/preferences that were explicitly provided.
- AI output must always be reviewed by a human.
- The prototype must not make disciplinary, legal, hiring, firing, promotion, or compensation decisions.

## Repository docs

See `/docs` for the problem statement, Hitomi-san feedback, prototype plan, and employee test plan.
