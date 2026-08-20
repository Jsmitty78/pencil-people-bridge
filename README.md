# PENCIL People Bridge

AI-supported prototype for the PENCIL Internship 2026.

## Goal

Build and test a working AI assistant that helps HR and managers handle workplace concerns more clearly while keeping human judgment and relationships at the center.

**Core principle:** AI organizes the problem. Humans handle the relationship.

## Current validated direction

The prototype combines two functions:

1. **HR Issue Organizer**
   - Turn messy or emotional notes into a structured view.
   - Separate facts, interpretations, concerns/emotions, missing information, desired outcomes, and questions to clarify.
   - Never decide who is right or wrong.

2. **Manager Communication Support**
   - Help managers prepare how to communicate with an employee based on the employee's stated needs and working preferences.
   - Examples: written follow-up, clearer priorities, smaller task steps, more processing time, direct feedback.
   - Never diagnose, label, or infer medical/neurodevelopmental conditions.

A communication-clarity checker may be added later as a supporting feature.

## MVP flow

1. HR enters anonymized notes about a workplace concern.
2. AI organizes the issue objectively.
3. HR reviews and corrects the output.
4. AI identifies missing information and useful clarification questions.
5. HR/manager enters the employee's stated communication preferences.
6. AI generates a suggested conversation approach and follow-up structure.
7. Human HR/manager makes all final decisions.

## Team

- **Jake + Takeshi:** prototype development, AI logic, deployment, debugging
- **Sydney:** research synthesis, anonymized test scenarios, employee testing plan, feedback collection, results for presentation

## Prototype success criteria

Before the final presentation, we want to be able to truthfully say:

> We identified an organizational problem through employee interviews, co-developed the solution direction with PENCIL HR, built a working AI prototype, and tested it with real PENCIL employees.

## Privacy rules

- Do not commit real employee names, private HR cases, client information, or confidential PENCIL data.
- Use anonymized or fictionalized scenarios in the repository.
- Do not store medical diagnoses or infer them with AI.
- AI output must always be reviewed by a human.

## Tonight's target

A working V0 prototype with:

- Japanese-first interface
- Workplace concern text input
- Real AI analysis
- Structured HR output
- Manager communication support
- Human-review warning
- Simple feedback form

See `/docs` for the problem statement, prototype plan, and employee test plan.
