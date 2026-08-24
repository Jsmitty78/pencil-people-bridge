# Final Week Execution Plan

## Outcome for Saturday, August 29

By the final presentation, the team should be able to say:

> We identified a real organizational friction through employee interviews, validated the direction with PENCIL HR, built a working local-AI prototype, tested it with PENCIL employees using non-confidential scenarios, measured the results, and improved the prototype based on feedback.

Final presentation window: Saturday, August 29, 10:00–14:00. Working assumption from the program briefing: 8-minute presentation plus 5-minute Q&A.

## Monday, August 24 — Prove the prototype is test-ready

### Jake + Takeshi

- Pull `prototype-v1` and run `npm install`.
- Run `ollama pull qwen3:4b`, `ollama serve`, and `npm run dev`.
- Complete all three scenarios in `docs/employee-pilot-kit.md`.
- Check that guided intake, AI output, HR editing, approval, copy, and meeting preparation all work.
- Record every blocker. Fix only test-blocking issues.
- Confirm the laptop, browser, charger, and local model that will be used for employee sessions.

### Sydney

- Prepare tester invitations and the anonymous result sheet from the pilot kit.
- Confirm one HR tester and two to four additional testers.
- Schedule 20-minute sessions for Monday afternoon or Tuesday.
- Prepare one slide summarizing interview evidence and Hitomi-san's direction ranking.

### Team decision by end of day

- Go: the complete flow works on at least two fictional scenarios.
- Conditional go: the flow works with a documented workaround.
- Stop and simplify: AI output is unreliable or the local setup cannot run consistently.

Do not add Manager Communication Support before this gate.

## Tuesday, August 25 — Run the first employee pilot

- Run three to five short sessions.
- Use tester IDs such as T1, T2, and T3. Do not record names in the repository.
- Capture task time, ratings, incorrect assumptions, use intent, and one optional quote with explicit permission.
- Ask each tester for the single most important change.
- Hold a 30-minute team synthesis at the end of the day.
- Choose one improvement based on frequency, severity, and feasibility.

## Wednesday, August 26 — Improve and retest

- Implement the single highest-value improvement.
- Run the same scenario before and after the change when possible.
- Retest with at least one earlier tester or one new tester.
- Freeze the problem statement and solution scope.
- Begin the presentation with real aggregate results, not expected benefits.

## Thursday, August 27 — Freeze the product and build the story

- Stop feature development by the end of the day.
- Save screenshots of input, AI draft, HR review, and meeting preparation.
- Prepare a 60–90 second live-demo path plus screenshots as backup.
- Reconcile documentation with the actual product.
- Prepare the 8-minute narrative:

1. PENCIL's growth context
2. Interview evidence
3. Defined organizational challenge
4. Why current handling can lose clarity
5. People Bridge solution and human decision boundary
6. Live demo
7. Pilot results and improvement
8. Recommended 30-day internal pilot

## Friday, August 28 — Rehearse and challenge the proposal

- Rehearse until the presentation consistently finishes in 7:30–7:45.
- Run one hostile Q&A round.
- Verify every numeric claim and remove any unproven claim.
- Test the demo offline and after restarting the laptop.
- Keep the final model downloaded locally.
- Export the deck and screenshots to a second device.

## Saturday, August 29 — Present evidence, not software volume

Recommended ownership:

- Jake: challenge framing, product logic, demo, closing recommendation
- Sydney: interview evidence, pilot method, results
- Takeshi: Japanese context, workflow fit, implementation and governance

## Q&A answers the team must prepare

- Why is this PENCIL's most important organizational challenge?
- How is this different from using ChatGPT directly?
- How did you protect employee privacy?
- How do you prevent AI hallucinations and bias?
- Why does HR still need to review every section?
- What did real testers say?
- What evidence would make PENCIL stop the pilot?
- How could this fit existing PENCIL workflows without adding tool overload?
