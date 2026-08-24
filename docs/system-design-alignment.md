# System Design Alignment

| Design-document requirement | Concept prototype | Four-week pilot |
| --- | --- | --- |
| Backlog issue as anchor | Implemented with fictional issue records | Replace demo adapter with approved Backlog connector |
| Weekly automatic collection | Demonstrated as one-click weekly batch | Schedule approved connectors |
| Chatwork input | Fictional Chatwork records | Approved Chatwork connector |
| Meeting-minutes input | Fictional meeting decisions | Internal minutes-system connector |
| Rework counter without LLM | Implemented deterministically | Calibrate event definition and threshold |
| Contradiction detection | Local Ollama NLI plus explicit fallback | Evaluate precision and tune prompt/model |
| Off-record reference detection | Implemented with Japanese/English patterns | Expand patterns and measure false positives |
| Cross-channel consistency | Implemented in fictional examples | Validate issue-to-meeting linkage |
| HR-only output | Implemented | Add authentication and access control |
| Notion weekly page | Represented by report view | Generate through Notion API |
| False-positive logging | Interactive session state | Persistent approved storage |
| Names replaced with roles | Fictional records use roles only | Anonymize at retrieval |
| Zero frontline operation | No employee/manager interface | Confirm operational acceptance |
| No emotion or individual scoring | Implemented | Preserve in governance policy |
| Interview-question package | Implemented | Validate usefulness with HR |
